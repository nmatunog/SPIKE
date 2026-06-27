import type { ReactNode } from 'react'
import type { SpaceCategory } from './board-config.js'
import type {
  BoardTokenViewModel,
  BoardViewModel,
  EncounterViewModel,
  FinancialHUDViewModel,
  PositionedSpace,
  TurnHUDViewModel,
} from './view-models.js'

/** Shared legend row — pass from config; component does not load defaults. */
export interface LegendItemViewModel {
  category: string
  label: string
  color: string
}

export type BoardSpaceSize = 'sm' | 'md' | 'lg'

export interface GameBoardProps {
  board: BoardViewModel | null
  rolling?: boolean
  highlightSpaceIndex?: number | null
  onSpaceSelect?: (space: PositionedSpace) => void
  className?: string
  loadingLabel?: string
}

export interface BoardSpaceProps {
  space: PositionedSpace
  isLanded?: boolean
  isHighlighted?: boolean
  size?: BoardSpaceSize
  onSelect?: (space: PositionedSpace) => void
}

export interface PlayerTokenProps {
  token: BoardTokenViewModel
  x: number
  y: number
  rolling?: boolean
  size?: number
}

export interface BoardLegendProps {
  items: LegendItemViewModel[]
  compact?: boolean
  className?: string
  title?: string
}

export interface EncounterCardProps {
  encounter: EncounterViewModel | null
  spaceCategory?: SpaceCategory
  spaceCategoryLabel?: string
  impactTags?: string[]
  priorityLabels?: string[]
  visible?: boolean
  onViewAnalysis?: () => void
  onMakeDecision?: () => void
  onDismiss?: () => void
}

export interface TurnCounterProps {
  roundNumber: number
  maxRounds: number
  boardYear: number
  className?: string
  yearLabel?: string
  turnLabel?: string
}

export interface DicePanelProps {
  canRoll: boolean
  rolling: boolean
  lastDiceRoll: number | null
  onRoll: () => void
  className?: string
  rollLabel?: string
  rollingLabel?: string
  hint?: string
}

export interface LifeScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  maxDisplay?: number
}

export interface BoardHUDProps {
  hud: TurnHUDViewModel | null
  onRoll?: () => void
  rolling?: boolean
  className?: string
  brandLabel?: string
  loadingLabel?: string
  rollLabel?: string
  rollingLabel?: string
}

export interface FinancialHUDProps {
  data: FinancialHUDViewModel | null
  onOpenGrow?: () => void
  onOpenProtect?: () => void
  className?: string
  growLabel?: string
  protectLabel?: string
}

export interface BoardAnimationProps {
  rolling?: boolean
  isAnimating?: boolean
  highlightSpaceIndex?: number | null
  landedSpaceIndex?: number | null
  children: ReactNode
  className?: string
}
