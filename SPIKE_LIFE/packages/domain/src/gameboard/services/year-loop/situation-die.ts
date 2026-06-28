import type { EncounterCardId, SpaceType } from '../../types.js'
import { BOARD_DICE_MAX, BOARD_DICE_MIN } from '../../types.js'
import { ENCOUNTER_DECK } from '../encounter-deck.js'

export function rollSituationDie(rng: () => number = Math.random): number {
  const span = BOARD_DICE_MAX - BOARD_DICE_MIN + 1
  return Math.floor(rng() * span) + BOARD_DICE_MIN
}

export function pickEncounterForCategory(
  category: SpaceType,
  situationRoll: number,
): EncounterCardId {
  const pool = Object.values(ENCOUNTER_DECK).filter((card) =>
    card.spaceTypes.includes(category),
  )

  const candidates = pool.length > 0
    ? pool
    : Object.values(ENCOUNTER_DECK)

  const index = (situationRoll - BOARD_DICE_MIN) % candidates.length
  return candidates[index]!.id
}
