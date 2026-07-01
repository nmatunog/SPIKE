import type { LifeEventDefinition, LifeStoryArcDefinition } from '@spike-life/content-core'
import { getStoryArcById } from './life-event-context.js'

export interface ActiveStoryArc {
  arcId: string
  startedAtCycle: number
  currentStep: number
  expiresAtCycle: number
}

export function startStoryArc(
  arc: LifeStoryArcDefinition,
  cycleIndex: number,
): ActiveStoryArc {
  const duration = arc.durationCycles.max
  return {
    arcId: arc.id,
    startedAtCycle: cycleIndex,
    currentStep: 0,
    expiresAtCycle: cycleIndex + duration,
  }
}

export function advanceStoryArcStep(
  arc: ActiveStoryArc,
  event: LifeEventDefinition,
  arcDef: LifeStoryArcDefinition,
): ActiveStoryArc {
  const stepIndex = arcDef.sequence.indexOf(event.id)
  if (stepIndex < 0) return arc
  return {
    ...arc,
    currentStep: Math.max(arc.currentStep, stepIndex + 1),
  }
}

export function resolveActiveStoryArc(
  existing: ActiveStoryArc | null | undefined,
  completedEvent: LifeEventDefinition,
  cycleIndex: number,
): ActiveStoryArc | null {
  let arc = existing && cycleIndex <= existing.expiresAtCycle ? existing : null

  for (const arcId of completedEvent.storyArcIds ?? []) {
    const def = getStoryArcById(arcId)
    if (!def) continue
    if (!arc || arc.arcId !== arcId) {
      if (def.sequence[0] === completedEvent.id) {
        arc = startStoryArc(def, cycleIndex)
      }
    }
    if (arc && arc.arcId === arcId) {
      arc = advanceStoryArcStep(arc, completedEvent, def)
    }
  }

  if (arc && cycleIndex > arc.expiresAtCycle) return null
  return arc
}

export function storyArcWeightMultiplier(
  event: LifeEventDefinition,
  arc: ActiveStoryArc | null | undefined,
): number {
  if (!arc) return 1
  const arcDef = getStoryArcById(arc.arcId)
  if (!arcDef) return 1
  if (!event.storyArcIds?.includes(arc.arcId)) return 1

  const stepIndex = arcDef.sequence.indexOf(event.id)
  if (stepIndex < 0) return 1

  const bias = arcDef.biasMultiplier ?? 3
  if (stepIndex === arc.currentStep || stepIndex === arc.currentStep + 1) {
    return bias
  }
  if (event.followUpEventIds?.some((id) => arcDef.sequence.includes(id))) {
    return bias * 0.75
  }
  return 1
}
