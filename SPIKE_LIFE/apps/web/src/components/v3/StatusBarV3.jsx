export default function StatusBarV3({ dashboard, onOpenDrawer }) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-2 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm font-black tracking-tight text-slate-900">SPIKE LIFE</span>
        <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-slate-400 sm:inline">
          {dashboard?.cycleLabel ?? 'Planning cycle'}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-xs">
        {dashboard?.age != null && (
          <Stat label="Age" value={dashboard.age} />
        )}
        {dashboard?.lifeScore?.overall != null && (
          <Stat label="Life Score" value={dashboard.lifeScore.overall} accent="text-rose-600" />
        )}
        {dashboard?.monthlySurplus?.formatted && (
          <Stat label="Cash Flow" value={dashboard.monthlySurplus.formatted} accent="text-emerald-700" />
        )}
        {dashboard?.netWorth?.formatted && (
          <Stat label="Net Worth" value={dashboard.netWorth.formatted} className="hidden md:flex" />
        )}
      </div>

      <div className="flex shrink-0 gap-1">
        {[
          ['stats', 'Stats'],
          ['dreams', 'Dreams'],
          ['advisor', 'Advisor'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onOpenDrawer?.(id)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 shadow-sm hover:border-slate-300"
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  )
}

function Stat({ label, value, accent = 'text-slate-900', className = '' }) {
  return (
    <div className={`flex flex-col items-end ${className}`}>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`font-bold tabular-nums ${accent}`}>{value}</span>
    </div>
  )
}
