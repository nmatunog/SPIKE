import { DEFAULT_BOARD_CONFIG, toDomainBoardSpaces } from '@spike-life/board-config'
import type { BoardSpace, EncounterCardId, SpaceType } from '../types.js'

export const DEFAULT_BOARD_SPACES: BoardSpace[] = toDomainBoardSpaces(DEFAULT_BOARD_CONFIG).map(
  (space) => ({
    index: space.index,
    type: space.type as SpaceType,
    encounterId: space.encounterId as EncounterCardId,
    label: space.label,
  }),
)

export function spaceAt(spaces: BoardSpace[], index: number): BoardSpace {
  const normalized = ((index % spaces.length) + spaces.length) % spaces.length
  return spaces[normalized]!
}

export function advancePosition(current: number, steps: number, spaceCount: number): number {
  return (current + steps) % spaceCount
}

export function spaceIndexForEncounter(
  spaces: BoardSpace[],
  encounterId: EncounterCardId,
  preferredCategory?: SpaceType,
): number {
  const exact = spaces.find((s) => s.encounterId === encounterId)
  if (exact) return exact.index

  if (preferredCategory) {
    const byCategory = spaces.find((s) => s.type === preferredCategory)
    if (byCategory) return byCategory.index
  }

  return 0
}

/** Build domain spaces from any board JSON — no React changes required. */
export function boardSpacesFromConfig(
  config: import('@spike-life/board-config').BoardConfig,
): BoardSpace[] {
  return toDomainBoardSpaces(config).map((space) => ({
    index: space.index,
    type: space.type as SpaceType,
    encounterId: space.encounterId as EncounterCardId,
    label: space.label,
  }))
}
