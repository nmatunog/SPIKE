import { getArchetypeIds } from './archetype-context.js'

export function pickRandomArchetypeId(
  usedIds: readonly string[],
  rng: () => number = Math.random,
): string {
  const pool = getArchetypeIds().filter((id) => !usedIds.includes(id))
  const order = pool.length > 0 ? pool : [...getArchetypeIds()]
  if (order.length === 0) return 'fresh_graduate'
  const index = Math.floor(rng() * order.length)
  return order[index] ?? order[0]!
}

export function pickSoloArchetypeId(
  sessionSeed: string,
  rng: () => number = Math.random,
): string {
  const ids = getArchetypeIds()
  if (ids.length <= 1) return ids[0] ?? 'fresh_graduate'

  let hash = 0
  for (let i = 0; i < sessionSeed.length; i += 1) {
    hash = (hash * 31 + sessionSeed.charCodeAt(i)) >>> 0
  }
  const roll = (hash / 0xffffffff + rng()) % 1
  const index = Math.floor(roll * ids.length)
  return ids[index] ?? ids[0]!
}
