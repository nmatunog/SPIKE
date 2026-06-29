import type { LifeStage } from '../types.js'
import { getWorkshopMacroTurns } from './campaign-context.js'

/** Workshop mode — default macro turns; overridden by campaign pack. */
export const WORKSHOP_MAX_TURNS = 5

export function resolveWorkshopMaxTurns(): number {
  return getWorkshopMacroTurns()
}

export const WORKSHOP_STAGE_ORDER: readonly LifeStage[] = [
  'launch',
  'build',
  'grow',
  'lead',
  'legacy',
] as const

export const WORKSHOP_STAGE_LABELS: Record<LifeStage, string> = {
  launch: 'Launch',
  build: 'Build',
  grow: 'Grow',
  lead: 'Lead',
  legacy: 'Legacy',
}

/** Representative ages per workshop stage (Simulation Blueprint v2.5). */
export const WORKSHOP_AGE_BY_STAGE: Record<LifeStage, number> = {
  launch: 22,
  build: 32,
  grow: 42,
  lead: 52,
  legacy: 62,
}

export function lifeStageForTurn(turnNumber: number): LifeStage {
  const index = Math.max(0, Math.min(turnNumber - 1, WORKSHOP_STAGE_ORDER.length - 1))
  return WORKSHOP_STAGE_ORDER[index] ?? 'launch'
}

export function ageForSimulationYear(startingAge: number, simulationYear: number): number {
  return startingAge + Math.max(0, simulationYear - 1)
}

/** @deprecated Use ageForSimulationYear with session.startingAge */
export function ageForWorkshopTurn(turnNumber: number): number {
  return WORKSHOP_AGE_BY_STAGE[lifeStageForTurn(turnNumber)]
}

export function workshopStageLabel(stage: LifeStage): string {
  return WORKSHOP_STAGE_LABELS[stage]
}
