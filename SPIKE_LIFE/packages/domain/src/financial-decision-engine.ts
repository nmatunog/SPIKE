import type { SimulationState } from './aggregates/simulation-session.js'
import type { DecisionStrategy, ScenarioId } from './types.js'
import { Simulation } from './aggregates/simulation.js'
import type { ReflectionAnswer } from './services/reflection-engine.js'

export type { SimulationState, SimulationSession } from './aggregates/simulation-session.js'

function loadSimulation(state: SimulationState): Simulation {
  return Simulation.fromState(state)
}

function saveSimulation(simulation: Simulation): SimulationState {
  return simulation.toState()
}

export function createPromotionSession(sessionId: string): SimulationState {
  return Simulation.createPromotion(sessionId).toState()
}

export function createWorkshopSession(sessionId: string): SimulationState {
  return Simulation.createWorkshop(sessionId).toState()
}

export function createProtectionStressSession(sessionId: string): SimulationState {
  return Simulation.createProtectionStress(sessionId).toState()
}

export function presentPromotionSituation(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).presentSituation()
  return saveSimulation(sim)
}

export function presentProtectionStressSituation(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).presentSituation()
  return saveSimulation(sim)
}

export function presentSituation(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).presentSituation()
  return saveSimulation(sim)
}

export function completeDiscovery(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).completeDiscovery()
  return saveSimulation(sim)
}

export function submitDecision(
  session: SimulationState,
  strategy: DecisionStrategy,
  rationale?: string,
): SimulationState {
  const sim = loadSimulation(session).recordDecision(strategy, rationale)
  return saveSimulation(sim)
}

export function submitReflection(
  session: SimulationState,
  answers: ReflectionAnswer[],
): SimulationState {
  const sim = loadSimulation(session).completeReflection(answers)
  return saveSimulation(sim)
}

export function advanceTurn(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).advanceTurn()
  return saveSimulation(sim)
}

/** Pull domain events emitted by the last aggregate operation (in-memory only). */
export function pullEventsFromState(session: SimulationState): {
  state: SimulationState
  events: ReturnType<Simulation['pullDomainEvents']>
} {
  const sim = Simulation.fromState(session)
  const events = sim.pullDomainEvents()
  return { state: sim.toState(), events }
}

export function startPlanningCycle(
  sessionId: string,
  scenarioId: ScenarioId,
  existing?: SimulationState | null,
): SimulationState {
  if (existing?.phase === 'cycle_complete') {
    throw new Error('Advance to the next turn before starting a new scenario.')
  }
  if (existing && existing.phase !== 'created') {
    throw new Error('Finish the current planning cycle before starting a new scenario.')
  }

  let sim: Simulation
  if (!existing) {
    sim = scenarioId === 'protection_stress'
      ? Simulation.createProtectionStress(sessionId)
      : Simulation.createPromotion(sessionId)
  } else {
    sim = loadSimulation(existing).assignScenario(scenarioId)
  }

  return saveSimulation(sim.presentSituation().completeDiscovery())
}

export function runPromotionPlanningCycle(
  sessionId: string,
  strategy: DecisionStrategy,
  reflectionAnswers: ReflectionAnswer[],
): SimulationState {
  let state = startPlanningCycle(sessionId, 'promotion')
  state = submitDecision(state, strategy)
  state = submitReflection(state, reflectionAnswers)
  return state
}

export function runProtectionStressPlanningCycle(
  sessionId: string,
  strategy: DecisionStrategy,
  reflectionAnswers: ReflectionAnswer[],
): SimulationState {
  let state = startPlanningCycle(sessionId, 'protection_stress')
  state = submitDecision(state, strategy)
  state = submitReflection(state, reflectionAnswers)
  return state
}
