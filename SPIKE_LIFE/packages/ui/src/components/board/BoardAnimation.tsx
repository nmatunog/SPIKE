import { motion } from 'framer-motion'
import type { BoardAnimationProps } from '../../types/component-props.js'

export type { BoardAnimationProps }

export function BoardAnimation({
  rolling = false,
  isAnimating = false,
  highlightSpaceIndex = null,
  landedSpaceIndex = null,
  children,
  className = '',
}: BoardAnimationProps) {
  const isActive =
    rolling || isAnimating || highlightSpaceIndex != null || landedSpaceIndex != null

  return (
    <motion.div
      className={className}
      data-rolling={rolling ? 'true' : 'false'}
      data-animating={isAnimating ? 'true' : 'false'}
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
