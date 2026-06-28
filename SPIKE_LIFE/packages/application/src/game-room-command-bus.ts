import type {
  DecisionStrategy,
  GameRoomRepository,
  ReflectionAnswer,
  ScenarioId,
  SimulationRepository,
} from '@spike-life/domain'
import {
  advanceRoomTurn,
  createGameRoom,
  joinGameRoom,
  startRoomTurn,
  submitPlayerDecision,
  submitPlayerReflection,
} from '@spike-life/domain'
import { DEFAULT_CURRENCY } from './content/bootstrap.js'

export class GameRoomCommandBus {
  constructor(
    private readonly gameRoomRepo: GameRoomRepository,
    private readonly simulationRepo: SimulationRepository,
  ) {}

  private deps() {
    return {
      gameRoomRepo: this.gameRoomRepo,
      simulationRepo: this.simulationRepo,
    }
  }

  createRoom(roomId: string, facilitatorId: string) {
    return createGameRoom(this.deps(), roomId, facilitatorId)
  }

  joinRoom(roomId: string, playerId: string, displayName: string) {
    return joinGameRoom(this.deps(), roomId, playerId, displayName, DEFAULT_CURRENCY)
  }

  startTurn(roomId: string, scenarioId: ScenarioId) {
    return startRoomTurn(this.deps(), roomId, scenarioId)
  }

  submitDecision(
    roomId: string,
    playerId: string,
    strategy: DecisionStrategy,
    rationale?: string,
  ) {
    return submitPlayerDecision(this.deps(), roomId, playerId, strategy, rationale)
  }

  submitReflection(roomId: string, playerId: string, answers: ReflectionAnswer[]) {
    return submitPlayerReflection(this.deps(), roomId, playerId, answers)
  }

  advanceTurn(roomId: string) {
    return advanceRoomTurn(this.deps(), roomId)
  }
}
