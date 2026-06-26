import type {
  BoardPhase,
  BoardSpace,
  BoardState,
  EncounterCardId,
  PlayerToken,
} from '../types.js'
import {
  BOARD_DICE_MAX,
  BOARD_DICE_MIN,
  DEFAULT_BOARD_ROUNDS,
} from '../types.js'
import type { GameboardEvent } from '../events/gameboard-events.js'
import {
  GameboardEventType,
  createGameboardEvent,
} from '../events/gameboard-events.js'
import { DEFAULT_BOARD_SPACES, advancePosition, spaceAt } from '../services/default-board-layout.js'
import { getEncounterCard } from '../services/encounter-deck.js'
import { PLAYER_TOKEN_COLORS } from '../../aggregates/game-room.js'

export class Board {
  private state: BoardState
  private uncommittedEvents: GameboardEvent[] = []

  private constructor(state: BoardState) {
    this.state = state
  }

  static create(
    id: string,
    simulationId: string,
    players: { playerId: string; displayName: string }[],
    maxRounds: number = DEFAULT_BOARD_ROUNDS,
    spaces: BoardSpace[] = DEFAULT_BOARD_SPACES,
  ): Board {
    if (players.length === 0) {
      throw new Error('At least one player is required to create a board.')
    }

    const now = new Date().toISOString()
    const tokens: PlayerToken[] = players.map((player, index) => ({
      playerId: player.playerId,
      displayName: player.displayName.trim() || `Player ${index + 1}`,
      position: 0,
      color: PLAYER_TOKEN_COLORS[index % PLAYER_TOKEN_COLORS.length] ?? '#8B0000',
    }))

    return new Board({
      id,
      simulationId,
      spaces: structuredClone(spaces),
      tokens,
      turnOrder: players.map((p) => p.playerId),
      currentPlayerIndex: 0,
      roundNumber: 1,
      boardYear: 1,
      maxRounds,
      phase: 'ready_to_roll',
      lastDiceRoll: null,
      pendingEncounterId: null,
      landedSpaceIndex: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static fromState(state: BoardState): Board {
    return new Board(structuredClone(state))
  }

  get id(): string {
    return this.state.id
  }

  get simulationId(): string {
    return this.state.simulationId
  }

  get phase(): BoardPhase {
    return this.state.phase
  }

  toState(): BoardState {
    return structuredClone(this.state)
  }

  pullGameboardEvents(): GameboardEvent[] {
    const events = [...this.uncommittedEvents]
    this.uncommittedEvents = []
    return events
  }

  get currentPlayerId(): string {
    return this.state.turnOrder[this.state.currentPlayerIndex]!
  }

  getToken(playerId: string): PlayerToken | undefined {
    return this.state.tokens.find((token) => token.playerId === playerId)
  }

  rollDice(rng: () => number = Math.random): number {
    if (this.state.phase !== 'ready_to_roll') {
      throw new Error('Dice can only be rolled when the board is ready.')
    }

    const value = Math.floor(rng() * (BOARD_DICE_MAX - BOARD_DICE_MIN + 1)) + BOARD_DICE_MIN
    const playerId = this.currentPlayerId

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.DICE_ROLLED, this.state.id, {
        playerId,
        value,
      }),
    )

    this.state = {
      ...this.state,
      lastDiceRoll: value,
      updatedAt: new Date().toISOString(),
    }

    return value
  }

  moveCurrentPlayer(steps: number): Board {
    const playerId = this.currentPlayerId
    const token = this.getToken(playerId)
    if (!token) throw new Error(`Token not found for player: ${playerId}`)

    const fromPosition = token.position
    const toPosition = advancePosition(fromPosition, steps, this.state.spaces.length)
    const landed = spaceAt(this.state.spaces, toPosition)

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.PLAYER_MOVED, this.state.id, {
        playerId,
        fromPosition,
        toPosition,
        steps,
      }),
    )

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.PLAYER_LANDED, this.state.id, {
        playerId,
        spaceIndex: landed.index,
        spaceLabel: landed.label,
        encounterId: landed.encounterId,
      }),
    )

    const encounter = getEncounterCard(landed.encounterId)

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.SITUATION_TRIGGERED, this.state.id, {
        playerId,
        encounterId: landed.encounterId,
        scenarioId: encounter.scenarioId,
        simulationId: this.state.simulationId,
      }),
    )

    this.state = {
      ...this.state,
      tokens: this.state.tokens.map((t) =>
        t.playerId === playerId ? { ...t, position: toPosition } : t,
      ),
      pendingEncounterId: landed.encounterId,
      landedSpaceIndex: landed.index,
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  rollAndMove(rng?: () => number): Board {
    const steps = this.rollDice(rng)
    return this.moveCurrentPlayer(steps)
  }

  enterDecisionPhase(): Board {
    if (!this.state.pendingEncounterId) {
      throw new Error('No encounter to resolve.')
    }

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.DECISION_PHASE_STARTED, this.state.id, {
        playerId: this.currentPlayerId,
        encounterId: this.state.pendingEncounterId,
      }),
    )

    this.state = {
      ...this.state,
      phase: 'decision_phase',
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  markDecisionSubmitted(): Board {
    if (this.state.phase !== 'decision_phase') {
      throw new Error('No active decision phase.')
    }

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.DECISION_SUBMITTED, this.state.id, {
        playerId: this.currentPlayerId,
        encounterId: this.state.pendingEncounterId,
      }),
    )

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.OUTCOME_RESOLVED, this.state.id, {
        playerId: this.currentPlayerId,
        encounterId: this.state.pendingEncounterId,
      }),
    )

    return this
  }

  markReflectionCompleted(): Board {
    if (this.state.phase !== 'decision_phase') {
      throw new Error('Reflection can only complete during a decision phase.')
    }

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.REFLECTION_COMPLETED, this.state.id, {
        playerId: this.currentPlayerId,
        encounterId: this.state.pendingEncounterId,
      }),
    )

    this.state = {
      ...this.state,
      phase: 'turn_complete',
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  endTurn(): Board {
    if (this.state.phase !== 'turn_complete') {
      throw new Error('Turn must be complete before ending.')
    }

    const playerId = this.currentPlayerId
    const roundNumber = this.state.roundNumber

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.TURN_COMPLETED, this.state.id, {
        playerId,
        roundNumber,
      }),
    )

    const isLastPlayer = this.state.currentPlayerIndex >= this.state.turnOrder.length - 1

    if (!isLastPlayer) {
      this.state = {
        ...this.state,
        currentPlayerIndex: this.state.currentPlayerIndex + 1,
        phase: 'ready_to_roll',
        lastDiceRoll: null,
        pendingEncounterId: null,
        landedSpaceIndex: null,
        updatedAt: new Date().toISOString(),
      }
      return this
    }

    return this.completeRound()
  }

  private completeRound(): Board {
    const roundNumber = this.state.roundNumber

    this.uncommittedEvents.push(
      createGameboardEvent(GameboardEventType.ROUND_COMPLETED, this.state.id, {
        roundNumber,
        boardYear: this.state.boardYear,
      }),
    )

    if (roundNumber >= this.state.maxRounds) {
      this.state = {
        ...this.state,
        phase: 'game_complete',
        pendingEncounterId: null,
        landedSpaceIndex: null,
        lastDiceRoll: null,
        updatedAt: new Date().toISOString(),
      }
      return this
    }

    this.state = {
      ...this.state,
      roundNumber: roundNumber + 1,
      boardYear: this.state.boardYear + 1,
      currentPlayerIndex: 0,
      phase: 'ready_to_roll',
      lastDiceRoll: null,
      pendingEncounterId: null,
      landedSpaceIndex: null,
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  pendingEncounter(): EncounterCardId | null {
    return this.state.pendingEncounterId
  }
}
