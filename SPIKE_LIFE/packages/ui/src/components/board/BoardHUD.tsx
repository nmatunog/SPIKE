import type { BoardHUDProps } from '../../types/component-props.js'
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
  rollLabel = 'Roll dice',
  rollingLabel = 'Rolling…',
}: BoardHUDProps) {
  if (!hud) {
    return (
      <header className={`h-12 shrink-0 border-b border-slate-800 bg-slate-950 px-4 ${className}`}>
        <p className="flex h-full items-center text-sm text-slate-400">{loadingLabel}</p>
      </header>
    )
  }

  const canRoll = hud.canRoll && !rolling

  return (
    <header
      className={`h-14 shrink-0 border-b border-slate-800/90 bg-slate-950 text-white ${className}`}
      aria-label="Game status"
    >
      <div className="mx-auto flex h-full max-w-[100rem] items-center justify-between gap-4 px-4 lg:px-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-400">{brandLabel}</p>
            <h1 className="truncate text-lg font-semibold tracking-tight lg:text-xl">{hud.characterName}</h1>
          </div>
          <p className="hidden text-sm text-slate-400 sm:block">
            Age {hud.age} · Year {hud.boardYear}
          </p>
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          <TurnCounter
            roundNumber={hud.roundNumber}
            maxRounds={hud.maxRounds}
            boardYear={hud.boardYear}
          />
          <TurnIndicator phase={hud.phase} />
        </div>

        <div className="flex items-center gap-3">
          <LifeScoreRing score={hud.lifeScore} size={44} strokeWidth={3} />
          <div
            className="hidden h-11 w-11 items-center justify-center rounded-xl border border-slate-600 bg-slate-800/80 text-lg font-bold md:flex"
            aria-label="Dice value"
          >
            {rolling ? '…' : (hud.lastDiceRoll ?? '—')}
          </div>
          {onRoll && (
            <button
              type="button"
              disabled={!canRoll}
              onClick={onRoll}
              className="rounded-xl bg-[#8B0000] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-red-950/30 transition hover:bg-[#a50000] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-40"
            >
              {rolling ? rollingLabel : rollLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
