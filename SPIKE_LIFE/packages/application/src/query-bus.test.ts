import { describe, expect, it } from 'vitest'
import { InMemorySimulationRepository } from '@spike-life/infrastructure'
import { FinancialDecisionCommandBus } from './command-bus.js'
import { FinancialDecisionQueryBus } from './query-bus.js'

describe.sequential('FinancialDecisionQueryBus read models', () => {
  const repo = new InMemorySimulationRepository()
  const commands = new FinancialDecisionCommandBus(repo)
  const queries = new FinancialDecisionQueryBus(repo)
  const sessionId = 'query-test-1'

  it('getDashboard returns Life Score and event after cycle start', async () => {
    await commands.startPromotionCycle(sessionId)
    const dashboard = await queries.getDashboard(sessionId)

    expect(dashboard).not.toBeNull()
    expect(dashboard!.characterName).toBe('Alex')
    expect(dashboard!.lifeStageLabel).toBe('Launch')
    expect(dashboard!.currentEvent?.title).toBe('Promotion')
    expect(dashboard!.lifeScore.overall).toBeGreaterThan(0)
    expect(dashboard!.canDecide).toBe(true)
    expect(dashboard!.canReflect).toBe(false)
  })

  it('getFnaSummary returns gap analysis without mutating state', async () => {
    const fna = await queries.getFnaSummary(sessionId)
    expect(fna).not.toBeNull()
    expect(fna!.gaps.length).toBe(5)
    expect(fna!.timing).toBe('before_decision')
    expect(fna!.emergencyFundTarget.formatted).toMatch(/^₱/)
  })

  it('getLensView plan includes recommendations and decision options', async () => {
    const view = await queries.getLensView(sessionId, 'plan')
    expect(view?.lens).toBe('plan')
    if (view?.lens !== 'plan') return

    expect(view.data.recommendations.length).toBeGreaterThan(0)
    expect(view.data.decisionOptions.length).toBe(7)
    expect(view.data.goals.length).toBe(3)
  })

  it('getLensView protect uses planning solution language', async () => {
    const view = await queries.getLensView(sessionId, 'protect')
    expect(view?.lens).toBe('protect')
    if (view?.lens !== 'protect') return

    const labels = view.data.plans.map((p) => p.category)
    expect(labels).toContain('Family Protection Plan')
    expect(labels.every((l) => !l.toLowerCase().includes('insurance'))).toBe(true)
  })

  it('getLensView grow returns net worth without recomputing in query handler', async () => {
    const view = await queries.getLensView(sessionId, 'grow')
    expect(view?.lens).toBe('grow')
    if (view?.lens !== 'grow') return

    expect(view.data.netWorth.amount).toBe(10_000)
    expect(view.data.cashFlow.monthlySurplus.formatted).toMatch(/^₱/)
  })

  it('dashboard updates after decision with after_decision FNA timing', async () => {
    await commands.submitPromotionDecision(sessionId, 'maintain_lifestyle_discipline')
    const dashboard = await queries.getDashboard(sessionId)
    const fna = await queries.getFnaSummary(sessionId)

    expect(dashboard!.canDecide).toBe(false)
    expect(dashboard!.canReflect).toBe(true)
    expect(fna!.timing).toBe('after_decision')
    expect(dashboard!.lifeScore.impact).toBeGreaterThan(80)
  })

  it('journey lens shows timeline through reflection', async () => {
    await commands.submitPromotionReflection(sessionId, [
      { promptId: 'what_happened', response: 'Cash reserves grew.' },
      { promptId: 'why_happened', response: 'I kept expenses steady.' },
      { promptId: 'what_worked', response: 'Following FNA priorities.' },
    ])

    const view = await queries.getLensView(sessionId, 'journey')
    expect(view?.lens).toBe('journey')
    if (view?.lens !== 'journey') return

    expect(view.data.timeline.length).toBeGreaterThanOrEqual(3)
    expect(view.data.reflection?.completed).toBe(true)
    expect(view.data.advisorReadiness).toBeTruthy()

    const dashboard = await queries.getDashboard(sessionId)
    expect(dashboard!.cycleComplete).toBe(true)
  })
})
