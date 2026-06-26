import { InMemorySimulationRepository } from '@spike-life/infrastructure'
import {
  FinancialDecisionCommandBus,
  FinancialDecisionQueryBus,
} from '@spike-life/application'

const SESSION_ID = 'browser-demo'

let repository = new InMemorySimulationRepository()
let commandBus = new FinancialDecisionCommandBus(repository)
let queryBus = new FinancialDecisionQueryBus(repository)
let activeScenario = null

export function getSessionId() {
  return SESSION_ID
}

export function getActiveScenario() {
  return activeScenario
}

export async function startScenario(scenarioId) {
  repository = new InMemorySimulationRepository()
  commandBus = new FinancialDecisionCommandBus(repository)
  queryBus = new FinancialDecisionQueryBus(repository)
  activeScenario = scenarioId

  if (scenarioId === 'protection_stress') {
    await commandBus.startProtectionStressCycle(SESSION_ID)
  } else {
    await commandBus.startPromotionCycle(SESSION_ID)
  }
  return SESSION_ID
}

export async function ensureSessionStarted() {
  if (activeScenario) return SESSION_ID
  await startScenario('promotion')
  return SESSION_ID
}

export async function getDashboard() {
  await ensureSessionStarted()
  return queryBus.getDashboard(SESSION_ID)
}

export async function getLensView(lens) {
  await ensureSessionStarted()
  return queryBus.getLensView(SESSION_ID, lens)
}

export async function submitDecision(strategy, rationale) {
  await ensureSessionStarted()
  await commandBus.submitDecision(SESSION_ID, strategy, rationale)
}

export async function submitReflection(answers) {
  await ensureSessionStarted()
  await commandBus.submitReflection(SESSION_ID, answers)
}

export function resetSession() {
  repository = new InMemorySimulationRepository()
  commandBus = new FinancialDecisionCommandBus(repository)
  queryBus = new FinancialDecisionQueryBus(repository)
  activeScenario = null
}
