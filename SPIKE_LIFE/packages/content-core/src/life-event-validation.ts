import type { LifeEventPack } from './life-event-types.js'

export function validateLifeEventPack(pack: LifeEventPack): void {
  if (!pack.events?.length) {
    throw new Error('Life event pack must contain at least one event.')
  }
  const ids = new Set<string>()
  for (const event of pack.events) {
    if (!event.id || !event.encounterId || !event.domain) {
      throw new Error(`Invalid life event: ${event.id ?? 'unknown'}`)
    }
    if (ids.has(event.id)) {
      throw new Error(`Duplicate life event id: ${event.id}`)
    }
    ids.add(event.id)
    if (event.weight < 0) {
      throw new Error(`Life event ${event.id} has negative weight.`)
    }
  }
  for (const arc of pack.arcs ?? []) {
    if (!arc.id || !arc.sequence?.length) {
      throw new Error(`Invalid story arc: ${arc.id ?? 'unknown'}`)
    }
    for (const stepId of arc.sequence) {
      if (!ids.has(stepId)) {
        throw new Error(`Story arc ${arc.id} references unknown event ${stepId}`)
      }
    }
  }
}
