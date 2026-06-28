/** Presentation-only board configuration — no financial logic. */

export type BoardLayoutKind =
  | 'rounded-rectangle'
  | 'rectangle'
  | 'circle'
  | 'serpentine'
  | (string & {})

export type SpaceCategory = string

export type SpaceIconId = string

/** Minimal space definition — only `id` and `category` required. */
export interface SpaceConfigInput {
  id: string
  title?: string
  name?: string
  category: SpaceCategory
  color?: string
  icon?: SpaceIconId
  description?: string
  boardIndex?: number
  connections?: number[]
  eventPool?: string[]
  encounterId?: string
}

/** Fully resolved space — produced by the board engine from JSON input. */
export interface SpaceConfig {
  id: string
  name: string
  category: SpaceCategory
  icon: SpaceIconId
  color: string
  description?: string
  boardIndex: number
  connections?: number[]
  eventPool?: string[]
  encounterId: string
  title?: string
}

export interface BoardLayoutOptions {
  padding?: number
  cornerRadius?: number
  serpentineColumns?: number
  aspectRatio?: number
}

export interface BoardConfigInput {
  id?: string
  title?: string
  layout?: BoardLayoutKind
  layoutOptions?: BoardLayoutOptions
  spaces: SpaceConfigInput[]
  maxPlayers?: number
}

export interface BoardConfig {
  id: string
  title: string
  layout: BoardLayoutKind
  layoutOptions?: BoardLayoutOptions
  spaces: SpaceConfig[]
  maxPlayers?: number
}

export interface BoardLegendItem {
  category: SpaceCategory
  label: string
  color: string
}

/** Domain-layer board space derived from config (no coordinates). */
export interface DomainBoardSpace {
  index: number
  type: string
  encounterId: string
  label: string
}
