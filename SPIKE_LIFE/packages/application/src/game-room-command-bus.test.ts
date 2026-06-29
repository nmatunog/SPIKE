import { describe, expect, it } from 'vitest'
import { GAME_ROOM_MAX_PLAYERS } from '@spike-life/domain'
import {
  InMemoryGameRoomRepository,
  InMemorySimulationRepository,
} from '@spike-life/infrastructure'
import { GameRoomCommandBus } from './game-room-command-bus.js'
import { GameRoomQueryBus } from './game-room-query-bus.js'

const REFLECTION = [
  { promptId: 'a', response: 'Outcome improved savings.' },
  { promptId: 'b', response: 'FNA guided the choice.' },
  { promptId: 'c', response: 'Would protect income earlier.' },
]

describe('GameRoom CQRS — 6 player workshop', () => {
  it('facilitator runs one macro turn with 6 players', async () => {
    const gameRoomRepo = new InMemoryGameRoomRepository()
    const simulationRepo = new InMemorySimulationRepository()
    const commands = new GameRoomCommandBus(gameRoomRepo, simulationRepo)
    const queries = new GameRoomQueryBus(gameRoomRepo, simulationRepo)

    const roomId = 'cqrs-room-6'
    await commands.createRoom(roomId, 'facilitator-1')

    await commands.configureLobby(roomId, { sessionMode: 'workshop_compressed' })

    for (let i = 1; i <= GAME_ROOM_MAX_PLAYERS; i += 1) {
      await commands.joinRoom(roomId, `player-${i}`, `Player ${i}`)
    }

    await commands.startCycle(roomId)

    let board = await queries.getGameBoard(roomId)
    expect(board?.playerCount).toBe(GAME_ROOM_MAX_PLAYERS)
    expect(board?.roomPhase).toBe('cycle_active')
    expect(board?.players.every((p) => p.status === 'planning')).toBe(true)

    for (let i = 1; i <= GAME_ROOM_MAX_PLAYERS; i += 1) {
      await commands.submitDecision(
        roomId,
        `player-${i}`,
        'maintain_lifestyle_discipline',
      )
      await commands.submitReflection(roomId, `player-${i}`, REFLECTION)
    }

    board = await queries.getGameBoard(roomId)
    expect(board?.allPlayersDone).toBe(true)
    expect(board?.canAdvanceTurn).toBe(true)
    expect(board?.completionSummary.done).toBe(GAME_ROOM_MAX_PLAYERS)

    const advanced = await commands.advanceTurn(roomId)
    expect(advanced.turnNumber).toBe(2)

    board = await queries.getGameBoard(roomId)
    expect(board?.turnNumber).toBe(2)
    expect(board?.lifeStage).toBe('build')
    expect(board?.players.every((p) => p.status === 'joined')).toBe(true)
  })
})
