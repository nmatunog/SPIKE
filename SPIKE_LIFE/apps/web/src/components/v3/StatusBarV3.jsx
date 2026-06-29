import { Heart, Menu, Mountain } from 'lucide-react'

export default function StatusBarV3({
  dashboard,
  dreamProgressPercent = 0,
  onOpenDrawer,
}) {
  const lifeScore = dashboard?.lifeScore?.overall

  return (
    <header className="gsv3-header gsv3-zone-header">
      <div className="flex min-w-0 shrink-0 items-center gap-2 pr-2 md:border-r md:border-slate-200 md:pr-3">
        <img
          src="/spike-logo.png"
          alt=""
          className="h-8 w-8 shrink-0 rounded-lg object-contain"
          aria-hidden
        />
        <div className="min-w-0 leading-tight">
          <p className="text-xs font-black tracking-tight text-slate-900 md:text-sm">SPIKE LIFE™</p>
          <p className="hidden text-[9px] font-semibold uppercase tracking-widest text-slate-400 sm:block">
            {dashboard?.cycleLabel ?? 'Planning cycle'}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-0 overflow-x-auto">
        {dashboard?.age != null && (
          <HeaderStat label="Age" value={dashboard.age} />
        )}
        {lifeScore != null && (
          <HeaderStat
            label="Life Score"
            value={lifeScore}
            accent="text-rose-600"
            icon={<Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-hidden />}
          />
        )}
        {dashboard?.monthlySurplus?.formatted && (
          <HeaderStat
            label="Cash Flow"
            value={dashboard.monthlySurplus.formatted}
            accent="text-emerald-600"
          />
        )}
        {dashboard?.liquidCash?.formatted && (
          <HeaderStat
            label="Liquid Cash"
            value={dashboard.liquidCash.formatted}
            accent="text-amber-600"
            className="hidden sm:flex"
          />
        )}
        {dashboard?.netWorth?.formatted && (
          <HeaderStat
            label="Net Worth"
            value={dashboard.netWorth.formatted}
            accent="text-indigo-900"
            className="hidden md:flex"
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="gsv3-dreams-chip">
          <Mountain className="h-4 w-4 text-indigo-500" aria-hidden />
          <div className="min-w-[4.5rem]">
            <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">Dreams</p>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.min(100, dreamProgressPercent)}%` }}
              />
            </div>
            <p className="mt-0.5 text-[9px] font-bold text-slate-600">{dreamProgressPercent}%</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenDrawer?.('advisor')}
          className="gsv3-advisor-chip"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            A
          </span>
          <span className="hidden text-[10px] font-bold uppercase tracking-wide text-slate-600 sm:inline">
            Advisor
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="Online" />
        </button>

        <button
          type="button"
          onClick={() => onOpenDrawer?.('stats')}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

function HeaderStat({ label, value, accent = 'text-slate-900', icon, className = '' }) {
  return (
    <div className={`gsv3-header-stat ${className}`}>
      <span className="gsv3-header-stat__label">{label}</span>
      <span className={`gsv3-header-stat__value flex items-center gap-0.5 ${accent}`}>
        {icon}
        {value}
      </span>
    </div>
  )
}
