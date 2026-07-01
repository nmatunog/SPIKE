import type {
  LifeEventDefinition,
  LifeEventPack,
  LifeStoryArcDefinition,
} from '@spike-life/content-core'
import type { EncounterRecord } from '@spike-life/content-core'

let activePack: LifeEventPack | null = null

export function configureLifeEventPack(pack: LifeEventPack | null): void {
  activePack = pack
}

export function isLifeEventEngineEnabled(): boolean {
  return activePack != null && activePack.events.length > 0
}

export function getLifeEventPack(): LifeEventPack | null {
  return activePack
}

export function getLifeEventById(id: string): LifeEventDefinition | null {
  return activePack?.events.find((e) => e.id === id) ?? null
}

export function getLifeEventByEncounterId(encounterId: string): LifeEventDefinition | null {
  return activePack?.events.find((e) => e.encounterId === encounterId) ?? null
}

export function getLifeEventsForDomain(domainId: string): LifeEventDefinition[] {
  if (!activePack) return []
  return activePack.events.filter((e) => e.domain === domainId)
}

export function getStoryArcs(): LifeStoryArcDefinition[] {
  return activePack?.arcs ?? []
}

export function getStoryArcById(id: string): LifeStoryArcDefinition | null {
  return getStoryArcs().find((a) => a.id === id) ?? null
}

/** Fallback definition for encounters without explicit life-event metadata. */
export function defaultLifeEventFromEncounter(enc: EncounterRecord): LifeEventDefinition {
  return {
    id: enc.id,
    encounterId: enc.id,
    domain: enc.domainId,
    title: enc.title,
    weight: enc.weights.base ?? 1,
    repeatable: enc.eventClass !== 'milestone',
    bypassProgression: enc.eventClass === 'crisis',
    requirements: {},
  }
}

export function resolveLifeEventDefinition(
  encounterId: string,
  encounter?: EncounterRecord | null,
): LifeEventDefinition | null {
  const explicit = getLifeEventByEncounterId(encounterId)
    ?? getLifeEventById(encounterId)
  if (explicit) return explicit
  if (encounter) return defaultLifeEventFromEncounter(encounter)
  return null
}
