export type {
  GameBoardProps,
  BoardSpaceProps,
  PlayerTokenProps,
  BoardLegendProps,
  EncounterCardProps,
  TurnCounterProps,
  DicePanelProps,
  BoardHUDProps,
  FinancialHUDProps,
  BoardAnimationProps,
  LifeScoreRingProps,
  LegendItemViewModel,
  BoardSpaceSize,
} from './types/component-props.js'

export type {
  BoardViewModel,
  BoardTokenViewModel,
  EncounterViewModel,
  FinancialHUDViewModel,
  FinancialMetricViewModel,
  PositionedSpace,
  TurnHUDViewModel,
} from './types/view-models.js'
export type { BoardConfig, BoardLayoutKind, SpaceConfig, SpaceCategory, SpaceIconId } from './types/board-config.js'

export { DEFAULT_BOARD_CONFIG, SPACE_CATEGORY_LEGEND } from './config/default-board.js'

export {
  buildTrackPath,
  computeSpacePositions,
  interpolateAlongSpaces,
  positionSpaces,
  generateBoardLayout,
  interpolateBoardMovement,
  registerLayoutEngine,
  boardLayoutEngine,
  BoardLayoutEngine,
} from './layout/index.js'
export type { BoardLayoutResult, LayoutEngine, PathSampler } from './layout/index.js'
export { normalizeSpaceConfig, validateBoardConfig } from './types/board-config.js'

export {
  GameBoard,
  BoardSpace,
  PlayerToken,
  BoardLegend,
  EncounterCard,
  EncounterModal,
  TurnCounter,
  TurnIndicator,
  DicePanel,
  BoardHUD,
  FinancialHUD,
  BoardAnimation,
  LifeScoreRing,
} from './components/board/index.js'

export { BoardPath } from './components/BoardPath.js'
export { Dice, DiceRollAnimation } from './components/Dice.js'
export { BoardOverlay } from './components/BoardOverlay.js'
export { MovementAnimator } from './components/MovementAnimator.js'
export { SpaceIcon } from './components/SpaceIcon.js'
export { useMovementAnimator } from './hooks/useMovementAnimator.js'
export { groupTokensByPosition } from './utils/presentation.js'
