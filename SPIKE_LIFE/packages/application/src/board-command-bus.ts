import type {
  BoardPhase,
  BoardRepository,
  BoardState,
  DecisionStrategy,
  EncounterCardId,
  ReflectionAnswer,
  SimulationRepository,
  SimulationState,
  SpaceType,
} from '@spike-life/domain'
import {
  createSoloBoard,
  endBoardTurn,
  rollBoardAndTriggerSituation,
  submitBoardDecision,
  submitBoardReflection,
} from '@spike-life/domain'

export interface RollDiceResult {
  boardId: string
  scenarioId: string
  encounterTitle: string
  phase: BoardPhase
}

export class BoardCommandBus {
  constructor(
    private readonly boardRepo: BoardRepository,
    private readonly simulationRepo: SimulationRepository,
  ) {}

  private deps() {
    return { boardRepo: this.boardRepo, simulationRepo: this.simulationRepo }
  }

  async ensureSoloBoard(
    boardId: string,
    simulationId: string,
    displayName?: string,
  ): Promise<BoardState> {
    return createSoloBoard(this.deps(), boardId, simulationId, displayName)
  }

  async rollDice(boardId: string): Promise<RollDiceResult> {
    const result = await rollBoardAndTriggerSituation(this.deps(), boardId)
    return {
      boardId,
      scenarioId: result.scenarioId,
      encounterTitle: result.encounterTitle,
      phase: result.board.phase,
    }
  }

  async submitDecision(
    boardId: string,
    strategy: DecisionStrategy,
    rationale?: string,
  ): Promise<SimulationState> {
    return submitBoardDecision(this.deps(), boardId, strategy, rationale)
  }

  async submitReflection(
    boardId: string,
    answers: ReflectionAnswer[],
  ): Promise<SimulationState> {
    const { simulation } = await submitBoardReflection(this.deps(), boardId, answers)
    return simulation
  }

  async endTurn(boardId: string): Promise<BoardState> {
    return endBoardTurn(this.deps(), boardId)
  }
}
