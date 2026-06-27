import type { BoardLayoutKind, BoardConfig, SpaceConfig } from '../types/board-config.js'
import type { PositionedSpace } from '../types/view-models.js'
import {
  boardLayoutEngine,
  generateBoardLayout,
  interpolateBoardMovement,
  registerLayoutEngine,
} from './board-layout-engine.js'
import type { BoardLayoutResult, LayoutEngine, LayoutPoint } from './types.js'

/** @deprecated Use generateBoardLayout(config) */
export function getLayoutEngine(layout: BoardLayoutKind): LayoutEngine | undefined {
  return boardLayoutEngine.getLayout(layout)
}

/** @deprecated Use generateBoardLayout — computes positions only without space metadata */
export function computeSpacePositions(
  layout: BoardLayoutKind,
  spaceCount: number,
  options?: BoardConfig['layoutOptions'],
): LayoutPoint[] {
  const engine = boardLayoutEngine.getLayout(layout)
  if (!engine) return []
  return engine.computePositions({ spaceCount, layout, options })
}

/** @deprecated Use generateBoardLayout(config).spaces */
export function positionSpaces(
  spaces: SpaceConfig[],
  layout: BoardLayoutKind,
  options?: BoardConfig['layoutOptions'],
): PositionedSpace[] {
  return generateBoardLayout({
    id: 'inline',
    title: 'inline',
    layout,
    layoutOptions: options,
    spaces,
  }).spaces
}

/** @deprecated Use generateBoardLayout(config).trackPath */
export function buildTrackPath(
  layout: BoardLayoutKind,
  spaceCount: number,
  options?: BoardConfig['layoutOptions'],
): string {
  return generateBoardLayout({
    id: 'inline',
    title: 'inline',
    layout,
    layoutOptions: options,
    spaces: Array.from({ length: spaceCount }, (_, boardIndex) => ({
      id: `space-${boardIndex}`,
      name: `Space ${boardIndex}`,
      category: 'milestone' as const,
      color: '#94A3B8',
      icon: 'star' as const,
      boardIndex,
      encounterId: 'milestone',
    })),
  }).trackPath
}

/** Interpolate token movement by boardIndex (animation-ready). */
export function interpolateAlongSpaces(
  spaces: PositionedSpace[],
  fromIndex: number,
  toIndex: number,
  progress: number,
): { x: number; y: number } {
  return interpolateBoardMovement(spaces, fromIndex, toIndex, progress)
}

export {
  boardLayoutEngine,
  generateBoardLayout,
  interpolateBoardMovement,
  registerLayoutEngine,
}
export type { BoardLayoutResult }
