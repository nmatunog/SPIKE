import type { ArchetypePackConfig } from './archetype-types.js'

const CAREER_TYPES = new Set([
  'employee',
  'professional',
  'freelancer',
  'entrepreneur',
  'advisor',
  'hybrid',
])
const LIFE_STAGES = new Set(['launch', 'build', 'grow', 'lead', 'legacy'])

export function validateArchetypePackConfig(config: ArchetypePackConfig): void {
  if (!config.archetypes?.length) {
    throw new Error('archetype pack: at least one archetype is required')
  }

  const ids = new Set<string>()
  for (const archetype of config.archetypes) {
    if (!archetype.id?.trim()) throw new Error('archetype pack: missing id')
    if (ids.has(archetype.id)) {
      throw new Error(`archetype pack: duplicate id "${archetype.id}"`)
    }
    ids.add(archetype.id)

    if (!archetype.label?.trim()) throw new Error(`archetype ${archetype.id}: missing label`)
    if (!CAREER_TYPES.has(archetype.character.careerType)) {
      throw new Error(`archetype ${archetype.id}: invalid careerType`)
    }
    if (!LIFE_STAGES.has(archetype.character.lifeStage)) {
      throw new Error(`archetype ${archetype.id}: invalid lifeStage`)
    }
    if (archetype.character.age < 18 || archetype.character.age > 70) {
      throw new Error(`archetype ${archetype.id}: age out of range`)
    }
    if (!archetype.goals?.length) {
      throw new Error(`archetype ${archetype.id}: at least one goal required`)
    }
  }

  const { assignment } = config
  if (assignment.mode !== 'random_unique') {
    throw new Error('archetype pack: only random_unique assignment is supported')
  }
  if (assignment.minPlayers < 1 || assignment.maxPlayers < assignment.minPlayers) {
    throw new Error('archetype pack: invalid player bounds')
  }
  if (config.archetypes.length < assignment.maxPlayers) {
    throw new Error(
      `archetype pack: need at least ${assignment.maxPlayers} archetypes for unique assignment`,
    )
  }
}
