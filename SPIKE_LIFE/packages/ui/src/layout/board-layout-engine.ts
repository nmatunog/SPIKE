import type { BoardConfig, SpaceConfig } from '../types/board-config.js'
import { normalizeSpaceConfig, validateBoardConfig } from '../types/board-config.js'
import type { PositionedSpace } from '../types/view-models.js'
import { circleLayout } from './circle.js'
import { rectangleLayout, roundedRectangleLayout } from './rectangle.js'
import { serpentineLayout } from './serpentine.js'
import type { BoardLayoutResult, LayoutEngine, LayoutEngineInput, MovementPoint } from './types.js'
import { DEFAULT_LAYOUT_OPTIONS } from './types.js'
import { roundedRectTrackPath } from './rounded-rectangle-math.js'

const BUILTIN_ENGINES: LayoutEngine[] = [
  { ...roundedRectangleLayout, id: 'rounded-rectangle', label: 'Rounded Rectangle' },
  { ...rectangleLayout, id: 'rectangle', label: 'Rectangle' },
  { ...circleLayout, id: 'circle', label: 'Circle' },
  { ...serpentineLayout, id: 'serpentine', label: 'Serpentine Grid' },
]

function sortByBoardIndex(spaces: SpaceConfig[]): SpaceConfig[] {
  return [...spaces].map(normalizeSpaceConfig).sort((a, b) => a.boardIndex - b.boardIndex)
}

function resolveConnections(sorted: SpaceConfig[]): number[][] {
  return sorted.map((space, index) => {
    if (space.connections && space.connections.length > 0) {
      return space.connections
    }
    const next = sorted[(index + 1) % sorted.length]
    return next ? [next.boardIndex] : []
  })
}

function buildTrackPathForLayout(
  engine: LayoutEngine,
  input: LayoutEngineInput,
): string {
  if (engine.buildTrackPath) {
    return engine.buildTrackPath(input)
  }

  if (input.layout === 'rounded-rectangle') {
    const padding = input.options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const cornerRadius = input.options?.cornerRadius ?? DEFAULT_LAYOUT_OPTIONS.cornerRadius
    const w = (1 - padding * 2) * 100
    const h = w * 0.72
    const r = Math.min(cornerRadius, w / 400, h / 400) * 100
    return roundedRectTrackPath(50, 50, w, h, r)
  }

  const points = engine.computePositions(input)
  if (points.length === 0) return ''
  const first = points[0]!
  const segments = points.map((p) => `${p.x * 100} ${p.y * 100}`).join(' L ')
  return `M ${first.x * 100} ${first.y * 100} L ${segments} Z`
}

/**
 * Board Layout Engine — generates dynamic board geometry from configuration.
 * Coordinates are computed at runtime; never stored in config.
 */
export class BoardLayoutEngine {
  private readonly engines = new Map<string, LayoutEngine>()

  constructor() {
    for (const engine of BUILTIN_ENGINES) {
      this.engines.set(engine.id, engine)
    }
  }

  /** Register a custom layout (future: hex, spiral, scenario-specific tracks). */
  registerLayout(engine: LayoutEngine): void {
    this.engines.set(engine.id, engine)
  }

  getLayout(id: string): LayoutEngine | undefined {
    return this.engines.get(id)
  }

  listLayouts(): LayoutEngine[] {
    return [...this.engines.values()]
  }

  /** Generate positioned spaces + SVG track from a BoardConfig. */
  generate(config: BoardConfig): BoardLayoutResult {
    validateBoardConfig(config)

    const sorted = sortByBoardIndex(config.spaces)
    const connections = resolveConnections(sorted)
    const engine = this.engines.get(config.layout)

    if (!engine) {
      throw new Error(
        `Unknown board layout "${config.layout}". Registered: ${[...this.engines.keys()].join(', ')}`,
      )
    }

    const input: LayoutEngineInput = {
      spaceCount: sorted.length,
      layout: config.layout,
      options: config.layoutOptions,
    }

    const points = engine.computePositions(input)
    const trackPath = buildTrackPathForLayout(engine, input)

    const spaces: PositionedSpace[] = sorted.map((space, index) => {
      const point = points[index] ?? { x: 0.5, y: 0.5, angle: 0 }
      return {
        id: space.id,
        name: space.name,
        title: space.name,
        boardIndex: space.boardIndex,
        category: space.category,
        color: space.color,
        icon: space.icon,
        description: space.description,
        connections: connections[index] ?? [],
        eventPool: space.eventPool ?? [space.encounterId],
        encounterId: space.encounterId,
        x: point.x,
        y: point.y,
        angle: point.angle,
      }
    })

    return {
      layout: config.layout,
      trackPath,
      spaceCount: spaces.length,
      spaces,
    }
  }

  /**
   * Interpolate token movement along boardIndex order (supports animation).
   * Returns normalized percent coordinates (0–100).
   */
  interpolateMovement(
    spaces: PositionedSpace[],
    fromBoardIndex: number,
    toBoardIndex: number,
    progress: number,
  ): MovementPoint {
    const sorted = [...spaces].sort((a, b) => a.boardIndex - b.boardIndex)
    const from = sorted.find((s) => s.boardIndex === fromBoardIndex) ?? sorted[0]
    const to = sorted.find((s) => s.boardIndex === toBoardIndex) ?? from

    if (!from || !to) return { x: 50, y: 50 }

    const t = Math.min(1, Math.max(0, progress))
    const count = sorted.length

    if (fromBoardIndex === toBoardIndex || count <= 1) {
      return { x: from.x * 100, y: from.y * 100 }
    }

    const indexOf = (boardIndex: number) =>
      sorted.findIndex((s) => s.boardIndex === boardIndex)

    let fromIdx = indexOf(fromBoardIndex)
    let toIdx = indexOf(toBoardIndex)
    if (fromIdx < 0 || toIdx < 0) return { x: from.x * 100, y: from.y * 100 }

    let steps = toIdx - fromIdx
    if (steps < 0) steps += count

    const stepFloat = steps * t
    const wholeSteps = Math.floor(stepFloat)
    const frac = stepFloat - wholeSteps

    let cursor = fromIdx
    for (let i = 0; i < wholeSteps; i++) {
      cursor = (cursor + 1) % count
    }

    const currentSpace = sorted[cursor] ?? from
    const nextSpace = sorted[(cursor + 1) % count] ?? to

    return {
      x: (currentSpace.x + (nextSpace.x - currentSpace.x) * frac) * 100,
      y: (currentSpace.y + (nextSpace.y - currentSpace.y) * frac) * 100,
    }
  }
}

/** Shared singleton — use registerLayout() for custom algorithms. */
export const boardLayoutEngine = new BoardLayoutEngine()

export function generateBoardLayout(config: BoardConfig): BoardLayoutResult {
  return boardLayoutEngine.generate(config)
}

export function registerLayoutEngine(engine: LayoutEngine): void {
  boardLayoutEngine.registerLayout(engine)
}

export function interpolateBoardMovement(
  spaces: PositionedSpace[],
  fromBoardIndex: number,
  toBoardIndex: number,
  progress: number,
): MovementPoint {
  return boardLayoutEngine.interpolateMovement(spaces, fromBoardIndex, toBoardIndex, progress)
}
