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
} from '@spike-life/board-config'

export {
  CATEGORY_DEFAULTS,
  DEFAULT_BOARD_CONFIG,
  SPACE_CATEGORY_LEGEND,
  legendFromBoardConfig,
  loadBoardConfig,
  normalizeSpaceConfig,
  resolveBoardConfig,
  resolveSpaceConfig,
  toDomainBoardSpaces,
  validateBoardConfig,
  validateResolvedBoardConfig,
} from '@spike-life/board-config'
