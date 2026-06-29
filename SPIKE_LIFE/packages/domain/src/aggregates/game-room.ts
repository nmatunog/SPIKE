import type {
  LifeStage,
  PlayerSlotStatus,
  RoomPhase,
  ScenarioId,
} from '../types.js'
import { GAME_ROOM_MAX_PLAYERS, GAME_ROOM_MIN_PLAYERS } from '../types.js'
import {
  WORKSHOP_MAX_TURNS,
  lifeStageForTurn,
  workshopStageLabel,
} from '../services/workshop-progression.js'

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
  facilitatorId: string
  maxPlayers: number
  turnNumber: number
  maxTurns: number
  lifeStage: LifeStage
  roomPhase: RoomPhase
  sharedScenarioId: ScenarioId | null
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
    maxPlayers: number = GAME_ROOM_MAX_PLAYERS,
  ): GameRoom {
    const now = new Date().toISOString()
    const capped = Math.min(Math.max(1, maxPlayers), GAME_ROOM_MAX_PLAYERS)

    return new GameRoom({
      id,
      facilitatorId,
      maxPlayers: capped,
      turnNumber: 1,
      maxTurns: WORKSHOP_MAX_TURNS,
      lifeStage: lifeStageForTurn(1),
      roomPhase: 'lobby',
      sharedScenarioId: null,
      joinOpen: true,
      slots: [],
      createdAt: now,
      updatedAt: now,
    })
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

  startTurn(scenarioId: ScenarioId): GameRoom {
    if (this.state.roomPhase !== 'lobby') {
      throw new Error('A turn is already in progress.')
    }
    if (this.state.turnNumber > this.state.maxTurns) {
      throw new Error('Workshop is already complete.')
    }
    if (this.state.slots.length === 0) {
      throw new Error('At least one player must join before starting a turn.')
    }
    if (this.state.slots.length < GAME_ROOM_MIN_PLAYERS) {
      throw new Error(
        `At least ${GAME_ROOM_MIN_PLAYERS} players are required to start (currently ${this.state.slots.length}).`,
      )
    }

    this.state = {
      ...this.state,
      roomPhase: 'turn_active',
      sharedScenarioId: scenarioId,
      joinOpen: false,
      slots: this.state.slots.map((slot) => ({
        ...slot,
        status: 'planning',
      })),
      updatedAt: new Date().toISOString(),
    }

    return this
  }

  syncSlotFromSimulationPhase(
    playerId: string,
    simulationPhase: string,
  ): GameRoom {
    const slot = this.getSlot(playerId)
    if (!slot || this.state.roomPhase !== 'turn_active') {
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
      this.state.roomPhase === 'turn_active'
      && this.allPlayersDone()
      && this.state.turnNumber < this.state.maxTurns
    )
  }

  isWorkshopComplete(): boolean {
    return (
      this.state.roomPhase === 'turn_active'
      && this.allPlayersDone()
      && this.state.turnNumber >= this.state.maxTurns
    )
  }

  advanceTurn(): GameRoom {
    if (!this.allPlayersDone()) {
      throw new Error('All players must finish reflection before advancing.')
    }
    if (this.state.roomPhase !== 'turn_active') {
      throw new Error('No active turn to advance.')
    }

    if (this.state.turnNumber >= this.state.maxTurns) {
      this.state = {
        ...this.state,
        roomPhase: 'workshop_complete',
        sharedScenarioId: null,
        updatedAt: new Date().toISOString(),
      }
      return this
    }

    const nextTurn = this.state.turnNumber + 1

    this.state = {
      ...this.state,
      turnNumber: nextTurn,
      lifeStage: lifeStageForTurn(nextTurn),
      roomPhase: 'lobby',
      sharedScenarioId: null,
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
