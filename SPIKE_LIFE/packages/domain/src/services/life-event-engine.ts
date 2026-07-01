import type { LifeEventDefinition } from '@spike-life/content-core'
import type { EncounterRecord } from '@spike-life/content-core'
import type { SimulationState } from '../aggregates/simulation-session.js'
import type { EncounterCardId } from '../gameboard/types.js'
import { getEncounterRepository } from '../ports/encounter-repository.js'
import { lifeStageBandForAge } from '../gameboard/services/year-loop/situation-weights.js'
import {
  completedPrerequisiteEvents,
  hasOccurred,
  isOnCooldown,
  occurredWithinCycles,
  appendEventHistory,
  type EventHistoryEntry,
} from './event-history.js'
import {
  deriveLifeFlags,
  employmentCycleCount,
  meetsFlagRequirements,
  meetsLifeStage,
  meetsNumericRequirements,
  applyLifeEventEffects,
  flagEquals,
} from './life-flags.js'
import {
  defaultLifeEventFromEncounter,
  getLifeEventsForDomain,
  isLifeEventEngineEnabled,
  resolveLifeEventDefinition,
} from './life-event-context.js'
import { storyArcWeightMultiplier, resolveActiveStoryArc } from './story-arc-engine.js'
import type { ActiveStoryArc } from './story-arc-engine.js'
import { packIdToCardId } from './pack-encounter-bridge.js'

export type { ActiveStoryArc } from './story-arc-engine.js'
export type { EventHistoryEntry } from './event-history.js'

export interface LifeEventSelectionInput {
  domainId: string
  age: number
  cycleIndex: number
  turnNumber: number
  lifeStage: SimulationState['character']['lifeStage']
  lifeFlags: SimulationState['lifeFlags']
  eventHistory: EventHistoryEntry[]
  activeStoryArc: ActiveStoryArc | null
  financialProfile: SimulationState['financialProfile']
  fnaOverallScore?: number
  halfYear?: SimulationState['halfYear']
}

export interface LifeEventSelectionResult {
  lifeEvent: LifeEventDefinition
  encounter: EncounterRecord
  encounterId: string
}

import { createFreshGraduateBundle } from '../specifications/fresh-graduate.js'

function buildSyntheticState(input: LifeEventSelectionInput): SimulationState {
  const bundle = createFreshGraduateBundle()
  const base = bundle.character
  return {
    id: 'selection',
    scenarioId: 'promotion',
    sessionMode: 'campaign',
    currency: { code: 'PHP', locale: 'en-PH' },
    startingAge: input.age,
    character: {
      ...base,
      age: input.age,
      lifeStage: input.lifeStage,
    },
    financialProfile: input.financialProfile,
    protectionPortfolio: { ...bundle.protectionPortfolio },
    goalPortfolio: { goals: [...bundle.goalPortfolio.goals] },
    phase: 'created',
    situation: null,
    selectedDomainId: input.domainId,
    encounterId: null,
    eventClass: null,
    domainHistory: [],
    advisorPausedUntil: null,
    discovery: null,
    fnaBeforeDecision: null,
    fnaAfterDecision: null,
    recommendations: [],
    decision: null,
    consequence: null,
    reflection: null,
    decisionMonthlyCapacity: 0,
    turnNumber: input.turnNumber,
    cycleIndex: input.cycleIndex,
    halfYear: input.halfYear ?? 'H1',
    simulationYear: 1,
    maxTurns: 20,
    maxCycles: 20,
    dreamBoard: null,
    decisionTimerSeconds: 0,
    cycleDeadlineAt: null,
    pendingCalendarEvent: null,
    thirteenthMonthChoice: null,
    lastAnnualCheckpoint: null,
    annualCheckpoints: [],
    turnHistory: [],
    hiddenLongTermConsequences: [],
    lifeFlags: input.lifeFlags ?? {},
    eventHistory: input.eventHistory ?? [],
    activeStoryArc: input.activeStoryArc ?? null,
    currentLifeEventId: null,
    createdAt: '',
    updatedAt: '',
  }
}

function meetsRequirements(
  event: LifeEventDefinition,
  state: SimulationState,
  flags: ReturnType<typeof deriveLifeFlags>,
): boolean {
  const req = event.requirements
  if (req?.minimumAge != null && state.character.age < req.minimumAge) return false
  if (req?.maximumAge != null && state.character.age > req.maximumAge) return false
  if (!meetsFlagRequirements(flags, req?.flags)) return false
  if (!meetsNumericRequirements(state, flags, req?.numeric)) return false
  if (!meetsLifeStage(state.character.lifeStage, req?.lifeStages ?? event.lifeStages)) return false

  if (event.bypassProgression) return true

  if (req?.minimumTenureCycles != null) {
    const tenure = employmentCycleCount(state.eventHistory)
    if (tenure < req.minimumTenureCycles) return false
  }

  if (req?.completedEvents?.length) {
    if (!completedPrerequisiteEvents(state.eventHistory, req.completedEvents)) return false
  }

  return true
}

function isBlocked(
  event: LifeEventDefinition,
  state: SimulationState,
  flags: ReturnType<typeof deriveLifeFlags>,
): boolean {
  const blockers = event.blockers
  if (!blockers) return false

  if (blockers.flags) {
    for (const [key, value] of Object.entries(blockers.flags)) {
      if (value === undefined) continue
      if (flagEquals(flags[key], value)) return true
    }
  }

  const within = blockers.recentWithinCycles ?? 2
  for (const recentId of blockers.recentEvents ?? []) {
    if (occurredWithinCycles(state.eventHistory, recentId, state.cycleIndex, within)) {
      return true
    }
  }

  return false
}

function passesCooldownAndRepeat(
  event: LifeEventDefinition,
  history: EventHistoryEntry[],
  cycleIndex: number,
): boolean {
  if (!event.repeatable && hasOccurred(history, event.id)) return false
  if (event.cooldown?.cycles) {
    if (isOnCooldown(history, event.id, cycleIndex, event.cooldown.cycles)) return false
  }
  return true
}

function ageBandWeight(event: LifeEventDefinition, age: number): number {
  const band = lifeStageBandForAge(age)
  try {
    const repo = getEncounterRepository()
    const enc = repo.getById(event.encounterId)
    const bands = enc?.weights.bands
    if (bands && bands[band] != null) return bands[band]!
  } catch {
    // content pack not bootstrapped — use neutral multiplier
  }
  return 1
}

function computeEventWeight(
  event: LifeEventDefinition,
  input: LifeEventSelectionInput,
  state: SimulationState,
  flags: ReturnType<typeof deriveLifeFlags>,
): number {
  let weight = event.weight
  weight *= ageBandWeight(event, input.age)
  weight *= storyArcWeightMultiplier(event, input.activeStoryArc)

  if (event.followUpEventIds?.length) {
    const history = input.eventHistory
    const last = history[history.length - 1]
    if (last && event.followUpEventIds.includes(last.lifeEventId)) {
      weight *= 2
    }
  }

  if (event.bypassProgression) {
    weight *= 0.85
  }

  return Math.max(0, weight)
}

function loadCandidatePool(domainId: string): LifeEventDefinition[] {
  if (isLifeEventEngineEnabled()) {
    const domainEvents = getLifeEventsForDomain(domainId)
    if (domainEvents.length > 0) return domainEvents
  }

  try {
    const repo = getEncounterRepository()
    return repo.getByDomain(domainId).map(defaultLifeEventFromEncounter)
  } catch {
    return []
  }
}

function weightedPick(
  candidates: Array<{ event: LifeEventDefinition; weight: number }>,
  rng: () => number,
): LifeEventDefinition | null {
  const eligible = candidates.filter((c) => c.weight > 0)
  if (!eligible.length) return null
  const total = eligible.reduce((sum, c) => sum + c.weight, 0)
  let roll = rng() * total
  for (const candidate of eligible) {
    roll -= candidate.weight
    if (roll <= 0) return candidate.event
  }
  return eligible[eligible.length - 1]!.event
}

export function filterEligibleLifeEvents(
  input: LifeEventSelectionInput,
): LifeEventDefinition[] {
  const state = buildSyntheticState(input)
  const flags = deriveLifeFlags(state)
  const pool = loadCandidatePool(input.domainId)

  return pool.filter((event) => {
    if (!passesCooldownAndRepeat(event, input.eventHistory, input.cycleIndex)) return false
    if (isBlocked(event, state, flags)) return false
    if (!event.bypassProgression && !meetsRequirements(event, state, flags)) return false
    return true
  })
}

export function scoreLifeEventWeights(
  events: LifeEventDefinition[],
  input: LifeEventSelectionInput,
): Array<{ event: LifeEventDefinition; weight: number }> {
  const state = buildSyntheticState(input)
  const flags = deriveLifeFlags(state)
  return events.map((event) => ({
    event,
    weight: computeEventWeight(event, input, state, flags),
  }))
}

export function selectLifeEvent(
  input: LifeEventSelectionInput,
  rng: () => number = Math.random,
): LifeEventSelectionResult | null {
  const eligible = filterEligibleLifeEvents(input)
  if (!eligible.length) return null

  const scored = scoreLifeEventWeights(eligible, input)
  const picked = weightedPick(scored, rng)
  if (!picked) return null

  const repo = getEncounterRepository()
  const encounter = repo.getById(picked.encounterId)
  if (!encounter) return null

  return {
    lifeEvent: picked,
    encounter,
    encounterId: picked.encounterId,
  }
}

export function selectionInputFromSimulation(
  state: SimulationState,
  domainId: string,
): LifeEventSelectionInput {
  const fna = state.fnaAfterDecision ?? state.fnaBeforeDecision
  return {
    domainId,
    age: state.character.age,
    cycleIndex: state.cycleIndex,
    turnNumber: state.turnNumber,
    lifeStage: state.character.lifeStage,
    lifeFlags: state.lifeFlags ?? {},
    eventHistory: state.eventHistory ?? [],
    activeStoryArc: state.activeStoryArc ?? null,
    financialProfile: state.financialProfile,
    fnaOverallScore: fna?.overallScore,
    halfYear: state.halfYear,
  }
}

export function commitLifeEventOutcome(state: SimulationState): SimulationState {
  const lifeEventId = state.currentLifeEventId
  const encounterId = state.encounterId
  if (!lifeEventId || !encounterId) return state

  const definition = resolveLifeEventDefinition(lifeEventId)
    ?? resolveLifeEventDefinition(encounterId)
  if (!definition) return state

  const entry: EventHistoryEntry = {
    lifeEventId: definition.id,
    encounterId,
    cycleIndex: state.cycleIndex,
    turnNumber: state.turnNumber,
    simulationYear: state.simulationYear,
    recordedAt: new Date().toISOString(),
  }

  const flags = applyLifeEventEffects(
    deriveLifeFlags(state),
    definition.effects,
  )

  const activeStoryArc = resolveActiveStoryArc(
    state.activeStoryArc,
    definition,
    state.cycleIndex,
  )

  return {
    ...state,
    lifeFlags: flags,
    eventHistory: appendEventHistory(state.eventHistory ?? [], entry),
    activeStoryArc,
  }
}

/** Map pack encounter selection to board card id when available. */
export function encounterToCardId(encounterId: string): EncounterCardId | null {
  return packIdToCardId(encounterId)
}
