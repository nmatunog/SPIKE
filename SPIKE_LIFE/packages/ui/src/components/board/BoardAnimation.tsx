import { motion, useReducedMotion } from 'framer-motion'
import { motionTokens as t } from '../../motion/tokens.js'
import type { BoardAnimationProps } from '../../types/component-props.js'

export type { BoardAnimationProps }

export interface CameraFocus {
  x: number
  y: number
  scale: number
}

const DEFAULT_FOCUS: CameraFocus = { x: 0.5, y: 0.5, scale: 1 }

export function BoardAnimation({
  rolling = false,
  isAnimating = false,
  cameraFocus = DEFAULT_FOCUS,
  children,
  className = '',
}: BoardAnimationProps) {
  const reduceMotion = useReducedMotion()
  const panX = (0.5 - cameraFocus.x) * (reduceMotion ? 0 : 10)
  const panY = (0.5 - cameraFocus.y) * (reduceMotion ? 0 : 10)
  const scale = reduceMotion ? 1 : cameraFocus.scale

  return (
    <motion.div
      className={className}
      data-rolling={rolling ? 'true' : 'false'}
      data-animating={isAnimating ? 'true' : 'false'}
      animate={{
        scale: rolling && !reduceMotion ? 1.02 : 1,
      }}
      transition={{ duration: t.normal, ease: t.ease.out }}
    >
      <motion.div
        className="h-full w-full"
        animate={{
          scale,
          x: `${panX}%`,
          y: `${panY}%`,
          filter: rolling && !reduceMotion ? 'brightness(1.06)' : 'brightness(1)',
        }}
        transition={
          isAnimating
            ? { duration: t.dramatic, ease: t.ease.soft }
            : { duration: t.slow, ease: t.ease.out }
        }
        style={{ transformOrigin: 'center center' }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
