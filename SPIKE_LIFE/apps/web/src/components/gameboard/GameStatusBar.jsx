import CycleBadge from './CycleBadge.jsx'

const BAND_COLORS = {
  excellent: 'bg-emerald-500',
  good: 'bg-lime-500',
  stable: 'bg-amber-400',
  vulnerable: 'bg-orange-500',
  critical: 'bg-red-500',
}

export default function GameStatusBar({
  age,
  cashFlow,
  cash,
  netWorth,
  lifeScore,
  year,
  financialHealth,
  cycleLabel,
  turnNumber,
  maxTurns,
}) {
  if (age == null && lifeScore == null && !cycleLabel) return null

  const bandClass = BAND_COLORS[financialHealth?.band] ?? BAND_COLORS.stable

  return (
    <div className="flex flex-wrap items-center gap-3">
      {cycleLabel && turnNumber != null && maxTurns != null && (
        <CycleBadge
          cycleLabel={cycleLabel}
          turnNumber={turnNumber}
          maxTurns={maxTurns}
        />
      )}
      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-slate-900 px-4 py-2 text-xs text-slate-100 shadow-sm">
        {age != null && (
          <Stat label="Age" value={age} />
        )}
        {cashFlow && (
          <Stat label="Cash flow" value={cashFlow} />
        )}
        {cash && (
          <Stat label="Cash" value={cash} />
        )}
        {netWorth && (
          <Stat label="Net worth" value={netWorth} />
        )}
        {lifeScore != null && (
          <Stat label="Life Score™" value={lifeScore} accent />
        )}
        {year != null && (
          <Stat label="Year" value={year} />
        )}
        {financialHealth && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Health</span>
            <span className={`inline-block h-2 w-2 rounded-full ${bandClass}`} aria-hidden />
            <span className="font-medium">{financialHealth.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent = false }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold tabular-nums ${accent ? 'text-red-200' : ''}`}>
        {value}
      </span>
    </div>
  )
}
