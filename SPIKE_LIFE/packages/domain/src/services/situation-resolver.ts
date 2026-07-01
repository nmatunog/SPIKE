import type { SimulationState } from '../aggregates/simulation-session.js'
import type { ScenarioId } from '../types.js'
import type { EncounterRecord } from '@spike-life/content-core'
import { getEncounterRepository } from '../ports/encounter-repository.js'
import { selectWeightedLifeDomain } from '../gameboard/services/year-loop/domain-weights.js'
import type { EncounterCardId } from '../gameboard/types.js'
import {
  isLifeEventEngineEnabled,
  resolveLifeEventDefinition,
} from './life-event-context.js'
import {
  selectLifeEvent,
  selectionInputFromSimulation,
} from './life-event-engine.js'

export interface CycleStartSelection {
  domainId: string
  encounterId: string
  encounter: EncounterRecord
  scenarioId: ScenarioId
  lifeEventId: string | null
}

function weightedPickLegacy(encounters: EncounterRecord[], seed: number): EncounterRecord {
  const total = encounters.reduce((sum, e) => sum + (e.weights.base ?? 1), 0)
  let roll = seed % Math.max(total, 1)
  for (const enc of encounters) {
    roll -= enc.weights.base ?? 1
    if (roll < 0) return enc
  }
  return encounters[encounters.length - 1]!
}

export function selectCycleEncounter(
  state: SimulationState,
  _completedEncounterCardIds: EncounterCardId[] = [],
): CycleStartSelection {
  const seed = state.turnNumber * 997 + state.cycleIndex * 131
  const rng = () => (seed % 1000) / 1000

  const domain = selectWeightedLifeDomain(state.character.age, rng)
  const domainId = domain.id

  if (isLifeEventEngineEnabled()) {
    const picked = selectLifeEvent(selectionInputFromSimulation(state, domainId), rng)
    if (picked) {
      const scenarioId: ScenarioId = picked.encounter.scenarioTemplate === 'protection_stress'
        ? 'protection_stress'
        : 'promotion'
      return {
        domainId: picked.lifeEvent.domain,
        encounterId: picked.encounterId,
        encounter: picked.encounter,
        scenarioId,
        lifeEventId: picked.lifeEvent.id,
      }
    }
  }

  const repo = getEncounterRepository()
  const pool = repo.getByDomain(domainId)
  const encounter = weightedPickLegacy(pool.length ? pool : repo.getAll(), seed)
  const scenarioId: ScenarioId = encounter.scenarioTemplate === 'protection_stress'
    ? 'protection_stress'
    : 'promotion'

  return {
    domainId,
    encounterId: encounter.id,
    encounter,
    scenarioId,
    lifeEventId: resolveLifeEventDefinition(encounter.id, encounter)?.id ?? null,
  }
}
