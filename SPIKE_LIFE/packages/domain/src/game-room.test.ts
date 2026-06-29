import { describe, expect, it } from 'vitest'
import {
  GameRoom,
  GAME_ROOM_MAX_PLAYERS,
  simulationIdForPlayer,
} from './index.js'

const ARCHETYPE_IDS = [
  'fresh_graduate',
  'bpo_professional',
  'young_professional',
  'freelancer',
  'young_entrepreneur',
  'ofw_breadwinner',
] as const

const CODE = 'TEST01'

function joinSlot(
  room: GameRoom,
  playerId: string,
  displayName: string,
  roomId: string,
  slotIndex: number,
): GameRoom {
  return room.join(
    playerId,
    displayName,
    simulationIdForPlayer(roomId, playerId),
    ARCHETYPE_IDS[slotIndex % ARCHETYPE_IDS.length]!,
  )
}

describe('GameRoom aggregate', () => {
  it('creates a lobby room for up to 6 players', () => {
    const room = GameRoom.create('room-1', 'facilitator-1', CODE)

    expect(room.toState().maxPlayers).toBe(GAME_ROOM_MAX_PLAYERS)
    expect(room.toState().roomPhase).toBe('lobby')
    expect(room.toState().turnNumber).toBe(1)
    expect(room.toState().joinOpen).toBe(true)
    expect(room.toState().sessionMode).toBe('campaign')
    expect(room.toState().gameCode).toBe(CODE)
  })

  it('joins players into numbered slots with token colors', () => {
    let room = GameRoom.create('room-2', 'fac-1', CODE)

    for (let i = 1; i <= GAME_ROOM_MAX_PLAYERS; i += 1) {
      room = joinSlot(room, `player-${i}`, `Player ${i}`, 'room-2', i - 1)
    }

    const state = room.toState()
    expect(state.slots).toHaveLength(GAME_ROOM_MAX_PLAYERS)
    expect(state.slots[0]?.tokenColor).toBeTruthy()
    expect(state.slots[GAME_ROOM_MAX_PLAYERS - 1]?.slotIndex).toBe(GAME_ROOM_MAX_PLAYERS - 1)
  })

  it('rejects join when room is full', () => {
    let room = GameRoom.create('room-3', 'fac-1', CODE)
    for (let i = 1; i <= GAME_ROOM_MAX_PLAYERS; i += 1) {
      room = joinSlot(room, `p${i}`, `P${i}`, 'room-3', i - 1)
    }

    expect(() =>
      joinSlot(room, 'p7', 'P7', 'room-3', 0),
    ).toThrow(/full/)
  })

  it('requires at least two players to start a cycle', () => {
    let room = GameRoom.create('room-min', 'fac-1', CODE)
    room = joinSlot(room, 'a', 'Alex', 'room-min', 0)

    expect(() => room.startCycle()).toThrow(/At least 2 players/)
  })

  it('starts a shared cycle for all joined players', () => {
    let room = GameRoom.create('room-4', 'fac-1', CODE)
    room = joinSlot(room, 'a', 'Alex', 'room-4', 0)
    room = joinSlot(room, 'b', 'Maria', 'room-4', 1)

    room = room.startCycle()

    const state = room.toState()
    expect(state.roomPhase).toBe('cycle_active')
    expect(state.cycleDeadlineAt).toBeTruthy()
    expect(state.joinOpen).toBe(false)
    expect(state.slots.every((s) => s.status === 'planning')).toBe(true)
  })

  it('tracks slot status from simulation phases', () => {
    let room = GameRoom.create('room-5', 'fac-1', CODE)
    room = joinSlot(room, 'a', 'Alex', 'room-5', 0)
    room = joinSlot(room, 'b', 'Maria', 'room-5', 1)
    room = room.startCycle()

    room = room.syncSlotFromSimulationPhase('a', 'decision_pending')
    expect(room.getSlot('a')?.status).toBe('planning')

    room = room.syncSlotFromSimulationPhase('a', 'consequences_applied')
    expect(room.getSlot('a')?.status).toBe('decided')

    room = room.syncSlotFromSimulationPhase('a', 'cycle_complete')
    expect(room.getSlot('a')?.status).toBe('done')
    expect(room.canAdvanceTurn()).toBe(false)
  })

  it('advances room turn when all players are done', () => {
    let room = GameRoom.create('room-6', 'fac-1', CODE, {
      sessionMode: 'workshop_compressed',
    })
    room = joinSlot(room, 'a', 'Alex', 'room-6', 0)
    room = joinSlot(room, 'b', 'Maria', 'room-6', 1)
    room = room.startCycle()
    room = room.syncSlotFromSimulationPhase('a', 'cycle_complete')
    room = room.syncSlotFromSimulationPhase('b', 'cycle_complete')

    room = room.advanceTurn()

    const state = room.toState()
    expect(state.turnNumber).toBe(2)
    expect(state.lifeStage).toBe('build')
    expect(state.roomPhase).toBe('lobby')
    expect(state.slots[0]?.status).toBe('joined')
    expect(state.cycleDeadlineAt).toBeNull()
  })

  it('marks session complete after final turn', () => {
    let room = GameRoom.create('room-7', 'fac-1', CODE, {
      sessionMode: 'workshop_compressed',
    })
    room = joinSlot(room, 'a', 'Alex', 'room-7', 0)
    room = joinSlot(room, 'b', 'Maria', 'room-7', 1)

    const atFinal = {
      ...room.toState(),
      turnNumber: 5,
      maxTurns: 5,
      lifeStage: 'legacy' as const,
      roomPhase: 'cycle_active' as const,
      slots: room.toState().slots.map((s) => ({ ...s, status: 'done' as const })),
    }

    room = GameRoom.fromState(atFinal).advanceTurn()
    expect(room.toState().roomPhase).toBe('session_complete')
  })

  it('configures lobby session mode and timer', () => {
    const room = GameRoom.create('room-8', 'fac-1', CODE)
      .configureLobby({ sessionMode: 'workshop_compressed', decisionTimerPreset: '10' })
    expect(room.toState().sessionMode).toBe('workshop_compressed')
    expect(room.toState().maxTurns).toBe(5)
    expect(room.toState().decisionTimerPreset).toBe('10')
  })
})
