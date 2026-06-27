import type { LayoutEngineInput, LayoutPoint } from './types.js'
import { DEFAULT_LAYOUT_OPTIONS } from './types.js'
import { circlePathSampler, distributeEvenlyOnPath } from './perimeter-distribution.js'

/** Evenly distribute spaces around a circle (clockwise from top). */
export const circleLayout = {
  computePositions({ spaceCount, options }: LayoutEngineInput): LayoutPoint[] {
    const padding = options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const radius = 0.5 - padding
    const sampler = circlePathSampler(0.5, 0.5, radius)

    return distributeEvenlyOnPath(spaceCount, sampler).map((point, index) => {
      const theta = -Math.PI / 2 + (index / Math.max(1, spaceCount)) * Math.PI * 2
      return { ...point, angle: theta + Math.PI / 2 }
    })
  },
}
