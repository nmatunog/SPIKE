import { describe, expect, it } from 'vitest'
import {
  Simulation,
  advanceTurn,
  createWorkshopSession,
  startPlanningCycle,
  submitDecision,
  submitReflection,
  setDreamBoard,
  configureCampaign,
  configureCalendarEvents,
  dismissCalendarEvent,
  resolveThirteenthMonthPay,
  WORKSHOP_MAX_TURNS,
  WORKSHOP_STAGE_ORDER,
} from './index.js'
import { PHILIPPINES_CAMPAIGN } from '@spike-life/content-philippines'
import { TEST_CURRENCY } from './test/currency-fixture.js'
import { bootstrapTestEncounters } from './test/encounter-fixture.js'

const SAMPLE_REFLECTION = [
  { promptId: 'what_happened', response: 'My savings grew and protection improved slightly.' },
  { promptId: 'why_happened', response: 'I chose discipline over lifestyle inflation.' },
  { promptId: 'what_worked', response: 'Following FNA priorities before acting on the raise.' },
  { promptId: 'what_change', response: 'I would allocate more to protection earlier.' },
  { promptId: 'advise_other', response: 'Run FNA first — a raise is not free money.' },
]

function clearCalendarEvents(session: ReturnType<typeof createWorkshopSession>) {
  let next = session
  if (next.pendingCalendarEvent === 'thirteenth_month') {
    next = resolveThirteenthMonthPay(next, 'emergency_fund')
  }
  if (next.pendingCalendarEvent) {
    next = dismissCalendarEvent(next)
  }
  return next
}

function readyWorkshopSession(id: string) {
  configureCampaign(PHILIPPINES_CAMPAIGN)
  if (PHILIPPINES_CAMPAIGN.calendarEvents) {
    configureCalendarEvents(PHILIPPINES_CAMPAIGN.calendarEvents)
  }
  bootstrapTestEncounters()
  let session = createWorkshopSession(id, TEST_CURRENCY)
  if (session.dreamBoard?.goals) {
    session = setDreamBoard(session, session.dreamBoard.goals)
  }
  return session
}

describe('Workshop macro turns', () => {
  it('creates workshop session at turn 1 / Launch', () => {
    const session = readyWorkshopSession('workshop-1')

    expect(session.turnNumber).toBe(1)
    expect(session.simulationYear).toBe(1)
    expect(session.maxTurns).toBe(WORKSHOP_MAX_TURNS)
    expect(session.sessionMode).toBe('workshop_compressed')
    expect(session.character.lifeStage).toBe('launch')
    expect(session.character.age).toBe(22)
    expect(session.startingAge).toBe(22)
    expect(session.phase).toBe('created')
    expect(session.turnHistory).toEqual([])
  })

  it('advances turn after cycle_complete and preserves financial progress', () => {
    let session = readyWorkshopSession('workshop-2')
    session = startPlanningCycle('workshop-2', 'promotion', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)
    const cashAfterCycle = session.financialProfile.cash

    expect(session.phase).toBe('cycle_complete')
    expect(session.turnNumber).toBe(1)

    session = advanceTurn(session)

    expect(session.phase).toBe('created')
    expect(session.turnNumber).toBe(2)
    expect(session.simulationYear).toBe(3)
    expect(session.character.lifeStage).toBe('build')
    expect(session.character.age).toBe(24)
    expect(session.financialProfile.cash).toBe(cashAfterCycle)
    expect(session.situation).toBeNull()
    expect(session.turnHistory).toHaveLength(1)
    expect(session.turnHistory[0]?.turnNumber).toBe(1)
    expect(session.turnHistory[0]?.lifeStage).toBe('launch')
  })

  it('starts a new scenario on an advanced turn without resetting finances', () => {
    let session = readyWorkshopSession('workshop-3')
    session = startPlanningCycle('workshop-3', 'promotion', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)
    const cashAfterTurn1 = session.financialProfile.cash
    session = advanceTurn(session)
    session = clearCalendarEvents(session)

    session = startPlanningCycle('workshop-3', 'promotion', session)

    expect(session.turnNumber).toBe(2)
    expect(session.phase).toBe('decision_pending')
    expect(session.financialProfile.cash).toBeGreaterThanOrEqual(cashAfterTurn1)
    expect(session.situation?.eventId).toBe('C001_promotion')
  })

  it('walks through all five workshop stages', () => {
    let session = readyWorkshopSession('workshop-4')

    for (let turn = 1; turn <= WORKSHOP_MAX_TURNS; turn += 1) {
      expect(session.turnNumber).toBe(turn)
      expect(session.character.lifeStage).toBe(WORKSHOP_STAGE_ORDER[turn - 1])

      session = startPlanningCycle('workshop-4', 'promotion', session)
      session = submitDecision(session, 'maintain_lifestyle_discipline')
      session = submitReflection(session, SAMPLE_REFLECTION)

      if (turn < WORKSHOP_MAX_TURNS) {
        session = advanceTurn(session)
        session = clearCalendarEvents(session)
      }
    }

    expect(session.turnNumber).toBe(WORKSHOP_MAX_TURNS)
    expect(session.character.lifeStage).toBe('legacy')
    expect(session.turnHistory).toHaveLength(WORKSHOP_MAX_TURNS - 1)
  })

  it('rejects advanceTurn before cycle is complete', () => {
    let session = readyWorkshopSession('workshop-5')
    session = startPlanningCycle('workshop-5', 'promotion', session)

    expect(() => advanceTurn(session)).toThrow(/Complete reflection/)
  })

  it('rejects advanceTurn after workshop is finished', () => {
    let session = readyWorkshopSession('workshop-6')

    for (let turn = 1; turn < WORKSHOP_MAX_TURNS; turn += 1) {
      session = startPlanningCycle('workshop-6', 'promotion', session)
      session = submitDecision(session, 'maintain_lifestyle_discipline')
      session = submitReflection(session, SAMPLE_REFLECTION)
      session = advanceTurn(session)
      session = clearCalendarEvents(session)
    }

    session = startPlanningCycle('workshop-6', 'promotion', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)

    expect(() => advanceTurn(session)).toThrow(/already complete/)
  })

  it('emits YearAdvanced and LifeStageChanged domain events', () => {
    let session = readyWorkshopSession('workshop-7')
    session = startPlanningCycle('workshop-7', 'promotion', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)

    const sim = Simulation.fromState(session).advanceTurn()
    const events = sim.pullDomainEvents()

    expect(events.some((e) => e.type === 'YearAdvanced')).toBe(true)
    expect(events.some((e) => e.type === 'LifeStageChanged')).toBe(true)
  })
})
