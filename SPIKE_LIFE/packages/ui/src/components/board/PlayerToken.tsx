import { motion, useReducedMotion } from 'framer-motion'
import { motionTokens as t } from '../../motion/tokens.js'
import type { PlayerTokenProps } from '../../types/component-props.js'

export type { PlayerTokenProps }

export function PlayerToken({
  token,
  x,
  y,
  rolling = false,
  landing = false,
  size = 32,
}: PlayerTokenProps) {
  const reduceMotion = useReducedMotion()
  const initial = token.displayName.charAt(0).toUpperCase()

  return (
    <motion.div
      layout
      animate={{
        left: `${x}%`,
        top: `${y}%`,
        scale: landing && !reduceMotion ? [1, 1.18, 1.08] : token.isCurrent ? 1.08 : 1,
        y: landing && !reduceMotion ? [0, -8, 0] : 0,
      }}
      transition={
        landing
          ? { duration: t.slow, ease: t.ease.snap }
          : { ...t.spring.smooth, duration: t.dramatic }
      }
      className={`pointer-events-none absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white font-bold text-white shadow-xl ${
        token.isCurrent ? 'ring-2 ring-amber-300' : ''
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: token.color,
      }}
      aria-label={`${token.displayName} token`}
      data-current={token.isCurrent ? 'true' : 'false'}
    >
      {rolling && token.isCurrent && !reduceMotion && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-amber-200/80"
          animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
          transition={{ duration: t.normal, repeat: Infinity, ease: 'easeOut' }}
          aria-hidden
        />
      )}
      {initial}
    </motion.div>
  )
}
