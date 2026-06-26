export default function FinancialSnapshotBar({ dashboard, onOpenProtect, onOpenGrow }) {
  if (!dashboard) return null

  const { lifeScore } = dashboard

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 text-xs md:gap-x-6 md:px-4 md:text-sm">
        <p className="w-full font-semibold text-slate-500 md:w-auto md:shrink-0">Snapshot</p>
        <Metric label="Income" value={dashboard.monthlyIncome.formatted} suffix="/mo" />
        <Metric label="Surplus" value={dashboard.monthlySurplus.formatted} suffix="/mo" accent />
        <Metric label="Life score" value={lifeScore.overall} />
        <Metric label="Protection" value={`${lifeScore.protection}/100`} />
        <Metric label="Goals" value={`${lifeScore.goals}/100`} />
        <Metric label="Net worth" value={dashboard.netWorth.formatted} />
        <div className="ml-auto flex flex-wrap gap-2">
          {onOpenProtect && (
            <button
              type="button"
              onClick={onOpenProtect}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 md:text-xs"
            >
              Protect ↗
            </button>
          )}
          {onOpenGrow && (
            <button
              type="button"
              onClick={onOpenGrow}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 md:text-xs"
            >
              Grow ↗
            </button>
          )}
        </div>
      </div>
    </footer>
  )
}

function Metric({ label, value, suffix = '', accent = false }) {
  return (
    <div className="shrink-0">
      <dt className="text-[10px] uppercase tracking-wide text-slate-400 md:text-xs">{label}</dt>
      <dd className={`font-semibold ${accent ? 'text-emerald-700' : 'text-slate-900'}`}>
        {value}
        {suffix && <span className="font-normal text-slate-500">{suffix}</span>}
      </dd>
    </div>
  )
}
