import { describe, expect, it, beforeAll } from 'vitest'
import { startPlanningCycle } from './financial-decision-engine.js'
import { TEST_CURRENCY } from './test/currency-fixture.js'
import { bootstrapTestEncounters } from './test/encounter-fixture.js'
import { Simulation } from './aggregates/simulation.js'

describe('startPlanningCycle board binding', () => {
  beforeAll(() => {
    bootstrapTestEncounters()
  })

  it('uses board encounter instead of random pack pick', () => {
    let session = Simulation.createCampaign('bind-1', TEST_CURRENCY).toState()
    session = {
      ...session,
      dreamBoard: { ...session.dreamBoard!, completedAt: new Date().toISOString() },
      encounterId: 'career_first_job_1',
    }

    const started = startPlanningCycle('bind-1', 'promotion', session, TEST_CURRENCY, {
      domainId: 'career',
      encounterCardId: 'first_job',
      completedEncounterCardIds: [],
    })

    expect(started.encounterId).toBe('career_first_job_1')
    expect(started.selectedDomainId).toBe('career')
    expect(started.situation?.title).toBe('First Job')
    expect(started.scenarioId).toBe('promotion')
  })
})
