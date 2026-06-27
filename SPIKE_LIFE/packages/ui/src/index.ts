export type { BoardConfig, BoardLayoutKind, SpaceConfig, SpaceCategory, SpaceIconId } from './types/board-config.js'
export type {
  BoardViewModel,
  BoardTokenViewModel,
  EncounterViewModel,
  FinancialHUDViewModel,
  FinancialMetricViewModel,
  PositionedSpace,
  TurnHUDViewModel,
} from './types/view-models.js'

export { DEFAULT_BOARD_CONFIG, SPACE_CATEGORY_LEGEND } from './config/default-board.js'

export {
  buildTrackPath,
  computeSpacePositions,
  interpolateAlongSpaces,
  positionSpaces,
} from './layout/index.js'

export { GameBoard } from './components/GameBoard.js'
export { BoardPath } from './components/BoardPath.js'
export { BoardSpace } from './components/BoardSpace.js'
export { PlayerToken } from './components/PlayerToken.js'
export { Dice, DiceRollAnimation } from './components/Dice.js'
export { BoardOverlay } from './components/BoardOverlay.js'
export { BoardAnimation } from './components/BoardAnimation.js'
export { MovementAnimator } from './components/MovementAnimator.js'
export { EncounterCard, EncounterModal } from './components/EncounterCard.js'
export { TurnIndicator, TurnCounter } from './components/TurnIndicator.js'
export { BoardLegend } from './components/BoardLegend.js'
export { DicePanel } from './components/DicePanel.js'
export { BoardHUD, LifeScoreRing } from './components/BoardHUD.js'
export { FinancialHUD } from './components/FinancialHUD.js'
export { SpaceIcon } from './components/SpaceIcon.js'
export { useMovementAnimator } from './hooks/useMovementAnimator.js'
