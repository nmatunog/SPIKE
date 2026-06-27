import { describe, expect, it } from 'vitest'
import { groupTokensByPosition } from './presentation.js'

describe('presentation utils', () => {
  it('groupTokensByPosition groups by board position', () => {
    const map = groupTokensByPosition([
      { playerId: 'a', displayName: 'A', position: 0, color: '#f00', isCurrent: true },
      { playerId: 'b', displayName: 'B', position: 0, color: '#00f', isCurrent: false },
      { playerId: 'c', displayName: 'C', position: 2, color: '#0f0', isCurrent: false },
    ])
    expect(map.get(0)).toHaveLength(2)
    expect(map.get(2)).toHaveLength(1)
  })
})
