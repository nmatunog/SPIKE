import { motion, useReducedMotion } from 'framer-motion'
import { motionTokens as t } from '../../motion/tokens.js'
import type { LifeScoreRingProps } from '../../types/component-props.js'

export type { LifeScoreRingProps }

export function LifeScoreRing({
  score,
  size = 48,
  strokeWidth = 4,
  maxDisplay = 1000,
}: LifeScoreRingProps) {
  const reduceMotion = useReducedMotion()
  const display = Math.round(score * 10)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, display / maxDisplay)
  const offset = circumference * (1 - progress)
  const fontSize = size < 44 ? 10 : 11

  return (
    <motion.div
      key={`score-${display}`}
      initial={reduceMotion ? false : { scale: 1.08 }}
      animate={{ scale: 1 }}
      transition={{ duration: t.slow, ease: t.ease.snap }}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Life score ${display} out of ${maxDisplay}`}
      role="img"
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: t.slow, ease: t.ease.out }}
        />
      </svg>
      <motion.span
        key={display}
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: t.normal }}
        className="absolute text-center font-bold text-white"
        style={{ fontSize }}
      >
        {display}
        <span className="block font-normal text-slate-400" style={{ fontSize: fontSize - 2 }}>
          /{maxDisplay}
        </span>
      </motion.span>
    </motion.div>
  )
}
