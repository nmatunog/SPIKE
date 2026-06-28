import boardJson from './board.json' with { type: 'json' }
import { legendFromBoardConfig, resolveBoardConfig } from './resolve-board-config.js'
import type { BoardConfig, BoardConfigInput } from './types.js'

export type {
  BoardConfig,
  BoardConfigInput,
  BoardLayoutKind,
  BoardLayoutOptions,
  BoardLegendItem,
  DomainBoardSpace,
  SpaceCategory,
  SpaceConfig,
  SpaceConfigInput,
  SpaceIconId,
} from './types.js'

export { CATEGORY_DEFAULTS } from './category-defaults.js'
export {
  legendFromBoardConfig,
  normalizeSpaceConfig,
  resolveBoardConfig,
  resolveSpaceConfig,
  toDomainBoardSpaces,
  validateBoardConfig,
  validateResolvedBoardConfig,
} from './resolve-board-config.js'

/** Default board loaded from `board.json` — edit JSON to reshape the game. */
export const DEFAULT_BOARD_CONFIG: BoardConfig = resolveBoardConfig(boardJson as BoardConfigInput)

/** Category legend derived from the active board config. */
export const SPACE_CATEGORY_LEGEND = legendFromBoardConfig(DEFAULT_BOARD_CONFIG)

/** Load any board JSON object without modifying React components. */
export function loadBoardConfig(input: BoardConfigInput): BoardConfig {
  return resolveBoardConfig(input)
}
