/** Presentation-only board configuration — no financial logic. */

export type BoardLayoutKind =
  | 'rounded-rectangle'
  | 'rectangle'
  | 'circle'
  | 'serpentine'

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

export interface SpaceConfig {
  id: string
  title: string
  category: SpaceCategory
  color: string
  icon: SpaceIconId
  description?: string
  boardIndex: number
  connections?: number[]
  eventPool?: string[]
  encounterId: string
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
