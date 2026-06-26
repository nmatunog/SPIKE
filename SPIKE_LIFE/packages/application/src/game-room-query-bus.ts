import type { GameRoomRepository, SimulationRepository } from '@spike-life/domain'
import type { GameBoardView } from './queries/game-room-read-models.js'
import { projectGameBoard } from './queries/game-room-projections.js'

export class GameRoomQueryBus {
  constructor(
    private readonly gameRoomRepo: GameRoomRepository,
    private readonly simulationRepo: SimulationRepository,
  ) {}

  async getGameBoard(roomId: string): Promise<GameBoardView | null> {
    const room = await this.gameRoomRepo.findById(roomId)
    if (!room) return null

    const simulations = new Map<string, Awaited<ReturnType<SimulationRepository['findById']>>>()
    for (const slot of room.slots) {
      const sim = await this.simulationRepo.findById(slot.simulationId)
      if (sim) simulations.set(slot.simulationId, sim)
    }

    return projectGameBoard(
      room,
      simulations as Map<string, NonNullable<Awaited<ReturnType<SimulationRepository['findById']>>>>,
    )
  }
}
