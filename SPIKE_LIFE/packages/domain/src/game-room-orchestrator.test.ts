import { describe, expect, it } from 'vitest'
import type { GameRoomState } from './aggregates/game-room.js'
import type { SimulationState } from './aggregates/simulation-session.js'
import type { GameRoomRepository } from './ports/game-room-repository.js'
import type { SimulationRepository } from './ports/simulation-repository.js'
import {
  advanceRoomTurn,
  createGameRoom,
  joinGameRoom,
  startRoomCycle,
  submitPlayerDecision,
  submitPlayerReflection,
} from './game-room-orchestrator.js'
import { GAME_ROOM_MAX_PLAYERS } from './types.js'
import { PHILIPPINES_ARCHETYPES, PHILIPPINES_CAMPAIGN } from '@spike-life/content-philippines'
import { configureArchetypes, resetArchetypeConfig } from './services/archetype-context.js'
import { configureCampaign, resetCampaignConfig } from './services/campaign-context.js'
import { configureYearLoop, resetYearLoopConfig } from './gameboard/services/year-loop/year-loop-context.js'
import { PHILIPPINES_YEAR_LOOP } from '@spike-life/content-philippines'
import { TEST_CURRENCY } from './test/currency-fixture.js'
import { bootstrapTestEncounters } from './test/encounter-fixture.js'

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

describe('GameRoom orchestrator — 6 players', () => {
  it('6 players complete one shared macro turn in parallel', async () => {
    configureArchetypes(PHILIPPINES_ARCHETYPES)
    configureCampaign(PHILIPPINES_CAMPAIGN)
    configureYearLoop(PHILIPPINES_YEAR_LOOP)
    bootstrapTestEncounters()
    const deps = makeDeps()
    const roomId = 'workshop-6'

    await createGameRoom(deps, roomId, 'coach-1', {
      sessionMode: 'workshop_compressed',
    })

    for (let i = 1; i <= GAME_ROOM_MAX_PLAYERS; i += 1) {
      await joinGameRoom(deps, roomId, `player-${i}`, `Player ${i}`, TEST_CURRENCY)
    }

    const started = await startRoomCycle(deps, roomId)
    expect(started.slots).toHaveLength(GAME_ROOM_MAX_PLAYERS)
    expect(started.roomPhase).toBe('cycle_active')

    const archetypeIds = started.slots.map((s) => s.archetypeId)
    expect(new Set(archetypeIds).size).toBe(GAME_ROOM_MAX_PLAYERS)

    for (let i = 1; i <= GAME_ROOM_MAX_PLAYERS; i += 1) {
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

    for (let i = 1; i <= GAME_ROOM_MAX_PLAYERS; i += 1) {
      const sim = await deps.simulationRepo.findById(`workshop-6:player-${i}`)
      expect(sim?.turnNumber).toBe(2)
      expect(sim?.phase).toBe('created')
    }

    resetArchetypeConfig()
    resetCampaignConfig()
    resetYearLoopConfig()
  })
})
