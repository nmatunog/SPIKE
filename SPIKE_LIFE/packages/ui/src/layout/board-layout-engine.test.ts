import { describe, expect, it } from 'vitest'
import {
  boardLayoutEngine,
  generateBoardLayout,
  interpolateBoardMovement,
  registerLayoutEngine,
} from './board-layout-engine.js'
import type { BoardConfig, SpaceConfig } from '../types/board-config.js'
import { validateBoardConfig } from '../types/board-config.js'

const SAMPLE_SPACES: SpaceConfig[] = [
  {
    id: 'a',
    name: 'Start',
    category: 'career',
    color: '#f00',
    icon: 'briefcase',
    boardIndex: 0,
    encounterId: 'promotion',
    eventPool: ['promotion', 'salary_increase'],
  },
  {
    id: 'b',
    name: 'Finance',
    category: 'finance',
    color: '#00f',
    icon: 'wallet',
    boardIndex: 1,
    encounterId: 'salary_increase',
    connections: [2],
  },
  {
    id: 'c',
    name: 'Finish',
    category: 'milestone',
    color: '#0f0',
    icon: 'star',
    boardIndex: 2,
    encounterId: 'milestone',
  },
]

function configWithLayout(layout: BoardConfig['layout'], spaceCount = 16): BoardConfig {
  const spaces = Array.from({ length: spaceCount }, (_, boardIndex) => ({
    id: `space-${boardIndex}`,
    name: `Space ${boardIndex}`,
    category: 'milestone' as const,
    color: '#6366F1',
    icon: 'star' as const,
    boardIndex,
    encounterId: 'milestone',
  }))
  return { id: 'test', title: 'Test', layout, spaces }
}

describe('BoardLayoutEngine', () => {
  it('generates rounded-rectangle layout by default with dynamic coordinates', () => {
    const result = generateBoardLayout(configWithLayout('rounded-rectangle'))
    expect(result.spaces).toHaveLength(16)
    expect(result.trackPath).toMatch(/^M /)
    for (const space of result.spaces) {
      expect(space.x).toBeGreaterThan(0)
      expect(space.x).toBeLessThan(1)
      expect(space.connections.length).toBeGreaterThan(0)
      expect(space.eventPool.length).toBeGreaterThan(0)
    }
  })

  it('supports rectangle, circle, and serpentine layouts', () => {
    for (const layout of ['rectangle', 'circle', 'serpentine'] as const) {
      const result = generateBoardLayout(configWithLayout(layout, 6))
      expect(result.spaces).toHaveLength(6)
      expect(result.layout).toBe(layout)
    }
  })

  it('sorts spaces by boardIndex not config array order', () => {
    const shuffled: BoardConfig = {
      id: 'shuffled',
      title: 'Shuffled',
      layout: 'rounded-rectangle',
      spaces: [...SAMPLE_SPACES].reverse(),
    }
    const result = generateBoardLayout(shuffled)
    expect(result.spaces.map((s) => s.boardIndex)).toEqual([0, 1, 2])
    expect(result.spaces[0]?.name).toBe('Start')
  })

  it('auto-generates linear connections when omitted', () => {
    const result = generateBoardLayout({
      id: 'linear',
      title: 'Linear',
      layout: 'circle',
      spaces: SAMPLE_SPACES.map(({ connections: _c, ...s }) => s),
    })
    expect(result.spaces[0]?.connections).toEqual([1])
    expect(result.spaces[1]?.connections).toEqual([2])
    expect(result.spaces[2]?.connections).toEqual([0])
  })

  it('interpolates movement along boardIndex for animation', () => {
    const result = generateBoardLayout({
      id: 'move',
      title: 'Move',
      layout: 'rounded-rectangle',
      spaces: SAMPLE_SPACES,
    })
    const start = interpolateBoardMovement(result.spaces, 0, 2, 0)
    const mid = interpolateBoardMovement(result.spaces, 0, 2, 0.5)
    const end = interpolateBoardMovement(result.spaces, 0, 2, 1)

    expect(start.x).toBeCloseTo(result.spaces[0]!.x * 100, 1)
    expect(end.x).toBeCloseTo(result.spaces[2]!.x * 100, 1)
    expect(mid.x).not.toBeCloseTo(start.x, 0)
  })

  it('allows registering custom layout engines', () => {
    registerLayoutEngine({
      id: 'custom-diamond',
      label: 'Diamond',
      computePositions({ spaceCount }) {
        return Array.from({ length: spaceCount }, (_, i) => ({
          x: 0.5 + (i % 2 === 0 ? 0.2 : -0.2),
          y: 0.3 + (i / spaceCount) * 0.4,
          angle: 0,
        }))
      },
    })

    const result = boardLayoutEngine.generate(configWithLayout('custom-diamond', 4))
    expect(result.spaces).toHaveLength(4)
    expect(result.spaces[0]?.x).toBe(0.7)
  })

  it('validates duplicate boardIndex and bad connections', () => {
    expect(() =>
      validateBoardConfig({
        id: 'bad',
        title: 'Bad',
        layout: 'circle',
        spaces: [
          { id: 'a', name: 'A', category: 'career', color: '#f00', icon: 'briefcase', boardIndex: 0, encounterId: 'promotion' },
          { id: 'b', name: 'B', category: 'finance', color: '#00f', icon: 'wallet', boardIndex: 0, encounterId: 'salary_increase' },
        ],
      }),
    ).toThrow(/Duplicate boardIndex/)

    expect(() =>
      validateBoardConfig({
        id: 'bad-conn',
        title: 'Bad',
        layout: 'circle',
        spaces: [
          { id: 'a', name: 'A', category: 'career', color: '#f00', icon: 'briefcase', boardIndex: 0, encounterId: 'promotion', connections: [99] },
        ],
      }),
    ).toThrow(/connection 99/)
  })
})
