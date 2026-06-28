import { motion, useReducedMotion } from 'framer-motion'
import type { BoardHUDProps } from '../../types/component-props.js'
import { motionTokens as t } from '../../motion/tokens.js'
import { LifeScoreRing } from './LifeScoreRing.js'
import { TurnCounter } from './TurnCounter.js'
import { TurnIndicator } from './TurnIndicator.js'

export type { BoardHUDProps }

export function BoardHUD({
  hud,
  onRoll,
  rolling = false,
  className = '',
  brandLabel = 'SPIKE LIFE',
  loadingLabel = 'Loading game…',
  rollLabel = 'Next year',
  rollingLabel = 'Finding your biggest life event…',
}: BoardHUDProps) {
  const reduceMotion = useReducedMotion()

  if (!hud) {
    return (
      <header
        className={`h-14 shrink-0 border-b border-game-chrome-border bg-game-chrome px-5 ${className}`}
      >
        <p className="flex h-full items-center text-body text-slate-400">{loadingLabel}</p>
      </header>
    )
  }

  const canRoll = hud.canRoll && !rolling

  return (
    <header
      className={`shrink-0 border-b border-game-chrome-border bg-gradient-to-r from-game-chrome via-[#111827] to-game-chrome text-white ${className}`}
      aria-label="Game status"
    >
      <div className="mx-auto flex min-h-[4.25rem] max-w-[120rem] items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:min-h-[4.5rem] lg:px-6">
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <div className="min-w-0">
            <p className="text-label uppercase text-red-400/90">{brandLabel}</p>
            <h1 className="truncate text-title font-bold tracking-tight text-white lg:text-display-sm">
              {hud.characterName}
            </h1>
            {hud.phase === 'ready_to_roll' && (
              <p className="mt-0.5 hidden text-caption text-slate-400 lg:block">
                A financial life simulation — fun to play, built to teach.
              </p>
            )}
          </div>
          <p className="hidden text-caption text-slate-400 md:block">
            Age {hud.age}
            <span className="mx-2 text-slate-600" aria-hidden>
              ·
            </span>
            Year {hud.boardYear}
          </p>
        </div>

        <div className="hidden items-center gap-6 lg:flex">
          <TurnCounter
            roundNumber={hud.roundNumber}
            maxRounds={hud.maxRounds}
            boardYear={hud.boardYear}
          />
          <TurnIndicator phase={hud.phase} />
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:block">
            <LifeScoreRing score={hud.lifeScore} size={48} strokeWidth={3} />
          </div>
          {onRoll && (
            <motion.button
              type="button"
              disabled={!canRoll}
              onClick={onRoll}
              aria-keyshortcuts="R"
              title={`${rollLabel} (R)`}
              whileHover={!canRoll || reduceMotion ? undefined : { scale: 1.02 }}
              whileTap={!canRoll || reduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: t.fast }}
              className="focus-game-dark inline-flex min-h-touch flex-col items-center justify-center rounded-2xl border border-red-400/40 bg-spike-brand px-6 py-2.5 text-base font-bold tracking-wide text-white shadow-lg shadow-red-950/40 transition hover:bg-spike-brand-hover disabled:opacity-45 lg:px-8"
            >
              <span className="hidden text-[10px] font-normal uppercase tracking-[0.2em] text-red-200/80 sm:block">
                ───────────
              </span>
              <span className="hidden sm:inline">{rolling ? rollingLabel : rollLabel}</span>
              <span className="sm:hidden">{rolling ? '…' : 'Year'}</span>
              <span className="hidden text-[10px] font-normal uppercase tracking-[0.2em] text-red-200/80 sm:block">
                ───────────
              </span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  )
}
