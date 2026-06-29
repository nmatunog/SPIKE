import type {
  DecisionStrategy,
  GameRoomRepository,
  ReflectionAnswer,
  SessionMode,
} from '@spike-life/domain'
import type { DecisionTimerPreset } from '@spike-life/content-core'
import {
  advanceRoomTurn,
  configureGameRoomLobby,
  createGameRoom,
  joinGameRoom,
  startRoomPlanningCycle,
  submitPlayerAutoAdvisor,
  submitPlayerCalendarChoice,
  submitPlayerDecision,
  submitPlayerReflection,
  type CreateRoomOptions,
} from '@spike-life/domain'
import { DEFAULT_CURRENCY } from './content/bootstrap.js'

export class GameRoomCommandBus {
  constructor(
    private readonly gameRoomRepo: GameRoomRepository,
    private readonly simulationRepo: import('@spike-life/domain').SimulationRepository,
  ) {}

  private deps() {
    return {
      gameRoomRepo: this.gameRoomRepo,
      simulationRepo: this.simulationRepo,
    }
  }

  createRoom(roomId: string, facilitatorId: string, options?: CreateRoomOptions) {
    return createGameRoom(this.deps(), roomId, facilitatorId, options)
  }

  configureLobby(
    roomId: string,
    options: { sessionMode?: SessionMode; decisionTimerPreset?: DecisionTimerPreset },
  ) {
    return configureGameRoomLobby(this.deps(), roomId, options)
  }

  joinRoom(roomId: string, playerId: string, displayName: string) {
    return joinGameRoom(this.deps(), roomId, playerId, displayName, DEFAULT_CURRENCY)
  }

  startCycle(roomId: string) {
    return startRoomPlanningCycle(this.deps(), roomId)
  }

  /** @deprecated Use startCycle() */
  startTurn(roomId: string, _scenarioId?: string) {
    return startRoomPlanningCycle(this.deps(), roomId)
  }

  submitDecision(
    roomId: string,
    playerId: string,
    strategy: DecisionStrategy,
    rationale?: string,
  ) {
    return submitPlayerDecision(this.deps(), roomId, playerId, strategy, rationale)
  }

  submitAutoAdvisor(roomId: string, playerId: string) {
    return submitPlayerAutoAdvisor(this.deps(), roomId, playerId)
  }

  submitCalendarChoice(roomId: string, playerId: string, allocationId: string) {
    return submitPlayerCalendarChoice(this.deps(), roomId, playerId, allocationId)
  }

  submitReflection(roomId: string, playerId: string, answers: ReflectionAnswer[]) {
    return submitPlayerReflection(this.deps(), roomId, playerId, answers)
  }

  advanceTurn(roomId: string) {
    return advanceRoomTurn(this.deps(), roomId)
  }
}
