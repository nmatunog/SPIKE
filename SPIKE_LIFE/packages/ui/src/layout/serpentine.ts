import type { LayoutEngineInput, LayoutPoint } from './types.js'
import { DEFAULT_LAYOUT_OPTIONS } from './types.js'

/** Grid serpentine — legacy layout, still supported for custom boards. */
export const serpentineLayout = {
  computePositions({ spaceCount, options }: LayoutEngineInput): LayoutPoint[] {
    const cols = options?.serpentineColumns ?? DEFAULT_LAYOUT_OPTIONS.serpentineColumns
    const paddingX = options?.padding ?? DEFAULT_LAYOUT_OPTIONS.padding
    const paddingY = paddingX + 0.02
    const rows = Math.ceil(spaceCount / cols)
    const usableX = 1 - 2 * paddingX
    const usableY = 1 - 2 * paddingY

    return Array.from({ length: spaceCount }, (_, index) => {
      const row = Math.floor(index / cols)
      const colInRow = index % cols
      const col = row % 2 === 0 ? colInRow : cols - 1 - colInRow
      const x = paddingX + (cols <= 1 ? 0.5 : (col / (cols - 1)) * usableX)
      const y = paddingY + (rows <= 1 ? 0.5 : (row / (rows - 1)) * usableY)
      const nextCol = row % 2 === 0 ? col + 1 : col - 1
      const nextX =
        nextCol >= 0 && nextCol < cols
          ? paddingX + (cols <= 1 ? 0.5 : (nextCol / (cols - 1)) * usableX)
          : x
      const nextY =
        nextCol >= 0 && nextCol < cols
          ? y
          : paddingY + (rows <= 1 ? 0.5 : ((row + 1) / (rows - 1)) * usableY)
      const angle = Math.atan2(nextY - y, nextX - x)
      return { x, y, angle }
    })
  },
}
