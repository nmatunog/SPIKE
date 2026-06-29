import type { EncounterCard, EncounterCardId } from '../../types.js'
import { getEncounterCard } from '../encounter-deck.js'
import { encountersForDomain } from './situation-weights.js'

/**
 * Rapid shuffle path for UI — ends on the selected encounter.
 * Player sees one continuous animation; engine already picked the winner.
 */
export function buildSituationShuffleIds(
  domainId: string,
  category: import('../../types.js').SpaceType,
  age: number,
  selectedId: EncounterCardId,
  completedEncounters: EncounterCardId[] = [],
): EncounterCardId[] {
  const pool = encountersForDomain(domainId, category, age, completedEncounters)
  const ids = pool.map((card) => card.id)
  const selected = ids.includes(selectedId) ? selectedId : ids[0]!
  const others = ids.filter((id) => id !== selected)

  while (others.length < 2) {
    others.push(ids[others.length % ids.length]!)
  }

  const [first, second] = others
  return [first!, second!, selected, first!, second!, selected]
}

export function buildSituationShuffleCards(
  domainId: string,
  category: import('../../types.js').SpaceType,
  age: number,
  selectedId: EncounterCardId,
  completedEncounters: EncounterCardId[] = [],
): EncounterCard[] {
  return buildSituationShuffleIds(domainId, category, age, selectedId, completedEncounters).map((id) =>
    getEncounterCard(id),
  )
}

/** @deprecated Use buildSituationShuffleCards with domainId + age */
export function encountersForCategory(category: import('../../types.js').SpaceType): EncounterCard[] {
  return encountersForDomain('career', category, 22)
}
