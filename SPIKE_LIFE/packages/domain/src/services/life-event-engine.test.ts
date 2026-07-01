import { describe, expect, it, beforeAll } from 'vitest'
import { PHILIPPINES_LIFE_EVENTS } from '@spike-life/content-philippines'
import { validateLifeEventPack } from '@spike-life/content-core'
import { configureLifeEventPack } from './life-event-context.js'
import {
  filterEligibleLifeEvents,
  selectLifeEvent,
  type LifeEventSelectionInput,
} from './life-event-engine.js'
import { FRESH_GRADUATE_FINANCIAL_PROFILE } from '../specifications/fresh-graduate.js'
import { bootstrapTestEncounters } from '../test/encounter-fixture.js'

function baseInput(overrides: Partial<LifeEventSelectionInput> = {}): LifeEventSelectionInput {
  return {
    domainId: 'career',
    age: 22,
    cycleIndex: 1,
    turnNumber: 1,
    lifeStage: 'launch',
    lifeFlags: {},
    eventHistory: [],
    activeStoryArc: null,
    financialProfile: { ...FRESH_GRADUATE_FINANCIAL_PROFILE },
    halfYear: 'H1',
    ...overrides,
  }
}

describe('life-event-engine', () => {
  beforeAll(() => {
    bootstrapTestEncounters()
    validateLifeEventPack(PHILIPPINES_LIFE_EVENTS)
    configureLifeEventPack(PHILIPPINES_LIFE_EVENTS)
  })

  it('blocks promotion when not employed', () => {
    const eligible = filterEligibleLifeEvents(baseInput({ age: 28, cycleIndex: 5 }))
    const ids = eligible.map((e) => e.id)
    expect(ids).not.toContain('career_promotion')
  })

  it('allows first job only after graduation flag', () => {
    const beforeGrad = filterEligibleLifeEvents(baseInput({ age: 22 }))
    expect(beforeGrad.map((e) => e.id)).not.toContain('career_first_job')

    const afterGrad = filterEligibleLifeEvents(baseInput({
      age: 22,
      lifeFlags: { educationCompleted: true },
    }))
    expect(afterGrad.map((e) => e.id)).toContain('career_first_job')
  })

  it('never repeats non-repeatable graduation', () => {
    const input = baseInput({
      domainId: 'education',
      age: 23,
      cycleIndex: 3,
      eventHistory: [{
        lifeEventId: 'career_graduation',
        encounterId: 'education_education_1',
        cycleIndex: 1,
        turnNumber: 1,
        simulationYear: 1,
        recordedAt: new Date().toISOString(),
      }],
    })
    const eligible = filterEligibleLifeEvents(input)
    expect(eligible.map((e) => e.id)).not.toContain('career_graduation')
  })

  it('enforces promotion cooldown', () => {
    const input = baseInput({
      age: 30,
      cycleIndex: 4,
      lifeFlags: { employed: true, educationCompleted: true },
      eventHistory: [
        {
          lifeEventId: 'career_first_job',
          encounterId: 'career_first_job_1',
          cycleIndex: 1,
          turnNumber: 1,
          simulationYear: 1,
          recordedAt: new Date().toISOString(),
        },
        {
          lifeEventId: 'career_promotion',
          encounterId: 'career_promotion_4',
          cycleIndex: 3,
          turnNumber: 3,
          simulationYear: 2,
          recordedAt: new Date().toISOString(),
        },
      ],
    })
    const eligible = filterEligibleLifeEvents(input)
    expect(eligible.map((e) => e.id)).not.toContain('career_promotion')
  })

  it('biases early career arc toward apprenticeship after graduation', () => {
    const input = baseInput({
      domainId: 'career',
      age: 22,
      cycleIndex: 2,
      lifeFlags: { educationCompleted: true },
      eventHistory: [{
        lifeEventId: 'career_graduation',
        encounterId: 'education_education_1',
        cycleIndex: 1,
        turnNumber: 1,
        simulationYear: 1,
        recordedAt: new Date().toISOString(),
      }],
      activeStoryArc: {
        arcId: 'early_career',
        startedAtCycle: 1,
        currentStep: 1,
        expiresAtCycle: 6,
      },
    })
    const picked = selectLifeEvent(input, () => 0.01)
    expect(picked?.lifeEvent.id).toBe('career_apprenticeship')
  })

  it('selects promotion only after tenure and employment', () => {
    const input = baseInput({
      age: 28,
      cycleIndex: 5,
      lifeFlags: { employed: true, educationCompleted: true },
      eventHistory: [
        {
          lifeEventId: 'career_first_job',
          encounterId: 'career_first_job_1',
          cycleIndex: 1,
          turnNumber: 1,
          simulationYear: 1,
          recordedAt: new Date().toISOString(),
        },
        {
          lifeEventId: 'career_probation',
          encounterId: 'career_job_offer_3',
          cycleIndex: 3,
          turnNumber: 3,
          simulationYear: 2,
          recordedAt: new Date().toISOString(),
        },
      ],
    })
    const eligible = filterEligibleLifeEvents(input)
    expect(eligible.map((e) => e.id)).toContain('career_promotion')
  })
})
