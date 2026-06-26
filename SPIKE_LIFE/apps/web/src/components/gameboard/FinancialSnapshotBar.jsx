export default function FinancialSnapshotBar({ dashboard }) {
  if (!dashboard) return null

  const { lifeScore } = dashboard

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2.5 text-xs md:gap-x-8 md:px-4 md:text-sm">
        <p className="w-full font-semibold text-slate-500 md:w-auto md:shrink-0">Snapshot</p>
        <Metric label="Income" value={dashboard.monthlyIncome.formatted} suffix="/mo" />
        <Metric label="Surplus" value={dashboard.monthlySurplus.formatted} suffix="/mo" accent />
        <Metric label="Life score" value={lifeScore.overall} />
        <Metric label="Protection" value={`${lifeScore.protection}/100`} />
        <Metric label="Retirement" value={`${lifeScore.retirement}/100`} />
        <Metric label="Net worth" value={dashboard.netWorth.formatted} />
        {dashboard.topPriority && (
          <p className="hidden min-w-0 flex-1 truncate text-slate-600 lg:block">
            <span className="font-medium text-slate-800">Priority:</span> {dashboard.topPriority}
          </p>
        )}
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
        {suffix && <span className="text-slate-500 font-normal">{suffix}</span>}
      </dd>
    </div>
  )
}
