import { defaultsForCategory } from './category-defaults.js'
import type {
  BoardConfig,
  BoardConfigInput,
  BoardLegendItem,
  DomainBoardSpace,
  SpaceConfig,
  SpaceConfigInput,
} from './types.js'

function humanizeToken(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

function humanizeCategory(category: string): string {
  return humanizeToken(category)
}

export function resolveSpaceConfig(input: SpaceConfigInput, arrayIndex: number): SpaceConfig {
  const category = input.category.trim()
  const defaults = defaultsForCategory(category)
  const boardIndex = input.boardIndex ?? arrayIndex
  const name = input.name?.trim() || input.title?.trim() || humanizeToken(input.id)

  return {
    id: input.id,
    name,
    title: name,
    category,
    color: input.color ?? defaults.color,
    icon: input.icon ?? defaults.icon,
    description: input.description,
    boardIndex,
    connections: input.connections,
    eventPool: input.eventPool,
    encounterId: input.encounterId ?? defaults.encounterId,
  }
}

/**
 * Resolve partial JSON board config into a complete BoardConfig.
 * Array order defines movement track unless `boardIndex` is set explicitly.
 */
export function resolveBoardConfig(input: BoardConfigInput): BoardConfig {
  if (!input.spaces?.length) {
    throw new Error('Board config must include at least one space')
  }

  const spaces = input.spaces.map((space, index) => resolveSpaceConfig(space, index))

  validateResolvedBoardConfig(spaces)

  return {
    id: input.id ?? 'board',
    title: input.title ?? 'Board',
    layout: input.layout ?? 'rounded-rectangle',
    layoutOptions: input.layoutOptions,
    maxPlayers: input.maxPlayers,
    spaces,
  }
}

export function validateResolvedBoardConfig(spaces: SpaceConfig[]): void {
  const indices = new Set<number>()
  const ids = new Set<string>()

  for (const space of spaces) {
    if (indices.has(space.boardIndex)) {
      throw new Error(`Duplicate boardIndex: ${space.boardIndex}`)
    }
    if (ids.has(space.id)) {
      throw new Error(`Duplicate space id: ${space.id}`)
    }
    indices.add(space.boardIndex)
    ids.add(space.id)
  }

  for (const space of spaces) {
    for (const conn of space.connections ?? []) {
      if (!spaces.some((s) => s.boardIndex === conn)) {
        throw new Error(`Space "${space.id}" connection ${conn} does not exist`)
      }
    }
  }
}

/** @deprecated Use validateResolvedBoardConfig after resolveBoardConfig. */
export function validateBoardConfig(config: BoardConfig): void {
  validateResolvedBoardConfig(config.spaces)
}

export function normalizeSpaceConfig(space: SpaceConfig): SpaceConfig {
  return {
    ...space,
    name: space.name || space.title || space.id,
  }
}

/** Build legend entries from unique categories present on the board. */
export function legendFromBoardConfig(config: BoardConfig): BoardLegendItem[] {
  const seen = new Map<string, BoardLegendItem>()

  for (const space of config.spaces) {
    if (!seen.has(space.category)) {
      seen.set(space.category, {
        category: space.category,
        label: humanizeCategory(space.category),
        color: space.color,
      })
    }
  }

  return [...seen.values()]
}

/** Map resolved config to domain board spaces (movement + encounter routing only). */
export function toDomainBoardSpaces(config: BoardConfig): DomainBoardSpace[] {
  return [...config.spaces]
    .sort((a, b) => a.boardIndex - b.boardIndex)
    .map((space) => ({
      index: space.boardIndex,
      type: space.category,
      encounterId: space.encounterId,
      label: space.name,
    }))
}
