import { describe, expect, it, beforeAll } from 'vitest'
import {
  encounterMeetsCareerPrerequisites,
  pickWeightedEncounter,
} from './situation-weights.js'
import { configureLifeEventPack } from '../../../services/life-event-context.js'
import { bootstrapTestEncounters } from '../../../test/encounter-fixture.js'
import { PHILIPPINES_LIFE_EVENTS } from '@spike-life/content-philippines'
import { validateLifeEventPack } from '@spike-life/content-core'

describe('situation-weights', () => {
  beforeAll(() => {
    bootstrapTestEncounters()
    validateLifeEventPack(PHILIPPINES_LIFE_EVENTS)
    configureLifeEventPack(PHILIPPINES_LIFE_EVENTS)
  })

  it('favors first job for career domain at age 22', () => {
    const id = pickWeightedEncounter('career', 'career', 22, () => 0)
    expect(id).toBe('first_job')
  })

  it('blocks first job after age 24', () => {
    expect(encounterMeetsCareerPrerequisites('first_job', 28, [])).toBe(false)
    const id = pickWeightedEncounter('career', 'career', 28, () => 0, [])
    expect(id).not.toBe('first_job')
    expect(id).not.toBe('internship')
  })

  it('blocks internship at age 28', () => {
    expect(encounterMeetsCareerPrerequisites('internship', 28, [])).toBe(false)
  })

  it('blocks promotion until first job and age 25', () => {
    expect(encounterMeetsCareerPrerequisites('promotion', 28, [])).toBe(false)
    expect(encounterMeetsCareerPrerequisites('promotion', 24, ['first_job'])).toBe(false)
    expect(encounterMeetsCareerPrerequisites('promotion', 28, ['first_job'])).toBe(true)
  })

  it('can select late-career situations at age 58', () => {
    const id = pickWeightedEncounter('career', 'career', 58, () => 0.55, ['first_job'])
    expect([
      'executive_promotion',
      'retirement_offer',
      'redundancy',
      'consulting_opportunity',
      'promotion',
      'job_offer',
    ]).toContain(id)
  })

  it('picks health situations for health domain', () => {
    const id = pickWeightedEncounter('health', 'health', 38, () => 0)
    expect(['annual_checkup', 'minor_injury', 'hospitalization', 'medical_expense']).toContain(id)
  })
})
