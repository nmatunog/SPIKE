/** Presentation-only board configuration — no financial logic. */

export type BoardLayoutKind =
  | 'rounded-rectangle'
  | 'rectangle'
  | 'circle'
  | 'serpentine'
  | (string & {})

export type SpaceCategory =
  | 'career'
  | 'finance'
  | 'opportunity'
  | 'risk'
  | 'family'
  | 'health'
  | 'business'
  | 'investment'
  | 'education'
  | 'life_event'
  | 'milestone'
  | 'rest'
  | 'bonus'
  | 'community'

export type SpaceIconId =
  | 'briefcase'
  | 'wallet'
  | 'sparkles'
  | 'alert'
  | 'heart'
  | 'medical'
  | 'building'
  | 'chart'
  | 'book'
  | 'star'
  | 'moon'
  | 'gift'
  | 'users'
  | 'trending'

/** A single board space — fully data-driven; no coordinates stored here. */
export interface SpaceConfig {
  id: string
  name: string
  category: SpaceCategory
  icon: SpaceIconId
  color: string
  description?: string
  /** Movement order — tokens advance by boardIndex, not array order. */
  boardIndex: number
  /** Optional explicit adjacency (boardIndex values). Defaults to next space on track. */
  connections?: number[]
  /** Encounter ids that can trigger on this space. */
  eventPool?: string[]
  /** Primary encounter routed when landing here. */
  encounterId: string
  /** @deprecated Use `name` — kept for legacy configs. */
  title?: string
}

export interface BoardLayoutOptions {
  padding?: number
  cornerRadius?: number
  serpentineColumns?: number
  aspectRatio?: number
}

export interface BoardConfig {
  id: string
  title: string
  layout: BoardLayoutKind
  layoutOptions?: BoardLayoutOptions
  spaces: SpaceConfig[]
  maxPlayers?: number
}

/** Normalize legacy configs that still use `title` instead of `name`. */
export function normalizeSpaceConfig(space: SpaceConfig): SpaceConfig {
  return {
    ...space,
    name: space.name || space.title || space.id,
  }
}

export function validateBoardConfig(config: BoardConfig): void {
  if (config.spaces.length === 0) {
    throw new Error('BoardConfig must contain at least one space')
  }

  const indices = new Set<number>()
  const ids = new Set<string>()

    for (const raw of config.spaces) {
    const space = normalizeSpaceConfig(raw)
    if (indices.has(space.boardIndex)) {
      throw new Error(`Duplicate boardIndex: ${space.boardIndex}`)
    }
    if (ids.has(space.id)) {
      throw new Error(`Duplicate space id: ${space.id}`)
    }
    indices.add(space.boardIndex)
    ids.add(space.id)
  }

  for (const raw of config.spaces) {
    for (const conn of raw.connections ?? []) {
      if (!config.spaces.some((s) => s.boardIndex === conn)) {
        throw new Error(`Space "${raw.id}" connection ${conn} does not exist`)
      }
    }
  }
}
