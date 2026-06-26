import { describe, expect, it } from 'vitest'
import {
  GameRoom,
  GAME_ROOM_MAX_PLAYERS,
  simulationIdForPlayer,
} from './index.js'

describe('GameRoom aggregate', () => {
  it('creates a lobby room for up to 10 players', () => {
    const room = GameRoom.create('room-1', 'facilitator-1')

    expect(room.toState().maxPlayers).toBe(GAME_ROOM_MAX_PLAYERS)
    expect(room.toState().roomPhase).toBe('lobby')
    expect(room.toState().turnNumber).toBe(1)
    expect(room.toState().joinOpen).toBe(true)
  })

  it('joins players into numbered slots with token colors', () => {
    let room = GameRoom.create('room-2', 'fac-1')

    for (let i = 1; i <= 10; i += 1) {
      const simId = simulationIdForPlayer('room-2', `player-${i}`)
      room = room.join(`player-${i}`, `Player ${i}`, simId)
    }

    const state = room.toState()
    expect(state.slots).toHaveLength(10)
    expect(state.slots[0]?.tokenColor).toBeTruthy()
    expect(state.slots[9]?.slotIndex).toBe(9)
  })

  it('rejects join when room is full', () => {
    let room = GameRoom.create('room-3', 'fac-1')
    for (let i = 1; i <= 10; i += 1) {
      room = room.join(`p${i}`, `P${i}`, simulationIdForPlayer('room-3', `p${i}`))
    }

    expect(() =>
      room.join('p11', 'P11', simulationIdForPlayer('room-3', 'p11')),
    ).toThrow(/full/)
  })

  it('starts a shared turn for all joined players', () => {
    let room = GameRoom.create('room-4', 'fac-1')
    room = room.join('a', 'Alex', simulationIdForPlayer('room-4', 'a'))
    room = room.join('b', 'Maria', simulationIdForPlayer('room-4', 'b'))

    room = room.startTurn('promotion')

    const state = room.toState()
    expect(state.roomPhase).toBe('turn_active')
    expect(state.sharedScenarioId).toBe('promotion')
    expect(state.joinOpen).toBe(false)
    expect(state.slots.every((s) => s.status === 'planning')).toBe(true)
  })

  it('tracks slot status from simulation phases', () => {
    let room = GameRoom.create('room-5', 'fac-1')
    room = room.join('a', 'Alex', simulationIdForPlayer('room-5', 'a'))
    room = room.startTurn('promotion')

    room = room.syncSlotFromSimulationPhase('a', 'decision_pending')
    expect(room.getSlot('a')?.status).toBe('planning')

    room = room.syncSlotFromSimulationPhase('a', 'consequences_applied')
    expect(room.getSlot('a')?.status).toBe('decided')

    room = room.syncSlotFromSimulationPhase('a', 'cycle_complete')
    expect(room.getSlot('a')?.status).toBe('done')
    expect(room.canAdvanceTurn()).toBe(true)
  })

  it('advances room turn when all players are done', () => {
    let room = GameRoom.create('room-6', 'fac-1')
    room = room.join('a', 'Alex', simulationIdForPlayer('room-6', 'a'))
    room = room.startTurn('promotion')
    room = room.syncSlotFromSimulationPhase('a', 'cycle_complete')

    room = room.advanceTurn()

    const state = room.toState()
    expect(state.turnNumber).toBe(2)
    expect(state.lifeStage).toBe('build')
    expect(state.roomPhase).toBe('lobby')
    expect(state.slots[0]?.status).toBe('joined')
    expect(state.sharedScenarioId).toBeNull()
  })
})

describe('GameRoom — 10 player macro turn', () => {
  const REFLECTION = [
    { promptId: 'a', response: 'Learned to prioritize FNA.' },
    { promptId: 'b', response: 'Protection gaps matter.' },
    { promptId: 'c', response: 'Would decide sooner.' },
  ]

  it('10 players complete one shared macro turn in parallel', () => {
    const {
      createGameRoom,
      joinGameRoom,
      startRoomTurn,
      submitPlayerDecision,
      submitPlayerReflection,
      advanceRoomTurn,
    } = requireGameRoomOrchestrator()

    const roomId = 'workshop-10'
    createGameRoom(roomId, 'coach-1')

    for (let i = 1; i <= 10; i += 1) {
      joinGameRoom(roomId, `player-${i}`, `Intern ${i}`)
    }

    startRoomTurn(roomId, 'promotion')

    for (let i = 1; i <= 10; i += 1) {
      submitPlayerDecision(roomId, `player-${i}`, 'maintain_lifestyle_discipline')
      submitPlayerReflection(roomId, `player-${i}`, REFLECTION)
    }

    const room = advanceRoomTurn(roomId)

    expect(room.slots).toHaveLength(10)
    expect(room.slots.every((s) => s.status === 'joined')).toBe(true)
    expect(room.turnNumber).toBe(2)
    expect(room.roomPhase).toBe('lobby')
  })
})

/** In-memory orchestrator for domain integration tests (no application layer). */
function requireGameRoomOrchestrator() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./game-room-orchestrator.js') as typeof import('./game-room-orchestrator.js')
}
