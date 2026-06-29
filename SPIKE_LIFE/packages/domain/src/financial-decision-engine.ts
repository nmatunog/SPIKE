import type { CurrencyConfig } from '@spike-life/content-core'
import type { SimulationState } from './aggregates/simulation-session.js'
import type { EncounterCardId } from './gameboard/types.js'
import type { DecisionStrategy, ScenarioId } from './types.js'
import { Simulation } from './aggregates/simulation.js'
import type { ReflectionAnswer } from './services/reflection-engine.js'
import { revealDueHiddenConsequences } from './services/long-term-consequence-engine.js'
import { selectCycleEncounter } from './services/situation-resolver.js'
import { packEncounterRecord } from './services/pack-encounter-bridge.js'

import type { DreamBoardGoalChoice } from './services/dream-board.js'

export type { SimulationState, SimulationSession } from './aggregates/simulation-session.js'

/** Board-selected domain + encounter — keeps simulation aligned with year-loop engine. */
export interface BoardCycleBinding {
  domainId: string
  encounterCardId: EncounterCardId
  completedEncounterCardIds?: EncounterCardId[]
}

function loadSimulation(state: SimulationState): Simulation {
  return Simulation.fromState(state)
}

function saveSimulation(simulation: Simulation): SimulationState {
  return simulation.toState()
}

export function createPromotionSession(
  sessionId: string,
  currency: CurrencyConfig,
): SimulationState {
  return Simulation.createPromotion(sessionId, currency).toState()
}

export function createCampaignSession(
  sessionId: string,
  currency: CurrencyConfig,
  archetypeId?: string,
): SimulationState {
  return Simulation.createCampaign(sessionId, currency, archetypeId).toState()
}

export function createWorkshopSession(
  sessionId: string,
  currency: CurrencyConfig,
  archetypeId?: string,
  sessionMode: import('./types.js').SessionMode = 'workshop_compressed',
): SimulationState {
  return Simulation.createWorkshop(sessionId, currency, archetypeId, sessionMode).toState()
}

export function createProtectionStressSession(
  sessionId: string,
  currency: CurrencyConfig,
): SimulationState {
  return Simulation.createProtectionStress(sessionId, currency).toState()
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

export function finalizeCycleAfterDecision(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).finalizeCycleAfterDecision()
  return saveSimulation(sim)
}

export function advanceTurn(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).advanceTurn()
  return saveSimulation(sim)
}

/** Reveal hidden long-term consequences when the simulation year advances (A5). */
export function applyYearEndHiddenReveal(
  session: SimulationState,
  year: number,
): SimulationState {
  const existing = session.hiddenLongTermConsequences ?? []
  const { updated } = revealDueHiddenConsequences(existing, year)
  return {
    ...session,
    hiddenLongTermConsequences: updated,
    simulationYear: year,
    updatedAt: new Date().toISOString(),
  }
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

export function setDreamBoard(
  session: SimulationState,
  choices: DreamBoardGoalChoice[],
): SimulationState {
  const sim = loadSimulation(session).setDreamBoard(choices)
  return saveSimulation(sim)
}

export function resolveThirteenthMonthPay(
  session: SimulationState,
  allocationId: string,
): SimulationState {
  const sim = loadSimulation(session).resolveThirteenthMonth(allocationId)
  return saveSimulation(sim)
}

export function dismissCalendarEvent(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).dismissCalendarEvent()
  return saveSimulation(sim)
}

export function applyAutoAdvisorDecision(session: SimulationState): SimulationState {
  const sim = loadSimulation(session).applyAutoAdvisorDecision()
  return saveSimulation(sim)
}

export function startPlanningCycle(
  sessionId: string,
  scenarioId: ScenarioId,
  existing?: SimulationState | null,
  currency?: CurrencyConfig,
  boardBinding?: BoardCycleBinding,
): SimulationState {
  return startRoomCycle(sessionId, existing, null, scenarioId, currency, boardBinding)
}

export function startRoomCycle(
  sessionId: string,
  existing?: SimulationState | null,
  cycleDeadlineAt?: string | null,
  forcedScenarioId?: ScenarioId,
  currency?: CurrencyConfig,
  boardBinding?: BoardCycleBinding,
): SimulationState {
  const resolvedCurrency = existing?.currency ?? currency
  if (!resolvedCurrency) {
    throw new Error('Currency is required when creating a new simulation session.')
  }

  if (existing?.phase === 'cycle_complete') {
    throw new Error('Advance to the next turn before starting a new scenario.')
  }
  if (existing && !existing.dreamBoard?.completedAt) {
    throw new Error('Complete your Life Blueprint before starting a planning cycle.')
  }
  if (existing && existing.pendingCalendarEvent) {
    throw new Error('Resolve the pending calendar event before starting a new cycle.')
  }
  if (existing && existing.phase !== 'created') {
    throw new Error('Finish the current planning cycle before starting a new scenario.')
  }

  let selectionScenario: ScenarioId = forcedScenarioId ?? 'promotion'
  let domainId: string | null = null
  let encounterId: string | null = null

  if (boardBinding) {
    const packEncounter = packEncounterRecord(
      boardBinding.domainId,
      boardBinding.encounterCardId,
    )
    domainId = boardBinding.domainId
    encounterId = packEncounter?.id ?? null
    selectionScenario = forcedScenarioId
      ?? (packEncounter?.scenarioTemplate === 'protection_stress'
        ? 'protection_stress'
        : 'promotion')
  } else if (existing) {
    try {
      const picked = selectCycleEncounter(existing)
      selectionScenario = forcedScenarioId ?? picked.scenarioId
      domainId = picked.domainId
      encounterId = picked.encounterId
    } catch {
      selectionScenario = forcedScenarioId ?? existing.scenarioId
    }
  }

  let sim: Simulation
  if (!existing) {
    sim = selectionScenario === 'protection_stress'
      ? Simulation.createProtectionStress(sessionId, resolvedCurrency)
      : Simulation.createPromotion(sessionId, resolvedCurrency)
  } else {
    sim = loadSimulation(existing).assignScenario(selectionScenario)
    if (domainId && encounterId) {
      const state = sim.toState()
      sim = Simulation.fromState({
        ...state,
        selectedDomainId: domainId,
        encounterId,
        domainHistory: [...(state.domainHistory ?? []), domainId].slice(-6),
      })
    }
  }

  const withSituation = sim.presentSituation().completeDiscovery()
  const state = withSituation.toState()
  return {
    ...state,
    cycleDeadlineAt: cycleDeadlineAt ?? state.cycleDeadlineAt,
  }
}

export function runPromotionPlanningCycle(
  sessionId: string,
  strategy: DecisionStrategy,
  reflectionAnswers: ReflectionAnswer[],
  currency: CurrencyConfig,
): SimulationState {
  let state = startPlanningCycle(sessionId, 'promotion', undefined, currency)
  state = submitDecision(state, strategy)
  state = submitReflection(state, reflectionAnswers)
  return state
}

export function runProtectionStressPlanningCycle(
  sessionId: string,
  strategy: DecisionStrategy,
  reflectionAnswers: ReflectionAnswer[],
  currency: CurrencyConfig,
): SimulationState {
  let state = startPlanningCycle(sessionId, 'protection_stress', undefined, currency)
  state = submitDecision(state, strategy)
  state = submitReflection(state, reflectionAnswers)
  return state
}
