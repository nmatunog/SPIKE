import type { EncounterCard, EncounterCardId, SpaceType } from '../../types.js'
import { ENCOUNTER_DECK } from '../encounter-deck.js'
import { weightedPickId } from './domain-weights.js'
import { getYearLoopConfig } from './year-loop-context.js'

export type LifeStageBand = 'launch' | 'mid' | 'late'

const PROMOTION_TIER_IDS = new Set<EncounterCardId>([
  'promotion',
  'salary_increase',
  'executive_promotion',
])

const EARLY_CAREER_IDS = new Set<EncounterCardId>(['first_job', 'internship'])

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

function hasCompleted(completed: EncounterCardId[], id: EncounterCardId): boolean {
  return completed.includes(id)
}

/** Career sequencing — first job before promotions; age windows for early career. */
export function encounterMeetsCareerPrerequisites(
  cardId: EncounterCardId,
  age: number,
  completed: EncounterCardId[],
): boolean {
  const hasFirstJob = hasCompleted(completed, 'first_job')
  const hasInternship = hasCompleted(completed, 'internship')

  if (cardId === 'first_job') {
    return !hasFirstJob && age >= 22 && age <= 24
  }

  if (cardId === 'internship') {
    return !hasFirstJob && !hasInternship && age >= 20 && age <= 26
  }

  if (PROMOTION_TIER_IDS.has(cardId)) {
    if (!hasFirstJob) return false
    if (cardId === 'promotion' || cardId === 'salary_increase') {
      return age >= 25
    }
    if (cardId === 'executive_promotion') {
      return age >= 35
    }
  }

  if (cardId === 'job_offer') {
    return hasFirstJob || hasInternship
  }

  return true
}

function encounterWeightForAge(
  card: EncounterCard,
  age: number,
  completed: EncounterCardId[] = [],
): number {
  if (card.ageMin != null && age < card.ageMin) return 0
  if (card.ageMax != null && age > card.ageMax) return 0
  if (!encounterMeetsCareerPrerequisites(card.id, age, completed)) return 0

  const band = lifeStageBandForAge(age)
  const override = encounterOverride(card.id)
  const table = override?.weightsByBand ?? card.weightsByBand
  if (table) {
    return table[band] ?? table.launch ?? 1
  }
  return 1
}

export function encountersForDomain(
  domainId: string,
  category: SpaceType,
  age: number,
  completedEncounters: EncounterCardId[] = [],
): EncounterCard[] {
  const pool = Object.values(ENCOUNTER_DECK).filter((card) =>
    encounterMatchesDomain(card, domainId, category),
  )
  const weighted = pool.filter((card) => encounterWeightForAge(card, age, completedEncounters) > 0)
  return weighted.length > 0 ? weighted : pool
}

export function pickWeightedEncounter(
  domainId: string,
  category: SpaceType,
  age: number,
  rng: () => number = Math.random,
  completedEncounters: EncounterCardId[] = [],
): EncounterCardId {
  const pool = encountersForDomain(domainId, category, age, completedEncounters)
  if (pool.length === 0) {
    return Object.values(ENCOUNTER_DECK)[0]!.id
  }

  const ids = pool.map((c) => c.id)
  const weights = Object.fromEntries(
    pool.map((c) => [c.id, encounterWeightForAge(c, age, completedEncounters)]),
  ) as Record<EncounterCardId, number>

  return weightedPickId(weights, ids, rng)
}
