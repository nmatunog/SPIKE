import type { LayoutEngineInput, LayoutPoint, PathSampler } from './types.js'
import { DEFAULT_LAYOUT_OPTIONS } from './types.js'
import { distributeEvenlyOnPath } from './perimeter-distribution.js'
import { pointOnRoundedRectPerimeter, roundedRectPerimeterLength } from './rounded-rectangle-math.js'

function rectanglePathSampler(
  cx: number,
  cy: number,
  w: number,
  h: number,
): PathSampler {
  const halfW = w / 2
  const halfH = h / 2
  const segments = [
    { len: w, fn: (t: number) => ({ x: cx - halfW + t * w, y: cy - halfH }) },
    { len: h, fn: (t: number) => ({ x: cx + halfW, y: cy - halfH + t * h }) },
    { len: w, fn: (t: number) => ({ x: cx + halfW - t * w, y: cy + halfH }) },
    { len: h, fn: (t: number) => ({ x: cx - halfW, y: cy + halfH - t * h }) },
  ]
  const total = segments.reduce((sum, s) => sum + s.len, 0)

  return {
    pathLength: total,
    sampleAt(distance: number) {
      let d = ((distance % total) + total) % total
      for (const seg of segments) {
        if (d <= seg.len) {
          const t = seg.len > 0 ? d / seg.len : 0
          return seg.fn(t)
        }
        d -= seg.len
      }
      return { x: cx, y: cy }
    },
  }
}

function roundedRectPathSampler(
  cx: number,
  cy: number,
  w: number,
  h: number,
  r: number,
): PathSampler {
  const total = roundedRectPerimeterLength(w, h, r)
  return {
    pathLength: total,
    sampleAt(distance: number) {
      return pointOnRoundedRectPerimeter(distance, cx, cy, w, h, r)
    },
  }
}

/** Spaces evenly distributed along a sharp rectangle perimeter. */
export const rectangleLayout = {
  computePositions({ spaceCount, options }: LayoutEngineInput): LayoutPoint[] {
    const padding = options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const w = 1 - padding * 2
    const h = w * ((options?.aspectRatio ?? DEFAULT_LAYOUT_OPTIONS.aspectRatio) / (4 / 3))
    const halfH = Math.min(h / 2, 0.42)
    const sampler = rectanglePathSampler(0.5, 0.5, w, halfH * 2)
    return distributeEvenlyOnPath(spaceCount, sampler)
  },
}

/** Rounded rectangle — default SPIKE LIFE track shape. */
export const roundedRectangleLayout = {
  computePositions({ spaceCount, options }: LayoutEngineInput): LayoutPoint[] {
    const padding = options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const cornerRadius = options?.cornerRadius ?? DEFAULT_LAYOUT_OPTIONS.cornerRadius
    const w = 1 - padding * 2
    const h = w * 0.72
    const r = Math.min(cornerRadius, w / 4, h / 4)
    const sampler = roundedRectPathSampler(0.5, 0.5, w, h, r)
    return distributeEvenlyOnPath(spaceCount, sampler)
  },
}
