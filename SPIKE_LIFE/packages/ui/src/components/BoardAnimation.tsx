import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export interface BoardAnimationProps {
  rolling?: boolean
  isAnimating?: boolean
  highlightSpaceIndex?: number | null
  landedSpaceIndex?: number | null
  children: ReactNode
  className?: string
}

/** Coordinates board-level motion: subtle scale on roll, spring on land/highlight. */
export function BoardAnimation({
  rolling = false,
  isAnimating = false,
  highlightSpaceIndex = null,
  landedSpaceIndex = null,
  children,
  className = '',
}: BoardAnimationProps) {
  const isActive = rolling || isAnimating || highlightSpaceIndex != null || landedSpaceIndex != null

  return (
    <motion.div
      className={className}
      animate={{
        scale: rolling ? 0.985 : isActive ? 1 : 1,
        filter: rolling ? 'brightness(1.05)' : 'brightness(1)',
      }}
      transition={{ duration: rolling ? 0.22 : 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
