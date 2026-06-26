import LifeScoreRing from './LifeScoreRing.jsx'

export default function GameTopBar({
  dashboard,
  board,
  onRoll,
  rolling,
}) {
  if (!dashboard) {
    return (
      <header className="border-b border-slate-800 bg-slate-900 px-4 py-2.5">
        <p className="text-sm text-slate-400">Loading…</p>
      </header>
    )
  }

  const canRoll = board?.canRoll && !rolling
  const diceValue = board?.lastDiceRoll

  return (
    <header className="border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3 px-3 py-2 md:px-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
            SPIKE LIFE™
          </p>
          <h1 className="truncate text-sm font-semibold md:text-base">{dashboard.characterName}</h1>
          <p className="text-[11px] text-slate-400">
            Year {board?.boardYear ?? dashboard.simulationYear} · Age {dashboard.age} · Turn{' '}
            {board?.roundNumber ?? dashboard.turnNumber} of {board?.maxRounds ?? dashboard.maxTurns}
          </p>
        </div>

        <dl className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-xs lg:flex lg:gap-x-5 lg:text-sm">
          <div>
            <dt className="text-slate-400">Net worth</dt>
            <dd className="font-semibold">{dashboard.netWorth.formatted}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Cash flow</dt>
            <dd className="font-semibold text-emerald-400">{dashboard.monthlySurplus.formatted}/mo</dd>
          </div>
          <div>
            <dt className="text-slate-400">Protection</dt>
            <dd className="font-semibold">{dashboard.lifeScore.protection}/100</dd>
          </div>
          <div>
            <dt className="text-slate-400">Goals</dt>
            <dd className="font-semibold">{dashboard.lifeScore.goals}/100</dd>
          </div>
        </dl>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LifeScoreRing score={dashboard.lifeScore.overall} size={44} strokeWidth={3} compact />
          </div>
          <div
            className={`hidden h-11 w-11 items-center justify-center rounded-xl border-2 text-lg font-bold sm:flex ${
              rolling
                ? 'animate-pulse border-red-400 text-red-300'
                : 'border-slate-600 bg-slate-800 text-white'
            }`}
            aria-label="Dice value"
          >
            {rolling ? '…' : diceValue ?? '—'}
          </div>
          <button
            type="button"
            disabled={!canRoll}
            onClick={onRoll}
            className="rounded-xl bg-[#8B0000] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg hover:bg-[#a50000] disabled:cursor-not-allowed disabled:opacity-40 md:px-5"
          >
            {rolling ? 'Rolling…' : 'Roll dice'}
          </button>
        </div>
      </div>
    </header>
  )
}
