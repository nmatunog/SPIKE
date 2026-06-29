import type { SimulationState } from '../aggregates/simulation-session.js'
import type { ScenarioId } from '../types.js'
import type { EncounterRecord } from '@spike-life/content-core'
import { getEncounterRepository } from '../ports/encounter-repository.js'
import { selectWeightedLifeDomain } from '../gameboard/services/year-loop/domain-weights.js'
import {
  encounterMeetsCareerPrerequisites,
} from '../gameboard/services/year-loop/situation-weights.js'
import type { EncounterCardId } from '../gameboard/types.js'
import { packIdToCardId } from './pack-encounter-bridge.js'

export interface CycleStartSelection {
  domainId: string
  encounterId: string
  encounter: EncounterRecord
  scenarioId: ScenarioId
}

function weightedPick(encounters: EncounterRecord[], seed: number): EncounterRecord {
  const total = encounters.reduce((sum, e) => sum + (e.weights.base ?? 1), 0)
  let roll = seed % Math.max(total, 1)
  for (const enc of encounters) {
    roll -= enc.weights.base ?? 1
    if (roll < 0) return enc
  }
  return encounters[encounters.length - 1]!
}

function completedCareerCardIds(
  state: SimulationState,
  extra: EncounterCardId[] = [],
): EncounterCardId[] {
  const completed = new Set<EncounterCardId>(extra)
  if (state.encounterId) {
    const cardId = packIdToCardId(state.encounterId)
    if (cardId) completed.add(cardId)
  }
  return [...completed]
}

function filterCareerPool(
  pool: EncounterRecord[],
  age: number,
  completed: EncounterCardId[],
): EncounterRecord[] {
  const filtered = pool.filter((enc) => {
    const cardId = packIdToCardId(enc.id)
    if (!cardId) return true
    return encounterMeetsCareerPrerequisites(cardId, age, completed)
  })
  return filtered.length > 0 ? filtered : pool
}

export function selectCycleEncounter(
  state: SimulationState,
  completedEncounterCardIds: EncounterCardId[] = [],
): CycleStartSelection {
  const rng = () => {
    const seed = state.turnNumber * 997 + state.cycleIndex * 131
    return (seed % 1000) / 1000
  }
  const domain = selectWeightedLifeDomain(state.character.age, rng)
  const domainId = domain.id
  const repo = getEncounterRepository()
  const rawPool = repo.getByDomain(domainId)
  const pool = filterCareerPool(
    rawPool.length ? rawPool : repo.getAll(),
    state.character.age,
    completedCareerCardIds(state, completedEncounterCardIds),
  )
  const seed = state.turnNumber * 997 + state.cycleIndex * 131
  const encounter = weightedPick(pool.length ? pool : repo.getAll(), seed)
  const scenarioId: ScenarioId = encounter.scenarioTemplate === 'protection_stress'
    ? 'protection_stress'
    : 'promotion'

  return { domainId, encounterId: encounter.id, encounter, scenarioId }
}
