import { describe, expect, it } from 'vitest'
import {
  DOMAIN_WEIGHTS_LAUNCH,
  domainWeightsForAge,
  selectWeightedLifeDomain,
  weightedPickId,
} from './domain-weights.js'

describe('domain-weights', () => {
  it('uses launch weights for age 22', () => {
    expect(domainWeightsForAge(22)).toEqual(DOMAIN_WEIGHTS_LAUNCH)
  })

  it('favors career at age 22 with low rng roll', () => {
    const domain = selectWeightedLifeDomain(22, () => 0)
    expect(domain.id).toBe('career')
  })

  it('can select investment at age 58 within its weight band', () => {
    const domain = selectWeightedLifeDomain(58, () => 0.72)
    expect(domain.id).toBe('investment')
  })

  it('normalizes pick across weight table', () => {
    const id = weightedPickId(
      DOMAIN_WEIGHTS_LAUNCH,
      Object.keys(DOMAIN_WEIGHTS_LAUNCH) as (keyof typeof DOMAIN_WEIGHTS_LAUNCH)[],
      () => 0.99,
    )
    expect(id).toBeTruthy()
  })
})
