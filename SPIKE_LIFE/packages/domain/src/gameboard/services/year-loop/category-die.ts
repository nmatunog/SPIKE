import type { SpaceType } from '../../types.js'
import { BOARD_DICE_MAX, BOARD_DICE_MIN } from '../../types.js'

export interface CategoryDieFace {
  value: number
  category: SpaceType
  label: string
}

/** d6 faces — which domain of life this year touches */
export const CATEGORY_DIE_FACES: CategoryDieFace[] = [
  { value: 1, category: 'career', label: 'Career & Income' },
  { value: 2, category: 'finance', label: 'Money & Markets' },
  { value: 3, category: 'family', label: 'Family & Life' },
  { value: 4, category: 'health', label: 'Health & Risk' },
  { value: 5, category: 'business', label: 'Business & Opportunity' },
  { value: 6, category: 'education', label: 'Growth & Learning' },
]

export function rollCategoryDie(rng: () => number = Math.random): CategoryDieFace {
  const span = BOARD_DICE_MAX - BOARD_DICE_MIN + 1
  const value = Math.floor(rng() * span) + BOARD_DICE_MIN
  const face = CATEGORY_DIE_FACES.find((f) => f.value === value)
  return face ?? CATEGORY_DIE_FACES[0]!
}

export function categoryForDieValue(value: number): CategoryDieFace {
  const face = CATEGORY_DIE_FACES.find((f) => f.value === value)
  if (!face) throw new Error(`Invalid category die value: ${value}`)
  return face
}
