import { describe, expect, it } from 'vitest'
import { DEFAULT_BOARD_CONFIG, loadBoardConfig } from './index.js'

describe('resolveBoardConfig', () => {
  it('loads default board from JSON with 16 spaces', () => {
    expect(DEFAULT_BOARD_CONFIG.spaces).toHaveLength(16)
    expect(DEFAULT_BOARD_CONFIG.layout).toBe('rounded-rectangle')
  })

  it('applies category defaults for minimal space definitions', () => {
    const config = loadBoardConfig({
      spaces: [
        { id: 'career', title: 'Career Lift', category: 'career', color: '#D54B4B', icon: 'briefcase' },
        { id: 'paycheck', category: 'finance' },
      ],
    })

    expect(config.spaces[0]).toMatchObject({
      id: 'career',
      name: 'Career Lift',
      color: '#D54B4B',
      icon: 'briefcase',
      boardIndex: 0,
      encounterId: 'promotion',
    })

    expect(config.spaces[1]).toMatchObject({
      id: 'paycheck',
      name: 'Paycheck',
      category: 'finance',
      color: '#3B82F6',
      icon: 'wallet',
      boardIndex: 1,
      encounterId: 'salary_increase',
    })
  })

  it('auto-assigns boardIndex from array order', () => {
    const config = loadBoardConfig({
      spaces: [
        { id: 'b', category: 'bonus' },
        { id: 'a', category: 'career' },
      ],
    })

    expect(config.spaces.map((s) => s.boardIndex)).toEqual([0, 1])
    expect(config.spaces[0]?.id).toBe('b')
  })

  it('humanizes id when title is omitted', () => {
    const config = loadBoardConfig({
      spaces: [{ id: 'job-risk', category: 'risk' }],
    })

    expect(config.spaces[0]?.name).toBe('Job Risk')
  })
})
