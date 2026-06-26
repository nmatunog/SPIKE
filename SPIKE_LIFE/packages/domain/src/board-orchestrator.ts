import type { DecisionStrategy, ScenarioId } from './types.js'
import type { SimulationState } from './aggregates/simulation-session.js'
import type { BoardState } from './gameboard/types.js'
import type { BoardRepository } from './gameboard/ports/board-repository.js'
import type { SimulationRepository } from './ports/simulation-repository.js'
import type { ReflectionAnswer } from './services/reflection-engine.js'
import { Board } from './gameboard/aggregates/board.js'
import { getEncounterCard } from './gameboard/services/encounter-deck.js'
import {
  advanceTurn,
  createWorkshopSession,
  startPlanningCycle,
  submitDecision,
  submitReflection,
} from './financial-decision-engine.js'

export interface BoardOrchestratorDeps {
  boardRepo: BoardRepository
  simulationRepo: SimulationRepository
}

export interface RollBoardResult {
  board: BoardState
  scenarioId: ScenarioId
  encounterTitle: string
  events: ReturnType<Board['pullGameboardEvents']>
}

export async function createSoloBoard(
  deps: BoardOrchestratorDeps,
  boardId: string,
  simulationId: string,
  displayName: string = 'You',
): Promise<BoardState> {
  const existing = await deps.boardRepo.findById(boardId)
  if (existing) return existing

  const workshop = createWorkshopSession(simulationId)
  await deps.simulationRepo.save(workshop)

  const board = Board.create(boardId, simulationId, [
    { playerId: 'solo', displayName },
  ])
  await deps.boardRepo.save(board.toState())
  return board.toState()
}

export async function rollBoardAndTriggerSituation(
  deps: BoardOrchestratorDeps,
  boardId: string,
): Promise<RollBoardResult> {
  const existing = await deps.boardRepo.findById(boardId)
  if (!existing) throw new Error(`Board not found: ${boardId}`)

  let board = Board.fromState(existing)
  board = board.rollAndMove()
  board = board.enterDecisionPhase()

  const encounterId = board.pendingEncounter()
  if (!encounterId) throw new Error('Board did not produce an encounter.')

  const encounter = getEncounterCard(encounterId)
  const sim = await deps.simulationRepo.findById(existing.simulationId)
  const started = startPlanningCycle(existing.simulationId, encounter.scenarioId, sim)
  await deps.simulationRepo.save(started)

  const events = board.pullGameboardEvents()
  const state = board.toState()
  await deps.boardRepo.save(state)

  return {
    board: state,
    scenarioId: encounter.scenarioId,
    encounterTitle: encounter.title,
    events,
  }
}

export async function submitBoardDecision(
  deps: BoardOrchestratorDeps,
  boardId: string,
  strategy: DecisionStrategy,
  rationale?: string,
): Promise<SimulationState> {
  const boardState = await deps.boardRepo.findById(boardId)
  if (!boardState) throw new Error(`Board not found: ${boardId}`)

  if (boardState.phase !== 'decision_phase') {
    throw new Error('Roll the dice and land on a space before deciding.')
  }

  const sim = await deps.simulationRepo.findById(boardState.simulationId)
  if (!sim) throw new Error(`Simulation not found: ${boardState.simulationId}`)

  const updated = submitDecision(sim, strategy, rationale)
  await deps.simulationRepo.save(updated)

  let board = Board.fromState(boardState).markDecisionSubmitted()
  board.pullGameboardEvents()
  await deps.boardRepo.save(board.toState())

  return updated
}

export async function submitBoardReflection(
  deps: BoardOrchestratorDeps,
  boardId: string,
  answers: ReflectionAnswer[],
): Promise<{ board: BoardState; simulation: SimulationState }> {
  const boardState = await deps.boardRepo.findById(boardId)
  if (!boardState) throw new Error(`Board not found: ${boardId}`)

  const sim = await deps.simulationRepo.findById(boardState.simulationId)
  if (!sim) throw new Error(`Simulation not found: ${boardState.simulationId}`)

  const updated = submitReflection(sim, answers)
  await deps.simulationRepo.save(updated)

  let board = Board.fromState(boardState).markReflectionCompleted()
  board.pullGameboardEvents()
  const afterReflection = board.toState()
  await deps.boardRepo.save(afterReflection)

  return { board: afterReflection, simulation: updated }
}

export async function endBoardTurn(
  deps: BoardOrchestratorDeps,
  boardId: string,
): Promise<BoardState> {
  const boardState = await deps.boardRepo.findById(boardId)
  if (!boardState) throw new Error(`Board not found: ${boardId}`)

  let board = Board.fromState(boardState).endTurn()
  const events = board.pullGameboardEvents()
  const roundCompleted = events.some((e) => e.type === 'RoundCompleted')

  if (roundCompleted) {
    const sim = await deps.simulationRepo.findById(boardState.simulationId)
    if (sim) {
      const advanced = advanceTurn(sim)
      await deps.simulationRepo.save(advanced)
    }
  }

  const state = board.toState()
  await deps.boardRepo.save(state)
  return state
}

export async function getBoardState(
  deps: BoardOrchestratorDeps,
  boardId: string,
): Promise<BoardState | null> {
  return deps.boardRepo.findById(boardId)
}
