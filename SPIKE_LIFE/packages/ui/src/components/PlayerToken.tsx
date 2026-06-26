import { motion } from 'framer-motion'
import type { BoardTokenViewModel } from '../types/view-models.js'

export interface PlayerTokenProps {
  token: BoardTokenViewModel
  x: number
  y: number
  rolling?: boolean
  size?: number
}

export function PlayerToken({ token, x, y, rolling = false, size = 32 }: PlayerTokenProps) {
  const initial = token.displayName.charAt(0).toUpperCase()

  return (
    <motion.div
      layout
      animate={{ left: `${x}%`, top: `${y}%`, scale: token.isCurrent ? 1.08 : 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26, mass: 0.8 }}
      className={`pointer-events-none absolute z-30 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white font-bold text-white shadow-xl ${
        token.isCurrent ? 'ring-2 ring-amber-300' : ''
      } ${rolling && token.isCurrent ? 'animate-pulse' : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: token.color,
      }}
      aria-label={`${token.displayName} token`}
    >
      {initial}
    </motion.div>
  )
}
