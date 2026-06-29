const LIFE_PATH_STYLES = {
  'Wealth Master': 'bg-amber-50 text-amber-700 border-amber-200',
  'Highly Secured': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Balanced: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Average Path': 'bg-blue-50 text-blue-700 border-blue-200',
  'Stressed Path': 'bg-rose-50 text-rose-700 border-rose-200',
}

function lifePathLabel(score) {
  if (score == null) return 'Balanced'
  if (score > 750) return 'Wealth Master'
  if (score > 600) return 'Highly Secured'
  if (score > 400) return 'Average Path'
  return 'Stressed Path'
}

export default function PremiumHeaderStats({
  characterName,
  age,
  turnNumber,
  maxTurns,
  lifeScore,
  netWorth,
  monthlyCashFlow,
  liquidCash,
  financialHealth,
  onOpenSummary,
  onOpenMenu,
}) {
  const path = lifePathLabel(lifeScore)
  const pathClass = LIFE_PATH_STYLES[path] ?? LIFE_PATH_STYLES.Balanced

  return (
    <header className="life-glass-panel mx-2 mt-2 rounded-2xl p-3 md:mx-4 md:p-4">
      <div className="flex flex-wrap items-center gap-3 md:gap-4">
        <div className="flex min-w-0 items-center gap-3 md:border-r md:border-slate-200 md:pr-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-slate-200 text-lg font-bold text-indigo-800 shadow-inner"
            aria-hidden
          >
            {(characterName ?? 'P').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">{characterName ?? 'Player'}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              SPIKE LIFE™
            </p>
          </div>
        </div>

        <MetricCell label="Age" value={age} suffix="/ 60" />
        <MetricCell label="Turn" value={turnNumber} suffix={`/ ${maxTurns ?? 20}`} accent="indigo" />
        <MetricCell label="Life Score" value={lifeScore} badge={path} badgeClass={pathClass} icon="♥" />
        <MetricCell label="Net Worth" value={netWorth} accent="slate" />
        <MetricCell label="Monthly Cash Flow" value={monthlyCashFlow} accent="emerald" />
        <MetricCell label="Liquid Cash" value={liquidCash} accent="amber" />

        {financialHealth && (
          <div className="hidden text-center lg:block lg:border-l lg:border-slate-200 lg:pl-4">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Health
            </span>
            <span className="text-sm font-bold text-slate-800">{financialHealth.label}</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {onOpenSummary && (
            <button
              type="button"
              onClick={onOpenSummary}
              className="focus-game rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              Summary
            </button>
          )}
          {onOpenMenu && (
            <button
              type="button"
              onClick={onOpenMenu}
              className="focus-game rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Menu"
            >
              <span className="text-lg leading-none">☰</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function MetricCell({ label, value, suffix, prefix, accent, badge, badgeClass, icon }) {
  if (value == null && value !== 0) return null

  const valueColors = {
    indigo: 'text-indigo-900',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    slate: 'text-slate-800',
  }

  return (
    <div className="text-center md:border-r md:border-slate-200 md:px-3">
      <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span
        className={`flex items-center justify-center gap-1 text-lg font-black tabular-nums md:text-xl ${valueColors[accent] ?? 'text-slate-800'}`}
      >
        {icon && <span className="text-rose-500">{icon}</span>}
        {prefix}
        {value}
        {suffix && <span className="text-xs font-normal text-slate-400">{suffix}</span>}
      </span>
      {badge && (
        <span className={`mt-0.5 inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${badgeClass}`}>
          {badge}
        </span>
      )}
    </div>
  )
}
