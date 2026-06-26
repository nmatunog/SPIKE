import type { LayoutEngine, LayoutEngineInput, LayoutPoint } from './types.js'
import { DEFAULT_LAYOUT_OPTIONS } from './types.js'

/** Evenly distribute spaces around a circle (clockwise from top). */
export const circleLayout: LayoutEngine = {
  computePositions({ spaceCount, options }: LayoutEngineInput): LayoutPoint[] {
    const padding = options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const radius = 0.5 - padding
    const cx = 0.5
    const cy = 0.5

    return Array.from({ length: spaceCount }, (_, index) => {
      const theta = -Math.PI / 2 + (index / spaceCount) * Math.PI * 2
      const x = cx + radius * Math.cos(theta)
      const y = cy + radius * Math.sin(theta)
      const angle = theta + Math.PI / 2
      return { x, y, angle }
    })
  },
}
