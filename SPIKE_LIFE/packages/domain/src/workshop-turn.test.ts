import { describe, expect, it } from 'vitest'
import {
  Simulation,
  advanceTurn,
  createWorkshopSession,
  startPlanningCycle,
  submitDecision,
  submitReflection,
  WORKSHOP_MAX_TURNS,
  WORKSHOP_STAGE_ORDER,
} from './index.js'
import { TEST_CURRENCY } from './test/currency-fixture.js'

const SAMPLE_REFLECTION = [
  { promptId: 'what_happened', response: 'My savings grew and protection improved slightly.' },
  { promptId: 'why_happened', response: 'I chose discipline over lifestyle inflation.' },
  { promptId: 'what_worked', response: 'Following FNA priorities before acting on the raise.' },
  { promptId: 'what_change', response: 'I would allocate more to protection earlier.' },
  { promptId: 'advise_other', response: 'Run FNA first — a raise is not free money.' },
]

describe('Workshop macro turns', () => {
  it('creates workshop session at turn 1 / Launch', () => {
    const session = createWorkshopSession('workshop-1', TEST_CURRENCY)

    expect(session.turnNumber).toBe(1)
    expect(session.simulationYear).toBe(1)
    expect(session.maxTurns).toBe(WORKSHOP_MAX_TURNS)
    expect(session.character.lifeStage).toBe('launch')
    expect(session.character.age).toBe(22)
    expect(session.startingAge).toBe(22)
    expect(session.phase).toBe('created')
    expect(session.turnHistory).toEqual([])
  })

  it('advances turn after cycle_complete and preserves financial progress', () => {
    let session = createWorkshopSession('workshop-2', TEST_CURRENCY)
    session = startPlanningCycle('workshop-2', 'promotion', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)
    const cashAfterCycle = session.financialProfile.cash

    expect(session.phase).toBe('cycle_complete')
    expect(session.turnNumber).toBe(1)

    session = advanceTurn(session)

    expect(session.phase).toBe('created')
    expect(session.turnNumber).toBe(2)
    expect(session.simulationYear).toBe(2)
    expect(session.character.lifeStage).toBe('build')
    expect(session.character.age).toBe(23)
    expect(session.financialProfile.cash).toBe(cashAfterCycle)
    expect(session.situation).toBeNull()
    expect(session.turnHistory).toHaveLength(1)
    expect(session.turnHistory[0]?.turnNumber).toBe(1)
    expect(session.turnHistory[0]?.lifeStage).toBe('launch')
  })

  it('starts a new scenario on an advanced turn without resetting finances', () => {
    let session = createWorkshopSession('workshop-3', TEST_CURRENCY)
    session = startPlanningCycle('workshop-3', 'promotion', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)
    const cashAfterTurn1 = session.financialProfile.cash
    session = advanceTurn(session)

    session = startPlanningCycle('workshop-3', 'promotion', session)

    expect(session.turnNumber).toBe(2)
    expect(session.phase).toBe('decision_pending')
    expect(session.financialProfile.cash).toBe(cashAfterTurn1)
    expect(session.situation?.eventId).toBe('C001_promotion')
  })

  it('walks through all five workshop stages', () => {
    let session = createWorkshopSession('workshop-4', TEST_CURRENCY)

    for (let turn = 1; turn <= WORKSHOP_MAX_TURNS; turn += 1) {
      expect(session.turnNumber).toBe(turn)
      expect(session.character.lifeStage).toBe(WORKSHOP_STAGE_ORDER[turn - 1])

      session = startPlanningCycle('workshop-4', 'promotion', session)
      session = submitDecision(session, 'maintain_lifestyle_discipline')
      session = submitReflection(session, SAMPLE_REFLECTION)

      if (turn < WORKSHOP_MAX_TURNS) {
        session = advanceTurn(session)
      }
    }

    expect(session.turnNumber).toBe(WORKSHOP_MAX_TURNS)
    expect(session.character.lifeStage).toBe('legacy')
    expect(session.turnHistory).toHaveLength(WORKSHOP_MAX_TURNS - 1)
  })

  it('rejects advanceTurn before cycle is complete', () => {
    let session = createWorkshopSession('workshop-5', TEST_CURRENCY)
    session = startPlanningCycle('workshop-5', 'promotion', session)

    expect(() => advanceTurn(session)).toThrow(/Complete reflection/)
  })

  it('rejects advanceTurn after workshop is finished', () => {
    let session = createWorkshopSession('workshop-6', TEST_CURRENCY)

    for (let turn = 1; turn < WORKSHOP_MAX_TURNS; turn += 1) {
      session = startPlanningCycle('workshop-6', 'promotion', session)
      session = submitDecision(session, 'maintain_lifestyle_discipline')
      session = submitReflection(session, SAMPLE_REFLECTION)
      session = advanceTurn(session)
    }

    session = startPlanningCycle('workshop-6', 'promotion', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)

    expect(() => advanceTurn(session)).toThrow(/already complete/)
  })

  it('emits YearAdvanced and LifeStageChanged domain events', () => {
    let session = createWorkshopSession('workshop-7', TEST_CURRENCY)
    session = startPlanningCycle('workshop-7', 'promotion', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)

    const sim = Simulation.fromState(session).advanceTurn()
    const events = sim.pullDomainEvents()

    expect(events.some((e) => e.type === 'YearAdvanced')).toBe(true)
    expect(events.some((e) => e.type === 'LifeStageChanged')).toBe(true)
  })
})
