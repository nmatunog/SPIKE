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
  brandLabel = 'SPIKE LIFE™',
  loadingLabel = 'Loading game…',
  rollLabel = 'Roll',
  rollingLabel = 'Rolling…',
}: BoardHUDProps) {
  if (!hud) {
    return (
      <header className={`border-b border-slate-800 bg-slate-900 px-4 py-3 ${className}`}>
        <p className="text-sm text-slate-400">{loadingLabel}</p>
      </header>
    )
  }

  const canRoll = hud.canRoll && !rolling

  return (
    <header
      className={`shrink-0 border-b border-slate-800 bg-slate-900 text-white ${className}`}
      style={{ minHeight: '10dvh' }}
      aria-label="Game status"
    >
      <div className="mx-auto flex h-full max-w-[100rem] flex-wrap items-center justify-between gap-3 px-4 py-2.5 lg:px-6">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">{brandLabel}</p>
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
          <div
            className="hidden h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-600 bg-slate-800 text-lg font-bold sm:flex"
            aria-label="Dice value"
          >
            {rolling ? '…' : (hud.lastDiceRoll ?? '—')}
          </div>
          {onRoll && (
            <button
              type="button"
              disabled={!canRoll}
              onClick={onRoll}
              className="rounded-2xl bg-[#8B0000] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg hover:bg-[#a50000] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-40"
            >
              {rolling ? rollingLabel : rollLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
