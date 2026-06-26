import { motion } from 'framer-motion'
import type { TurnHUDViewModel } from '../types/view-models.js'
import { TurnCounter } from './TurnIndicator.js'
import { TurnIndicator } from './TurnIndicator.js'

export interface LifeScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

export function LifeScoreRing({ score, size = 48, strokeWidth = 4 }: LifeScoreRingProps) {
  const display = Math.round(score * 10)
  const max = 1000
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, display / max)
  const offset = circumference * (1 - progress)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
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
        <span className="block text-[8px] font-normal text-slate-400">/1000</span>
      </span>
    </div>
  )
}

export interface BoardHUDProps {
  hud: TurnHUDViewModel | null
  onRoll?: () => void
  rolling?: boolean
  className?: string
}

export function BoardHUD({ hud, onRoll, rolling = false, className = '' }: BoardHUDProps) {
  if (!hud) {
    return (
      <header className={`border-b border-slate-800 bg-slate-900 px-4 py-3 ${className}`}>
        <p className="text-sm text-slate-400">Loading game…</p>
      </header>
    )
  }

  const canRoll = hud.canRoll && !rolling

  return (
    <header
      className={`shrink-0 border-b border-slate-800 bg-slate-900 text-white ${className}`}
      style={{ minHeight: '10dvh' }}
    >
      <div className="mx-auto flex h-full max-w-[100rem] flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">SPIKE LIFE™</p>
          <h1 className="truncate text-lg font-semibold md:text-xl">{hud.characterName}</h1>
          <p className="text-sm text-slate-400">
            Age {hud.age} · Year {hud.boardYear}
          </p>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <TurnCounter
            roundNumber={hud.roundNumber}
            maxRounds={hud.maxRounds}
            boardYear={hud.boardYear}
          />
          <TurnIndicator phase={hud.phase} />
        </div>

        <div className="flex items-center gap-3">
          <LifeScoreRing score={hud.lifeScore} size={52} />
          <div className="hidden h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-600 bg-slate-800 text-lg font-bold sm:flex">
            {rolling ? '…' : (hud.lastDiceRoll ?? '—')}
          </div>
          {onRoll && (
            <button
              type="button"
              disabled={!canRoll}
              onClick={onRoll}
              className="rounded-2xl bg-[#8B0000] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg hover:bg-[#a50000] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40"
            >
              {rolling ? 'Rolling…' : 'Roll'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
