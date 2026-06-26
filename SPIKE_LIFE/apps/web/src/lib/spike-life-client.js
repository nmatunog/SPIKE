import { InMemorySimulationRepository } from '@spike-life/infrastructure'
import {
  FinancialDecisionCommandBus,
  FinancialDecisionQueryBus,
} from '@spike-life/application'

const SESSION_ID = 'browser-demo'

let repository = new InMemorySimulationRepository()
let commandBus = new FinancialDecisionCommandBus(repository)
let queryBus = new FinancialDecisionQueryBus(repository)
let initialized = false

export function getSessionId() {
  return SESSION_ID
}

export async function ensureSessionStarted() {
  if (initialized) return SESSION_ID
  await commandBus.startPromotionCycle(SESSION_ID)
  initialized = true
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
  await commandBus.submitPromotionDecision(SESSION_ID, strategy, rationale)
}

export async function submitReflection(answers) {
  await ensureSessionStarted()
  await commandBus.submitPromotionReflection(SESSION_ID, answers)
}

/** Reset for development hot reload */
export function resetSession() {
  repository = new InMemorySimulationRepository()
  commandBus = new FinancialDecisionCommandBus(repository)
  queryBus = new FinancialDecisionQueryBus(repository)
  initialized = false
}
