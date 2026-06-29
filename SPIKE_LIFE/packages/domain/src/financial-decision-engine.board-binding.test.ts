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
      encounterCardId: 'job_offer',
      completedEncounterCardIds: ['first_job'],
    })

    expect(started.encounterId).toBe('career_job_offer_3')
    expect(started.selectedDomainId).toBe('career')
  })
})
