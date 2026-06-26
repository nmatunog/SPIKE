import type { BoardLayoutKind, SpaceConfig } from '../types/board-config.js'
import type { PositionedSpace } from '../types/view-models.js'
import { circleLayout } from './circle.js'
import { rectangleLayout, roundedRectangleLayout } from './rectangle.js'
import { serpentineLayout } from './serpentine.js'
import type { LayoutEngine, LayoutPoint } from './types.js'
import { DEFAULT_LAYOUT_OPTIONS } from './types.js'
import { roundedRectTrackPath } from './rounded-rectangle-math.js'

const ENGINES: Record<BoardLayoutKind, LayoutEngine> = {
  circle: circleLayout,
  rectangle: rectangleLayout,
  'rounded-rectangle': roundedRectangleLayout,
  serpentine: serpentineLayout,
}

export function getLayoutEngine(layout: BoardLayoutKind): LayoutEngine {
  return ENGINES[layout]
}

export function computeSpacePositions(
  layout: BoardLayoutKind,
  spaceCount: number,
  options?: import('../types/board-config.js').BoardLayoutOptions,
): LayoutPoint[] {
  return getLayoutEngine(layout).computePositions({ spaceCount, layout, options })
}

export function positionSpaces(
  spaces: SpaceConfig[],
  layout: BoardLayoutKind,
  options?: import('../types/board-config.js').BoardLayoutOptions,
): PositionedSpace[] {
  const sorted = [...spaces].sort((a, b) => a.boardIndex - b.boardIndex)
  const points = computeSpacePositions(layout, sorted.length, options)

  return sorted.map((space, index) => {
    const point = points[index] ?? { x: 0.5, y: 0.5, angle: 0 }
    return {
      id: space.id,
      boardIndex: space.boardIndex,
      title: space.title,
      category: space.category,
      color: space.color,
      icon: space.icon,
      description: space.description,
      encounterId: space.encounterId,
      x: point.x,
      y: point.y,
      angle: point.angle,
    }
  })
}

export function buildTrackPath(
  layout: BoardLayoutKind,
  spaceCount: number,
  options?: import('../types/board-config.js').BoardLayoutOptions,
): string {
  if (layout === 'rounded-rectangle') {
    const padding = options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const cornerRadius = options?.cornerRadius ?? DEFAULT_LAYOUT_OPTIONS.cornerRadius
    const w = (1 - padding * 2) * 100
    const h = w * 0.72
    const r = Math.min(cornerRadius, w / 400, h / 400) * 100
    return roundedRectTrackPath(50, 50, w, h, r)
  }

  const points = computeSpacePositions(layout, spaceCount, options)
  if (points.length === 0) return ''
  const first = points[0]!
  const segments = points.map((p) => `${p.x * 100} ${p.y * 100}`).join(' L ')
  return `M ${first.x * 100} ${first.y * 100} L ${segments} Z`
}

export function interpolateAlongSpaces(
  spaces: PositionedSpace[],
  fromIndex: number,
  toIndex: number,
  progress: number,
): { x: number; y: number } {
  const from = spaces.find((s) => s.boardIndex === fromIndex) ?? spaces[fromIndex]
  const to = spaces.find((s) => s.boardIndex === toIndex) ?? spaces[toIndex]
  if (!from || !to) return { x: 50, y: 50 }

  const t = Math.min(1, Math.max(0, progress))
  const spaceCount = spaces.length

  if (fromIndex === toIndex || spaceCount <= 1) {
    return { x: from.x * 100, y: from.y * 100 }
  }

  let steps = toIndex - fromIndex
  if (steps < 0) steps += spaceCount

  const stepFloat = steps * t
  const wholeSteps = Math.floor(stepFloat)
  const frac = stepFloat - wholeSteps

  let current = fromIndex
  for (let i = 0; i < wholeSteps; i++) {
    current = (current + 1) % spaceCount
  }

  const currentSpace = spaces.find((s) => s.boardIndex === current) ?? from
  const nextIndex = (current + 1) % spaceCount
  const nextSpace = spaces.find((s) => s.boardIndex === nextIndex) ?? to

  return {
    x: (currentSpace.x + (nextSpace.x - currentSpace.x) * frac) * 100,
    y: (currentSpace.y + (nextSpace.y - currentSpace.y) * frac) * 100,
  }
}
