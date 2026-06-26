import { describe, expect, it } from 'vitest'
import type { GameRoomState } from './aggregates/game-room.js'
import type { SimulationState } from './aggregates/simulation-session.js'
import type { GameRoomRepository } from './ports/game-room-repository.js'
import type { SimulationRepository } from './ports/simulation-repository.js'
import {
  advanceRoomTurn,
  createGameRoom,
  joinGameRoom,
  startRoomTurn,
  submitPlayerDecision,
  submitPlayerReflection,
} from './game-room-orchestrator.js'

const REFLECTION = [
  { promptId: 'a', response: 'Learned to prioritize FNA.' },
  { promptId: 'b', response: 'Protection gaps matter.' },
  { promptId: 'c', response: 'Would decide sooner.' },
]

class MemorySimulationRepo implements SimulationRepository {
  private store = new Map<string, SimulationState>()

  async save(session: SimulationState): Promise<void> {
    this.store.set(session.id, structuredClone(session))
  }

  async findById(id: string): Promise<SimulationState | null> {
    const s = this.store.get(id)
    return s ? structuredClone(s) : null
  }
}

class MemoryGameRoomRepo implements GameRoomRepository {
  private store = new Map<string, GameRoomState>()

  async save(room: GameRoomState): Promise<void> {
    this.store.set(room.id, structuredClone(room))
  }

  async findById(id: string): Promise<GameRoomState | null> {
    const r = this.store.get(id)
    return r ? structuredClone(r) : null
  }
}

function makeDeps() {
  return {
    gameRoomRepo: new MemoryGameRoomRepo(),
    simulationRepo: new MemorySimulationRepo(),
  }
}

describe('GameRoom orchestrator — 10 players', () => {
  it('10 players complete one shared macro turn in parallel', async () => {
    const deps = makeDeps()
    const roomId = 'workshop-10'

    await createGameRoom(deps, roomId, 'coach-1')

    for (let i = 1; i <= 10; i += 1) {
      await joinGameRoom(deps, roomId, `player-${i}`, `Intern ${i}`)
    }

    const started = await startRoomTurn(deps, roomId, 'promotion')
    expect(started.slots).toHaveLength(10)
    expect(started.roomPhase).toBe('turn_active')

    for (let i = 1; i <= 10; i += 1) {
      await submitPlayerDecision(
        deps,
        roomId,
        `player-${i}`,
        'maintain_lifestyle_discipline',
      )
      await submitPlayerReflection(deps, roomId, `player-${i}`, REFLECTION)
    }

    const room = await advanceRoomTurn(deps, roomId)

    expect(room.slots.every((s) => s.status === 'joined')).toBe(true)
    expect(room.turnNumber).toBe(2)
    expect(room.roomPhase).toBe('lobby')

    for (let i = 1; i <= 10; i += 1) {
      const sim = await deps.simulationRepo.findById(`workshop-10:player-${i}`)
      expect(sim?.turnNumber).toBe(2)
      expect(sim?.phase).toBe('created')
    }
  })
})
