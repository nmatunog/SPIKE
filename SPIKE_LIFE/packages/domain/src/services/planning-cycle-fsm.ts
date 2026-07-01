import type { CyclePhase } from '../types.js'

export type PlanningCyclePhase = CyclePhase

/**
 * GDS Ch 3 — canonical planning cycle phases.
 * Existing CyclePhase values map into this sequence; calendar gates overlay cycle_complete.
 */
export const PLANNING_CYCLE_SEQUENCE: readonly CyclePhase[] = [
  'created',
  'situation_presented',
  'discovery_complete',
  'decision_pending',
  'consequences_applied',
  'reflection_complete',
  'cycle_complete',
] as const

const ALLOWED_TRANSITIONS: Record<CyclePhase, readonly CyclePhase[]> = {
  created: ['situation_presented'],
  situation_presented: ['discovery_complete', 'decision_pending'],
  discovery_complete: ['decision_pending'],
  decision_pending: ['consequences_applied'],
  consequences_applied: ['reflection_complete', 'cycle_complete'],
  reflection_complete: ['cycle_complete'],
  cycle_complete: ['created'],
}

export function canTransitionCyclePhase(from: CyclePhase, to: CyclePhase): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertCycleTransition(from: CyclePhase, to: CyclePhase): void {
  if (!canTransitionCyclePhase(from, to)) {
    throw new Error(`Invalid planning cycle transition: ${from} → ${to}`)
  }
}

export function isCycleActive(phase: CyclePhase): boolean {
  return phase !== 'created' && phase !== 'cycle_complete'
}

export function canStartNewCycle(phase: CyclePhase, pendingCalendar: boolean): boolean {
  return phase === 'created' && !pendingCalendar
}
