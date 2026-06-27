import type { ReactNode } from 'react'
import { useMovementAnimator } from '../hooks/useMovementAnimator.js'
import type { MovementAnimatorInput, MovementAnimatorResult } from '../hooks/useMovementAnimator.js'

export type { MovementAnimatorInput, MovementAnimatorResult }

export interface MovementAnimatorProps extends MovementAnimatorInput {
  children: (result: MovementAnimatorResult) => ReactNode
}

/** Headless movement animation — computes token positions along boardIndex path. */
export function MovementAnimator({ children, ...input }: MovementAnimatorProps) {
  const result = useMovementAnimator(input)
  return <>{children(result)}</>
}
