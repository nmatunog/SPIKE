import type { EncounterCard, EncounterCardId, SpaceType } from '../../types.js'
import { ENCOUNTER_DECK } from '../encounter-deck.js'
import { weightedPickId } from './domain-weights.js'
import { getYearLoopConfig } from './year-loop-context.js'

export type LifeStageBand = 'launch' | 'mid' | 'late'

export function lifeStageBandForAge(age: number): LifeStageBand {
  const bands = [...getYearLoopConfig().weightBands].sort((a, b) => a.maxAge - b.maxAge)
  const band = bands.find((b) => age <= b.maxAge) ?? bands[bands.length - 1]
  return band?.label ?? 'launch'
}

function encounterOverride(id: EncounterCardId) {
  return getYearLoopConfig().encounterWeightOverrides?.find((o) => o.id === id)
}

function encounterMatchesDomain(card: EncounterCard, domainId: string, category: SpaceType): boolean {
  const override = encounterOverride(card.id)
  if (override?.domainIds?.includes(domainId)) return true
  if (card.domainIds?.includes(domainId)) return true
  return card.spaceTypes.includes(category)
}

function encounterWeightForAge(card: EncounterCard, age: number): number {
  const band = lifeStageBandForAge(age)
  const override = encounterOverride(card.id)
  const table = override?.weightsByBand ?? card.weightsByBand
  if (table) {
    return table[band] ?? table.launch ?? 1
  }
  if (card.ageMin != null && age < card.ageMin) return 0
  if (card.ageMax != null && age > card.ageMax) return 0
  return 1
}

export function encountersForDomain(
  domainId: string,
  category: SpaceType,
  age: number,
): EncounterCard[] {
  const pool = Object.values(ENCOUNTER_DECK).filter((card) =>
    encounterMatchesDomain(card, domainId, category),
  )
  const weighted = pool.filter((card) => encounterWeightForAge(card, age) > 0)
  return weighted.length > 0 ? weighted : pool
}

export function pickWeightedEncounter(
  domainId: string,
  category: SpaceType,
  age: number,
  rng: () => number = Math.random,
): EncounterCardId {
  const pool = encountersForDomain(domainId, category, age)
  if (pool.length === 0) {
    return Object.values(ENCOUNTER_DECK)[0]!.id
  }

  const ids = pool.map((c) => c.id)
  const weights = Object.fromEntries(
    pool.map((c) => [c.id, encounterWeightForAge(c, age)]),
  ) as Record<EncounterCardId, number>

  return weightedPickId(weights, ids, rng)
}
