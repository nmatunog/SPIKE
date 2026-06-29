import type { SessionMode } from './types.js'
import { configureCampaign } from './services/campaign-context.js'
import { PHILIPPINES_CAMPAIGN, PHILIPPINES_YEAR_LOOP } from '@spike-life/content-philippines'
import {
  advanceTurn,
  createCampaignSession,
  createWorkshopSession,
  setDreamBoard,
  startRoomCycle,
  submitDecision,
  submitReflection,
} from './financial-decision-engine.js'
import { configureYearLoop } from './gameboard/services/year-loop/year-loop-context.js'
import { TEST_CURRENCY } from './test/currency-fixture.js'
import { bootstrapTestEncounters } from './test/encounter-fixture.js'
import { describe, expect, it, beforeAll } from 'vitest'

const SAMPLE_REFLECTION = [
  { promptId: 'what_happened', response: 'My savings grew and protection improved slightly.' },
  { promptId: 'why_happened', response: 'I chose discipline over lifestyle inflation.' },
  { promptId: 'what_worked', response: 'Following FNA priorities before acting on the raise.' },
  { promptId: 'what_change', response: 'I would allocate more to protection earlier.' },
  { promptId: 'advise_other', response: 'Run FNA first — a raise is not free money.' },
]

function bootstrapTestPack() {
  configureCampaign(PHILIPPINES_CAMPAIGN)
  configureYearLoop(PHILIPPINES_YEAR_LOOP)
  bootstrapTestEncounters()
}

function readySession(id: string, mode: SessionMode) {
  let session = mode === 'campaign'
    ? createCampaignSession(id, TEST_CURRENCY)
    : createWorkshopSession(id, TEST_CURRENCY, undefined, mode)
  if (session.dreamBoard?.goals) {
    session = setDreamBoard(session, session.dreamBoard.goals)
  }
  return session
}

describe('campaign mode (20 cycles)', () => {
  beforeAll(() => bootstrapTestPack())

  it('defaults to campaign sessionMode with 20 max turns', () => {
    const session = readySession('camp-1', 'campaign')
    expect(session.sessionMode).toBe('campaign')
    expect(session.maxTurns).toBe(20)
    expect(session.maxCycles).toBe(20)
    expect(session.turnNumber).toBe(1)
    expect(session.cycleIndex).toBe(1)
  })

  it('advances cycleIndex 1:1 in campaign mode', () => {
    let session = readySession('camp-2', 'campaign')
    session = startRoomCycle('camp-2', session)
    session = submitDecision(session, 'maintain_lifestyle_discipline')
    session = submitReflection(session, SAMPLE_REFLECTION)
    session = advanceTurn(session)
    expect(session.turnNumber).toBe(2)
    expect(session.cycleIndex).toBe(2)
    expect(session.halfYear).toBe('H2')
    expect(session.pendingCalendarEvent).toBe('thirteenth_month')
    expect(session.selectedDomainId).toBeTruthy()
  })
})

describe('planning-cycle-fsm', () => {
  it('allows valid transitions', async () => {
    const { canTransitionCyclePhase } = await import('./services/planning-cycle-fsm.js')
    expect(canTransitionCyclePhase('created', 'situation_presented')).toBe(true)
    expect(canTransitionCyclePhase('decision_pending', 'consequences_applied')).toBe(true)
    expect(canTransitionCyclePhase('created', 'cycle_complete')).toBe(false)
  })
})
