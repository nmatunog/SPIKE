import { InMemoryBoardRepository, InMemorySimulationRepository } from '@spike-life/infrastructure'
import {
  BoardCommandBus,
  BoardQueryBus,
  FinancialDecisionCommandBus,
  FinancialDecisionQueryBus,
} from '@spike-life/application'

const SESSION_ID = 'browser-demo'
const BOARD_ID = SESSION_ID

let simulationRepo = new InMemorySimulationRepository()
let boardRepo = new InMemoryBoardRepository()
let financialCommands = new FinancialDecisionCommandBus(simulationRepo)
let financialQueries = new FinancialDecisionQueryBus(simulationRepo)
let boardCommands = new BoardCommandBus(boardRepo, simulationRepo)
let boardQueries = new BoardQueryBus(boardRepo)

export function getSessionId() {
  return SESSION_ID
}

export function getBoardId() {
  return BOARD_ID
}

export async function ensureSessionStarted() {
  await boardCommands.ensureSoloBoard(BOARD_ID, SESSION_ID)
  return SESSION_ID
}

export async function getSpatialBoard() {
  await ensureSessionStarted()
  return boardQueries.getSpatialBoard(BOARD_ID)
}

export async function rollDice() {
  await ensureSessionStarted()
  return boardCommands.rollDice(BOARD_ID)
}

export async function getDashboard() {
  await ensureSessionStarted()
  return financialQueries.getDashboard(SESSION_ID)
}

export async function getLensView(lens) {
  await ensureSessionStarted()
  return financialQueries.getLensView(SESSION_ID, lens)
}

export async function submitDecision(strategy, rationale) {
  await ensureSessionStarted()
  await boardCommands.submitDecision(BOARD_ID, strategy, rationale)
}

export async function submitReflection(answers) {
  await ensureSessionStarted()
  await boardCommands.submitReflection(BOARD_ID, answers)
}

export async function endBoardTurn() {
  await ensureSessionStarted()
  return boardCommands.endTurn(BOARD_ID)
}

/** @deprecated Board loop replaces manual scenario pick */
export async function startScenario(scenarioId) {
  await ensureSessionStarted()
  if (scenarioId === 'protection_stress') {
    await financialCommands.startProtectionStressCycle(SESSION_ID)
  } else {
    await financialCommands.startPromotionCycle(SESSION_ID)
  }
  return SESSION_ID
}

/** @deprecated */
export function getActiveScenario() {
  return null
}

/** @deprecated Use endBoardTurn after reflection */
export async function advanceTurn() {
  await endBoardTurn()
}

export function resetSession() {
  simulationRepo = new InMemorySimulationRepository()
  boardRepo = new InMemoryBoardRepository()
  financialCommands = new FinancialDecisionCommandBus(simulationRepo)
  financialQueries = new FinancialDecisionQueryBus(simulationRepo)
  boardCommands = new BoardCommandBus(boardRepo, simulationRepo)
  boardQueries = new BoardQueryBus(boardRepo)
}
