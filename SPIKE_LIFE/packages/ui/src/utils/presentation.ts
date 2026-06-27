import type { BoardTokenViewModel } from '../types/view-models.js'

/** Pure presentation helper — groups tokens by board position for rendering. */
export function groupTokensByPosition(
  tokens: BoardTokenViewModel[],
): Map<number, BoardTokenViewModel[]> {
  const map = new Map<number, BoardTokenViewModel[]>()
  for (const token of tokens) {
    const list = map.get(token.position) ?? []
    list.push(token)
    map.set(token.position, list)
  }
  return map
}

/** Pick readable text color for a space tile background. */
export function textColorForSpace(hexColor: string): string {
  return hexColor.toUpperCase() === '#EAB308' ? '#1e293b' : '#ffffff'
}
