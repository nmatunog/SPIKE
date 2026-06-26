import { describe, expect, it } from 'vitest'
import { computeSpacePositions, positionSpaces } from './engine.js'
import type { SpaceConfig } from '../types/board-config.js'

describe('layout engine', () => {
  it('places N spaces on rounded rectangle without hardcoded coords', () => {
    const points = computeSpacePositions('rounded-rectangle', 16)
    expect(points).toHaveLength(16)
    for (const p of points) {
      expect(p.x).toBeGreaterThan(0)
      expect(p.x).toBeLessThan(1)
      expect(p.y).toBeGreaterThan(0)
      expect(p.y).toBeLessThan(1)
    }
  })

  it('supports circle, rectangle, and serpentine layouts', () => {
    for (const layout of ['circle', 'rectangle', 'serpentine'] as const) {
      const points = computeSpacePositions(layout, 6)
      expect(points).toHaveLength(6)
    }
  })

  it('maps board config spaces to positioned spaces by boardIndex', () => {
    const spaces: SpaceConfig[] = [
      {
        id: 'a',
        title: 'A',
        category: 'career',
        color: '#f00',
        icon: 'briefcase',
        boardIndex: 0,
        encounterId: 'promotion',
      },
      {
        id: 'b',
        title: 'B',
        category: 'finance',
        color: '#00f',
        icon: 'wallet',
        boardIndex: 1,
        encounterId: 'salary_increase',
      },
    ]
    const positioned = positionSpaces(spaces, 'rounded-rectangle')
    expect(positioned[0]?.id).toBe('a')
    expect(positioned[1]?.id).toBe('b')
    const dx = (positioned[0]?.x ?? 0) - (positioned[1]?.x ?? 0)
    const dy = (positioned[0]?.y ?? 0) - (positioned[1]?.y ?? 0)
    expect(dx * dx + dy * dy).toBeGreaterThan(0)
  })
})
