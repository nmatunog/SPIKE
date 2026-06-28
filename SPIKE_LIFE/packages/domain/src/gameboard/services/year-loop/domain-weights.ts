import type { LifeDomainTile } from './domain-grid.js'
import { domainById } from './domain-grid.js'

import { getDomainIds, getYearLoopConfig } from './year-loop-context.js'

export type DomainWeightTable = Record<string, number>

export function domainWeightsForAge(age: number): DomainWeightTable {
  const bands = [...getYearLoopConfig().weightBands].sort((a, b) => a.maxAge - b.maxAge)
  const band = bands.find((b) => age <= b.maxAge) ?? bands[bands.length - 1]
  return band?.weights ?? {}
}

export function weightedPickId<T extends string>(
  weights: Record<T, number>,
  order: readonly T[],
  rng: () => number = Math.random,
): T {
  const total = order.reduce((sum, key) => sum + (weights[key] ?? 0), 0)
  if (total <= 0) return order[0]!

  let roll = rng() * total
  for (const key of order) {
    roll -= weights[key] ?? 0
    if (roll <= 0) return key
  }
  return order[order.length - 1]!
}

export function selectWeightedLifeDomain(
  age: number,
  rng: () => number = Math.random,
): LifeDomainTile {
  const weights = domainWeightsForAge(age)
  const order = getDomainIds()
  const id = weightedPickId(weights, order, rng)
  const domain = domainById(id)
  if (domain) return domain
  return domainById('career') ?? domainById(order[0]!)!
}

export function selectLifeDomainForYear(
  playerAge: number,
  rng: () => number = Math.random,
): LifeDomainTile {
  return selectWeightedLifeDomain(playerAge, rng)
}

/** @deprecated Use selectLifeDomainForYear(playerAge) */
export function selectLifeDomain(rng: () => number = Math.random): LifeDomainTile {
  return selectWeightedLifeDomain(22, rng)
}

/** @deprecated Use getYearLoopConfig().weightBands — kept for docs/tests */
export const DOMAIN_WEIGHTS_LAUNCH = domainWeightsForAge(22)
export const DOMAIN_WEIGHTS_MID = domainWeightsForAge(38)
export const DOMAIN_WEIGHTS_LATE = domainWeightsForAge(58)

export const LIFE_DOMAIN_IDS = getDomainIds()
