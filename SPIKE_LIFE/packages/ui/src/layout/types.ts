import type { BoardLayoutOptions } from '../types/board-config.js'

export interface LayoutPoint {
  x: number
  y: number
  angle: number
}

export interface LayoutEngineInput {
  spaceCount: number
  layout: string
  options?: BoardLayoutOptions
}

/** Pluggable layout algorithm — register custom engines at runtime. */
export interface LayoutEngine {
  id: string
  label: string
  computePositions(input: LayoutEngineInput): LayoutPoint[]
  buildTrackPath?(input: LayoutEngineInput): string
}

/** Sample a closed or open path by arc-length distance. Used for even distribution. */
export interface PathSampler {
  pathLength: number
  sampleAt(distance: number): { x: number; y: number }
}

export const DEFAULT_LAYOUT_OPTIONS: Required<BoardLayoutOptions> = {
  padding: 0.1,
  cornerRadius: 0.14,
  serpentineColumns: 4,
  aspectRatio: 4 / 3,
}

export interface BoardLayoutResult {
  layout: string
  trackPath: string
  spaceCount: number
  spaces: import('../types/view-models.js').PositionedSpace[]
}

export interface MovementPoint {
  x: number
  y: number
}
