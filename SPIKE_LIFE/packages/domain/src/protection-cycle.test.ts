import { describe, expect, it } from 'vitest'
import {
  Simulation,
  startPlanningCycle,
  submitDecision,
  runProtectionStressPlanningCycle,
  PROTECTION_STRESS_EVENT_ID,
  PROTECTION_STRESS_MEDICAL_COST,
} from './index.js'

const SAMPLE_REFLECTION = [
  { promptId: 'what_happened', response: 'Protection readiness improved after the health scare.' },
  { promptId: 'why_happened', response: 'FNA showed critical protection gaps for the family.' },
  { promptId: 'what_worked', response: 'Strengthening plans before spending on lifestyle.' },
  { promptId: 'what_change', response: 'Would act on protection gaps earlier.' },
  { promptId: 'advise_other', response: 'Health events reveal gaps — run FNA immediately.' },
]

describe('Protection Stress Financial Decision Cycle (Scenario 2)', () => {
  it('applies medical cost and care expenses on family health event', () => {
    const state = startPlanningCycle('ps-1', 'protection_stress')

    expect(state.situation?.eventId).toBe(PROTECTION_STRESS_EVENT_ID)
    expect(state.situation?.situationKind).toBe('protection_stress')
    expect(state.financialProfile.cash).toBe(75_000 - PROTECTION_STRESS_MEDICAL_COST)
    expect(state.character.dependents).toBe(1)
    expect(state.phase).toBe('decision_pending')
  })

  it('surfaces protection gaps in FNA and recommendations', () => {
    const state = startPlanningCycle('ps-2', 'protection_stress')

    expect(state.fnaBeforeDecision!.protectionScore).toBeLessThan(60)
    const protectionGap = state.fnaBeforeDecision!.gaps.find((g) => g.dimension === 'protection')
    expect(protectionGap?.gapPercent).toBeGreaterThan(50)
    const hasProtectionRec = state.recommendations.some(
      (r) => r.solution.includes('PROTECTION') || r.label.includes('Protection'),
    )
    expect(hasProtectionRec).toBe(true)
  })

  it('never uses insurance product language in recommendations', () => {
    const state = startPlanningCycle('ps-3', 'protection_stress')

    for (const rec of state.recommendations) {
      expect(rec.label.toLowerCase()).not.toContain('buy ')
      expect(rec.label.toLowerCase()).not.toContain('insurance policy')
    }
  })

  it('improves protection score when strengthening protection plans', () => {
    let state = startPlanningCycle('ps-4', 'protection_stress')
    const protectionBefore = state.fnaBeforeDecision!.protectionScore
    state = submitDecision(state, 'improve_protection')

    expect(state.fnaAfterDecision!.protectionScore).toBeGreaterThan(protectionBefore)
    expect(state.consequence?.decisionQuality).toBe('excellent')
  })

  it('flags deferring protection as high risk', () => {
    let state = startPlanningCycle('ps-5', 'protection_stress')
    state = submitDecision(state, 'increase_lifestyle')

    expect(state.consequence?.decisionQuality).toBe('high_risk')
    expect(state.fnaAfterDecision!.protectionScore).toBeLessThanOrEqual(
      state.fnaBeforeDecision!.protectionScore,
    )
  })

  it('completes full protection stress cycle through reflection', () => {
    const state = runProtectionStressPlanningCycle(
      'ps-6',
      'improve_protection',
      SAMPLE_REFLECTION,
    )

    expect(state.phase).toBe('cycle_complete')
    expect(state.scenarioId).toBe('protection_stress')
    expect(state.reflection?.completedAt).not.toBeNull()
  })
})

describe('Simulation aggregate — domain events', () => {
  it('emits domain events through the planning lifecycle', () => {
    const sim = Simulation.createProtectionStress('evt-1')
      .presentSituation()
      .completeDiscovery()

    const discoveryEvents = sim.pullDomainEvents()
    expect(discoveryEvents.some((e) => e.type === 'LifeEventApplied')).toBe(true)
    expect(discoveryEvents.some((e) => e.type === 'FnaSnapshotCreated')).toBe(true)

    sim.recordDecision('improve_protection')
    const decisionEvents = sim.pullDomainEvents()
    expect(decisionEvents.some((e) => e.type === 'DecisionRecorded')).toBe(true)
    expect(decisionEvents.some((e) => e.type === 'LifeScoreUpdated')).toBe(true)
  })
})
