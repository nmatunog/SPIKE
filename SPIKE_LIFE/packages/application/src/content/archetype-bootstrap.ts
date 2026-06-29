import type { ContentPack } from '@spike-life/content-core'
import { validateArchetypePackConfig } from '@spike-life/content-core'
import { configureArchetypes } from '@spike-life/domain'

/** Load playable personas from the active content pack. */
export function bootstrapArchetypesFromPack(pack: ContentPack): void {
  if (!pack.archetypes) return
  validateArchetypePackConfig(pack.archetypes)
  configureArchetypes(pack.archetypes)
}
