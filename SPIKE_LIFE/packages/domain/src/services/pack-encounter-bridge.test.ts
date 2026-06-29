import { describe, expect, it, beforeAll } from 'vitest'
import {
  packIdToCardId,
  resolvePackEncounterId,
} from './pack-encounter-bridge.js'
import { bootstrapTestEncounters } from '../test/encounter-fixture.js'

describe('pack-encounter-bridge', () => {
  beforeAll(() => {
    bootstrapTestEncounters()
  })

  it('maps pack ids to board card ids', () => {
    expect(packIdToCardId('career_first_job_1')).toBe('first_job')
    expect(packIdToCardId('career_internship_2')).toBe('internship')
    expect(packIdToCardId('career_executive_promotion_5')).toBe('executive_promotion')
  })

  it('resolves board card ids to pack ids per domain', () => {
    expect(resolvePackEncounterId('career', 'first_job')).toBe('career_first_job_1')
    expect(resolvePackEncounterId('career', 'internship')).toBe('career_internship_2')
  })
})
