export {
  boardLayoutEngine,
  generateBoardLayout,
  interpolateBoardMovement,
  registerLayoutEngine,
  BoardLayoutEngine,
} from './board-layout-engine.js'
export {
  buildTrackPath,
  computeSpacePositions,
  getLayoutEngine,
  interpolateAlongSpaces,
  positionSpaces,
} from './engine.js'
export { DEFAULT_BOARD_CONFIG, SPACE_CATEGORY_LEGEND } from '../config/default-board.js'
export type { BoardConfig, SpaceConfig, SpaceIconId, SpaceCategory, BoardLayoutKind, BoardConfigInput } from '../types/board-config.js'
export { normalizeSpaceConfig, validateBoardConfig } from '../types/board-config.js'
export { circleLayout } from './circle.js'
export { rectangleLayout, roundedRectangleLayout } from './rectangle.js'
export { serpentineLayout } from './serpentine.js'
export {
  circlePathSampler,
  distributeEvenlyOnPath,
  pathFromSampler,
} from './perimeter-distribution.js'
export {
  pointOnRoundedRectPerimeter,
  roundedRectPerimeterLength,
  roundedRectTrackPath,
} from './rounded-rectangle-math.js'
export type {
  BoardLayoutResult,
  LayoutEngine,
  LayoutEngineInput,
  LayoutPoint,
  MovementPoint,
  PathSampler,
} from './types.js'
export { DEFAULT_LAYOUT_OPTIONS } from './types.js'
