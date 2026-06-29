import type { ArchetypeConfig, ArchetypePackConfig } from '@spike-life/content-core'
import { createFreshGraduateBundle } from '../specifications/fresh-graduate.js'
import type { ArchetypeBundle } from '../specifications/archetype-bundle.js'
import { createBundleFromArchetypeConfig } from '../specifications/archetype-bundle.js'

let packConfig: ArchetypePackConfig | null = null

const FALLBACK_ARCHETYPE_ID = 'fresh_graduate'

export function configureArchetypes(config: ArchetypePackConfig): void {
  packConfig = config
}

export function resetArchetypeConfig(): void {
  packConfig = null
}

export function getArchetypePackConfig(): ArchetypePackConfig | null {
  return packConfig
}

export function getArchetypeConfig(id: string): ArchetypeConfig | undefined {
  return packConfig?.archetypes.find((a) => a.id === id)
}

export function getArchetypeIds(): readonly string[] {
  return packConfig?.archetypes.map((a) => a.id) ?? [FALLBACK_ARCHETYPE_ID]
}

export function getArchetypeLabel(id: string): string {
  return getArchetypeConfig(id)?.label ?? id
}

export function getArchetypeTagline(id: string): string {
  return getArchetypeConfig(id)?.tagline ?? ''
}

export function getMinPlayers(): number {
  return packConfig?.assignment.minPlayers ?? 1
}

export function getMaxPlayersFromPack(): number {
  return packConfig?.assignment.maxPlayers ?? 6
}

export function createArchetypeBundle(archetypeId?: string): ArchetypeBundle {
  const id = archetypeId ?? FALLBACK_ARCHETYPE_ID
  const config = getArchetypeConfig(id)
  if (config) return createBundleFromArchetypeConfig(config)
  if (id === FALLBACK_ARCHETYPE_ID) return createFreshGraduateBundle()
  throw new Error(`Unknown archetype: ${id}`)
}
