import type {
  LifeStage,
  PlayerSlotStatus,
  RoomPhase,
  SessionMode,
} from '../types.js'
import type { DecisionTimerPreset } from '@spike-life/content-core'
import { GAME_ROOM_MAX_PLAYERS, GAME_ROOM_MIN_PLAYERS } from '../types.js'
import {
  lifeStageForTurn,
  workshopStageLabel,
} from '../services/workshop-progression.js'
import { resolveMaxTurns } from '../services/session-mode.js'
import { timerSecondsFromPreset } from '../services/planning-cycle.js'
import { getCampaignConfig } from '../services/campaign-context.js'

export const PLAYER_TOKEN_COLORS = [
  '#8B0000',
  '#1d4ed8',
  '#047857',
  '#b45309',
  '#7c3aed',
  '#be185d',
] as const

export interface PlayerSlot {
  slotIndex: number
  playerId: string
  displayName: string
  simulationId: string
  archetypeId: string
  tokenColor: string
  status: PlayerSlotStatus
  joinedAt: string
}

export interface GameRoomState {
  id: string
  gameCode: string
  facilitatorId: string
  maxPlayers: number
  sessionMode: SessionMode
  decisionTimerPreset: DecisionTimerPreset
  turnNumber: number
  maxTurns: number
  lifeStage: LifeStage
  roomPhase: RoomPhase
  cycleDeadlineAt: string | null
  joinOpen: boolean
  slots: PlayerSlot[]
  createdAt: string
  updatedAt: string
}

export class GameRoom {
  private state: GameRoomState

  private constructor(state: GameRoomState) {
    this.state = state
  }

  static create(
    id: string,
    facilitatorId: string,
    gameCode: string,
    options?: {
      maxPlayers?: number
      sessionMode?: SessionMode
      decisionTimerPreset?: DecisionTimerPreset
    },
  ): GameRoom {
    const now = new Date().toISOString()
    const capped = Math.min(
      Math.max(1, options?.maxPlayers ?? GAME_ROOM_MAX_PLAYERS),
      GAME_ROOM_MAX_PLAYERS,
    )
    const sessionMode = options?.sessionMode ?? 'campaign'
    const config = getCampaignConfig()
    const timerPreset = options?.decisionTimerPreset ?? config.decisionTimerSeconds

    return new GameRoom({
      id,
      gameCode,
      facilitatorId,
      maxPlayers: capped,
      sessionMode,
      decisionTimerPreset: timerPreset,
      turnNumber: 1,
      maxTurns: resolveMaxTurns(sessionMode),
      lifeStage: lifeStageForTurn(1),
      roomPhase: 'lobby',
      cycleDeadlineAt: null,
      joinOpen: true,
      slots: [],
      createdAt: now,
      updatedAt: now,
    })
  }

  configureLobby(options: {
    sessionMode?: SessionMode
    decisionTimerPreset?: DecisionTimerPreset
  }): GameRoom {
    if (this.state.roomPhase !== 'lobby') {
      throw new Error('Lobby settings can only change before the session starts.')
    }
    const sessionMode = options.sessionMode ?? this.state.sessionMode
    this.state = {
      ...this.state,
      sessionMode,
      decisionTimerPreset: options.decisionTimerPreset ?? this.state.decisionTimerPreset,
      maxTurns: resolveMaxTurns(sessionMode),
      updatedAt: new Date().toISOString(),
    }
    return this
  }

  static fromState(state: GameRoomState): GameRoom {
    return new GameRoom(structuredClone(state))
  }

  get id(): string {
    return this.state.id
  }

  toState(): GameRoomState {
    return structuredClone(this.state)
  }

  getSlot(playerId: string): PlayerSlot | undefined {
    return this.state.slots.find((slot) => slot.playerId === playerId)
  }

  get activeSlots(): PlayerSlot[] {
    return this.state.slots
  }

  join(
    playerId: string,
    displayName: string,
    simulationId: string,
    archetypeId: string,
  ): GameRoom {
    if (!this.state.joinOpen) {
      throw new Error('This room is closed to new players.')
    }
    if (this.state.roomPhase !== 'lobby') {
      throw new Error('Players can only join while the room is in lobby.')
    }
    if (this.state.slots.length >= this.state.maxPlayers) {
      throw new Error(`Room is full (${this.state.maxPlayers} players max).`)
    }
    if (this.state.slots.some((slot) => slot.playerId === playerId)) {
      throw new Error(`Player "${playerId}" is already in the room.`)
    }

    const slotIndex = this.state.slots.length
    const slot: PlayerSlot = {
      slotIndex,
      playerId,
      displayName: displayName.trim() || `Player ${slotIndex + 1}`,
      simulationId,
      archetypeId,
      tokenColor: PLAYER_TOKEN_COLORS[slotIndex % PLAYER_TOKEN_COLORS.length] ?? '#8B0000',
      status: 'joined',
      joinedAt: new Date().toISOString(),
    }

    this.state = {
      ...this.state,
      slots: [...this.state.slots, slot],
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  startCycle(): GameRoom {
    if (this.state.roomPhase !== 'lobby') {
      throw new Error('A cycle is already in progress.')
    }
    if (this.state.turnNumber > this.state.maxTurns) {
      throw new Error('Session is already complete.')
    }
    if (this.state.slots.length === 0) {
      throw new Error('At least one player must join before starting a cycle.')
    }
    if (this.state.slots.length < GAME_ROOM_MIN_PLAYERS) {
      throw new Error(
        `At least ${GAME_ROOM_MIN_PLAYERS} players are required to start (currently ${this.state.slots.length}).`,
      )
    }

    const timerSec = timerSecondsFromPreset(this.state.decisionTimerPreset)
    const deadline = timerSec > 0
      ? new Date(Date.now() + timerSec * 1000).toISOString()
      : null

    this.state = {
      ...this.state,
      roomPhase: 'cycle_active',
      cycleDeadlineAt: deadline,
      joinOpen: false,
      slots: this.state.slots.map((slot) => ({
        ...slot,
        status: 'planning',
      })),
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  /** @deprecated Use startCycle() — scenario is domain-driven after R3/R4. */
  startTurn(_scenarioId?: string): GameRoom {
    return this.startCycle()
  }

  syncSlotFromSimulationPhase(
    playerId: string,
    simulationPhase: string,
  ): GameRoom {
    const slot = this.getSlot(playerId)
    if (!slot || (this.state.roomPhase !== 'cycle_active' && this.state.roomPhase !== 'turn_active')) {
      return this
    }

    let status: PlayerSlotStatus = slot.status
    if (simulationPhase === 'decision_pending') status = 'planning'
    if (simulationPhase === 'consequences_applied') status = 'decided'
    if (simulationPhase === 'cycle_complete') status = 'done'

    if (status === slot.status) return this

    this.state = {
      ...this.state,
      slots: this.state.slots.map((s) =>
        s.playerId === playerId ? { ...s, status } : s,
      ),
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  allPlayersDone(): boolean {
    return (
      this.state.slots.length > 0
      && this.state.slots.every((slot) => slot.status === 'done')
    )
  }

  canAdvanceTurn(): boolean {
    return (
      (this.state.roomPhase === 'cycle_active' || this.state.roomPhase === 'turn_active')
      && this.allPlayersDone()
      && this.state.turnNumber < this.state.maxTurns
    )
  }

  isSessionComplete(): boolean {
    return (
      (this.state.roomPhase === 'cycle_active' || this.state.roomPhase === 'turn_active')
      && this.allPlayersDone()
      && this.state.turnNumber >= this.state.maxTurns
    )
  }

  /** @deprecated Use isSessionComplete() */
  isWorkshopComplete(): boolean {
    return this.isSessionComplete()
  }

  advanceTurn(): GameRoom {
    if (!this.allPlayersDone()) {
      throw new Error('All players must finish reflection before advancing.')
    }
    if (this.state.roomPhase !== 'cycle_active' && this.state.roomPhase !== 'turn_active') {
      throw new Error('No active cycle to advance.')
    }

    if (this.state.turnNumber >= this.state.maxTurns) {
      this.state = {
        ...this.state,
        roomPhase: 'session_complete',
        cycleDeadlineAt: null,
        updatedAt: new Date().toISOString(),
      }
      return this
    }

    const nextTurn = this.state.turnNumber + 1

    this.state = {
      ...this.state,
      turnNumber: nextTurn,
      lifeStage: lifeStageForTurn(
        Math.min(nextTurn, this.state.sessionMode === 'campaign' ? 5 : nextTurn),
      ),
      roomPhase: 'lobby',
      cycleDeadlineAt: null,
      slots: this.state.slots.map((slot) => ({
        ...slot,
        status: 'joined',
      })),
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  lifeStageLabel(): string {
    return workshopStageLabel(this.state.lifeStage)
  }
}

export function simulationIdForPlayer(roomId: string, playerId: string): string {
  return `${roomId}:${playerId}`
}
