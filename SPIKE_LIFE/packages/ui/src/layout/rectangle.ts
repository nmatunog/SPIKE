import type { LayoutEngine, LayoutEngineInput, LayoutPoint } from './types.js'
import { DEFAULT_LAYOUT_OPTIONS } from './types.js'
import { pointOnRoundedRectPerimeter, roundedRectPerimeterLength } from './rounded-rectangle-math.js'

/** Spaces along the perimeter of an axis-aligned rectangle (sharp corners). */
export const rectangleLayout: LayoutEngine = {
  computePositions({ spaceCount, options }: LayoutEngineInput): LayoutPoint[] {
    const padding = options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const w = 1 - padding * 2
    const h = w * (options?.aspectRatio ?? DEFAULT_LAYOUT_OPTIONS.aspectRatio) / (4 / 3)
    const cx = 0.5
    const cy = 0.5
    const halfW = w / 2
    const halfH = Math.min(h / 2, 0.42)

    const segments = [
      { len: w, fn: (t: number) => ({ x: cx - halfW + t * w, y: cy - halfH }) },
      { len: halfH * 2, fn: (t: number) => ({ x: cx + halfW, y: cy - halfH + t * halfH * 2 }) },
      { len: w, fn: (t: number) => ({ x: cx + halfW - t * w, y: cy + halfH }) },
      { len: halfH * 2, fn: (t: number) => ({ x: cx - halfW, y: cy + halfH - t * halfH * 2 }) },
    ]
    const total = segments.reduce((sum, s) => sum + s.len, 0)

    return Array.from({ length: spaceCount }, (_, index) => {
      const dist = (index / spaceCount) * total
      let walked = 0
      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s]!
        if (walked + seg.len >= dist || s === segments.length - 1) {
          const localT = seg.len > 0 ? (dist - walked) / seg.len : 0
          const p = seg.fn(Math.min(1, Math.max(0, localT)))
          const next = seg.fn(Math.min(1, localT + 0.02))
          const angle = Math.atan2(next.y - p.y, next.x - p.x)
          return { x: p.x, y: p.y, angle }
        }
        walked += seg.len
      }
      return { x: cx, y: cy, angle: 0 }
    })
  },
}

/** Rounded rectangle — default premium board track. */
export const roundedRectangleLayout: LayoutEngine = {
  computePositions({ spaceCount, options }: LayoutEngineInput): LayoutPoint[] {
    const padding = options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const cornerRadius = options?.cornerRadius ?? DEFAULT_LAYOUT_OPTIONS.cornerRadius
    const w = 1 - padding * 2
    const h = w * 0.72
    const cx = 0.5
    const cy = 0.5
    const r = Math.min(cornerRadius, w / 4, h / 4)
    const total = roundedRectPerimeterLength(w, h, r)

    return Array.from({ length: spaceCount }, (_, index) => {
      const dist = (index / spaceCount) * total
      const p = pointOnRoundedRectPerimeter(dist, cx, cy, w, h, r)
      const pNext = pointOnRoundedRectPerimeter(dist + total * 0.01, cx, cy, w, h, r)
      const angle = Math.atan2(pNext.y - p.y, pNext.x - p.x)
      return { x: p.x, y: p.y, angle }
    })
  },
}
