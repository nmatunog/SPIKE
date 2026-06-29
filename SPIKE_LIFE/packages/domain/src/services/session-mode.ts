import type { CampaignConfig } from '@spike-life/content-core'
import type { SessionMode } from '../types.js'
import { getMaxCampaignCycles, getWorkshopMacroTurns } from './campaign-context.js'
import { cycleIndexForMacroTurn, cyclesPerMacroTurn, simulationYearFromCycle } from './planning-cycle.js'
import { lifeStageForTurn } from './workshop-progression.js'

export function resolveMaxTurns(sessionMode: SessionMode): number {
  if (sessionMode === 'campaign') {
    return getMaxCampaignCycles()
  }
  return getWorkshopMacroTurns()
}

export function isSessionComplete(
  sessionMode: SessionMode,
  turnNumber: number,
  cycleIndex: number,
): boolean {
  const maxCycles = getMaxCampaignCycles()
  if (sessionMode === 'campaign') {
    return cycleIndex >= maxCycles && turnNumber >= maxCycles
  }
  return turnNumber >= getWorkshopMacroTurns()
}

export interface AdvancedCyclePosition {
  turnNumber: number
  cycleIndex: number
  simulationYear: number
  lifeStage: ReturnType<typeof lifeStageForTurn>
}

/** Compute next turn/cycle after completing a planning cycle. */
export function advanceCyclePosition(
  sessionMode: SessionMode,
  currentTurn: number,
  currentCycleIndex: number,
  config: CampaignConfig,
): AdvancedCyclePosition {
  if (sessionMode === 'campaign') {
    const nextCycleIndex = currentCycleIndex + 1
    const simulationYear = simulationYearFromCycle(nextCycleIndex)
    const macroTurn = Math.min(
      getWorkshopMacroTurns(),
      Math.ceil(nextCycleIndex / cyclesPerMacroTurn(config)),
    )
    return {
      turnNumber: nextCycleIndex,
      cycleIndex: nextCycleIndex,
      simulationYear,
      lifeStage: lifeStageForTurn(macroTurn),
    }
  }

  const nextTurn = currentTurn + 1
  const cycleIndex = cycleIndexForMacroTurn(nextTurn, config)
  return {
    turnNumber: nextTurn,
    cycleIndex,
    simulationYear: simulationYearFromCycle(cycleIndex),
    lifeStage: lifeStageForTurn(nextTurn),
  }
}

/** Cycle index at end of current turn (for year-end calendar triggers). */
export function completedCycleIndexForTurn(
  sessionMode: SessionMode,
  turnNumber: number,
  cycleIndex: number,
  config: CampaignConfig,
): number {
  if (sessionMode === 'campaign') {
    return cycleIndex
  }
  return turnNumber * cyclesPerMacroTurn(config)
}
