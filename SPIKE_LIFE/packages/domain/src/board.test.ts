import { describe, expect, it } from 'vitest'
import { Board } from './gameboard/aggregates/board.js'
import { GameboardEventType } from './gameboard/events/gameboard-events.js'
import { DEFAULT_BOARD_SPACES } from './gameboard/services/default-board-layout.js'

const PLAYER_AGE = 22

describe('Board aggregate', () => {
  const players = [{ playerId: 'solo', displayName: 'Alex' }]

  it('creates a board with tokens at start and no financial state', () => {
    const board = Board.create('board-1', 'sim-1', players)
    const state = board.toState()

    expect(state.spaces).toHaveLength(DEFAULT_BOARD_SPACES.length)
    expect(state.tokens[0]?.position).toBe(0)
    expect(state.phase).toBe('ready_to_roll')
    expect(state.advisorInsightOffered).toBe(false)
  })

  it('begins next year with age-weighted domain and situation', () => {
    let board = Board.create('board-2', 'sim-2', players)
    board = board.beginNextYear(PLAYER_AGE, () => 0)

    const events = board.pullGameboardEvents()
    expect(events.some((e) => e.type === GameboardEventType.DOMAIN_SELECTED)).toBe(true)
    expect(events.some((e) => e.type === GameboardEventType.SITUATION_TRIGGERED)).toBe(true)

    const state = board.toState()
    expect(state.selectedDomainId).toBe('career')
    expect(state.pendingEncounterId).toBeTruthy()
  })

  it('enters decision phase and may offer advisor insight', () => {
    let board = Board.create('board-3', 'sim-3', players)
    board = board.beginNextYear(PLAYER_AGE, () => 0).enterDecisionPhase(() => 0)

    expect(board.phase).toBe('decision_phase')
    expect(board.toState().advisorInsightOffered).toBe(true)
  })

  it('completes a full turn cycle', () => {
    let board = Board.create('board-4', 'sim-4', players)
    board = board
      .beginNextYear(PLAYER_AGE, () => 0)
      .enterDecisionPhase()
      .markDecisionSubmitted()
      .markReflectionCompleted()
      .endTurn()

    expect(board.phase).toBe('ready_to_roll')
    expect(board.toState().roundNumber).toBe(2)
  })

  it('rejects year start during decision phase', () => {
    let board = Board.create('board-5', 'sim-5', players)
    board = board.beginNextYear(PLAYER_AGE, () => 0).enterDecisionPhase()

    expect(() => board.selectDomainForYear(PLAYER_AGE)).toThrow(/year/)
  })
})
