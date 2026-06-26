import type { BoardLayoutKind, BoardLayoutOptions } from '../types/board-config.js'

export interface LayoutPoint {
  x: number
  y: number
  angle: number
}

export interface LayoutEngineInput {
  spaceCount: number
  layout: BoardLayoutKind
  options?: BoardLayoutOptions
}

export interface LayoutEngine {
  computePositions(input: LayoutEngineInput): LayoutPoint[]
}

export const DEFAULT_LAYOUT_OPTIONS: Required<BoardLayoutOptions> = {
  padding: 0.1,
  cornerRadius: 0.14,
  serpentineColumns: 4,
  aspectRatio: 4 / 3,
}
