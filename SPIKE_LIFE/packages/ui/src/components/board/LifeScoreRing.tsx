import { motion } from 'framer-motion'
import type { LifeScoreRingProps } from '../../types/component-props.js'

export type { LifeScoreRingProps }

export function LifeScoreRing({
  score,
  size = 48,
  strokeWidth = 4,
  maxDisplay = 1000,
}: LifeScoreRingProps) {
  const display = Math.round(score * 10)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, display / maxDisplay)
  const offset = circumference * (1 - progress)

  return (
    <div
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
          stroke="rgba(255,255,255,0.12)"
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
          transition={{ duration: 0.28, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-white">
        {display}
        <span className="block text-[8px] font-normal text-slate-400">/{maxDisplay}</span>
      </span>
    </div>
  )
}
