import { describe, expect, it } from 'vitest'
import { Board } from './gameboard/aggregates/board.js'
import { GameboardEventType } from './gameboard/events/gameboard-events.js'
import { DEFAULT_BOARD_SPACES } from './gameboard/services/default-board-layout.js'

describe('Board aggregate', () => {
  const players = [{ playerId: 'solo', displayName: 'Alex' }]

  it('creates a board with tokens at start and no financial state', () => {
    const board = Board.create('board-1', 'sim-1', players)
    const state = board.toState()

    expect(state.spaces).toHaveLength(DEFAULT_BOARD_SPACES.length)
    expect(state.tokens[0]?.position).toBe(0)
    expect(state.phase).toBe('ready_to_roll')
    expect(state.simulationId).toBe('sim-1')
  })

  it('rolls dice and moves the current player without financial data', () => {
    let board = Board.create('board-2', 'sim-2', players)
    board = board.rollAndMove(() => 0.5) // deterministic mid-range roll

    const events = board.pullGameboardEvents()
    expect(events.some((e) => e.type === GameboardEventType.DICE_ROLLED)).toBe(true)
    expect(events.some((e) => e.type === GameboardEventType.PLAYER_MOVED)).toBe(true)
    expect(events.some((e) => e.type === GameboardEventType.PLAYER_LANDED)).toBe(true)
    expect(events.some((e) => e.type === GameboardEventType.SITUATION_TRIGGERED)).toBe(true)

    const state = board.toState()
    expect(state.lastDiceRoll).toBeGreaterThanOrEqual(1)
    expect(state.pendingEncounterId).toBeTruthy()
    expect(state.tokens[0]!.position).toBeGreaterThan(0)
  })

  it('enters decision phase after landing', () => {
    let board = Board.create('board-3', 'sim-3', players)
    board = board.rollAndMove(() => 0).enterDecisionPhase()

    expect(board.phase).toBe('decision_phase')
    const events = board.pullGameboardEvents()
    expect(events.some((e) => e.type === GameboardEventType.DECISION_PHASE_STARTED)).toBe(true)
  })

  it('completes a full turn cycle', () => {
    let board = Board.create('board-4', 'sim-4', players)
    board = board
      .rollAndMove(() => 0)
      .enterDecisionPhase()
      .markDecisionSubmitted()
      .markReflectionCompleted()
      .endTurn()

    expect(board.phase).toBe('ready_to_roll')
    expect(board.toState().roundNumber).toBe(2)

    const events = board.pullGameboardEvents()
    expect(events.some((e) => e.type === GameboardEventType.TURN_COMPLETED)).toBe(true)
    expect(events.some((e) => e.type === GameboardEventType.ROUND_COMPLETED)).toBe(true)
  })

  it('rejects dice roll during decision phase', () => {
    let board = Board.create('board-5', 'sim-5', players)
    board = board.rollAndMove(() => 0).enterDecisionPhase()

    expect(() => board.rollDice()).toThrow(/ready/)
  })
})
