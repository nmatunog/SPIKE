import type { LayoutPoint, PathSampler } from './types.js'

const TAU = Math.PI * 2

/**
 * Evenly distribute N spaces along a path perimeter.
 * No hardcoded coordinates — positions come entirely from the sampler.
 */
export function distributeEvenlyOnPath(spaceCount: number, path: PathSampler): LayoutPoint[] {
  if (spaceCount <= 0) return []

  const { pathLength, sampleAt } = path
  if (pathLength <= 0 || spaceCount === 1) {
    const p = sampleAt(0)
    return [{ x: p.x, y: p.y, angle: 0 }]
  }

  const epsilon = pathLength * 0.008

  return Array.from({ length: spaceCount }, (_, index) => {
    const dist = (index / spaceCount) * pathLength
    const p = sampleAt(dist)
    const pNext = sampleAt((dist + epsilon) % pathLength)
    const angle = Math.atan2(pNext.y - p.y, pNext.x - p.x)
    return { x: p.x, y: p.y, angle }
  })
}

/** Build SVG path by connecting evenly distributed sample points. */
export function pathFromSampler(path: PathSampler, spaceCount: number, close = true): string {
  const points = distributeEvenlyOnPath(Math.max(spaceCount, 2), path)
  if (points.length === 0) return ''

  const first = points[0]!
  const segments = points.map((p) => `${p.x * 100} ${p.y * 100}`).join(' L ')
  return close
    ? `M ${first.x * 100} ${first.y * 100} L ${segments} Z`
    : `M ${first.x * 100} ${first.y * 100} L ${segments}`
}

/** Circle path sampler — clockwise from top. */
export function circlePathSampler(
  cx: number,
  cy: number,
  radius: number,
): PathSampler {
  const pathLength = TAU * radius
  return {
    pathLength,
    sampleAt(distance: number) {
      const theta = -Math.PI / 2 + ((distance % pathLength) / pathLength) * TAU
      return {
        x: cx + radius * Math.cos(theta),
        y: cy + radius * Math.sin(theta),
      }
    },
  }
}
