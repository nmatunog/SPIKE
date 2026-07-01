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

async function completeLifeBlueprint(
  commands: GameRoomCommandBus,
  queries: GameRoomQueryBus,
  simulationRepo: InMemorySimulationRepository,
  roomId: string,
  playerId: string,
) {
  const board = await queries.getGameBoard(roomId)
  const player = board?.players.find((p) => p.playerId === playerId)
  if (!player) throw new Error(`Player not found: ${playerId}`)
  const sim = await simulationRepo.findById(player.simulationId)
  if (!sim?.dreamBoard?.goals?.length) {
    throw new Error(`No dream board goals for ${playerId}`)
  }
  await commands.submitDreamBoard(roomId, playerId, sim.dreamBoard.goals)
}

describe('GameRoom CQRS — peer multiplayer', () => {
  it('any player can run one macro turn with 6 players after setup', async () => {
    const gameRoomRepo = new InMemoryGameRoomRepository()
    const simulationRepo = new InMemorySimulationRepository()
    const commands = new GameRoomCommandBus(gameRoomRepo, simulationRepo)
    const queries = new GameRoomQueryBus(gameRoomRepo, simulationRepo)

    const roomId = 'cqrs-room-6'
    await commands.createRoom(roomId)

    await commands.configureLobby(roomId, { sessionMode: 'workshop_compressed' })

    for (let i = 1; i <= GAME_ROOM_MAX_PLAYERS; i += 1) {
      await commands.joinRoom(roomId, `player-${i}`, `Player ${i}`)
      await completeLifeBlueprint(commands, queries, simulationRepo, roomId, `player-${i}`)
    }

    let board = await queries.getGameBoard(roomId)
    expect(board?.canStartCycle).toBe(true)
    expect(board?.roomPhase).toBe('setup')

    await commands.startCycle(roomId)

    board = await queries.getGameBoard(roomId)
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
    expect(board?.players.every((p) => p.status === 'ready')).toBe(true)
  })
})
