import { Heart } from 'lucide-react'

export default function StatusBarV3({
  dashboard,
  dreamProgressPercent = 0,
  onOpenDrawer,
}) {
  return (
    <header className="gsv3-header gsv3-zone-header">
      <div className="min-w-0 shrink-0">
        <p className="gsv3-header-brand">SPIKE LIFE</p>
        <p className="gsv3-header-cycle">{dashboard?.cycleLabel ?? 'Planning cycle'}</p>
      </div>

      <div className="gsv3-header-stats">
        {dashboard?.age != null && <HeaderStat label="Age" value={dashboard.age} />}
        {dashboard?.lifeScore?.overall != null && (
          <HeaderStat
            label="Life Score"
            value={dashboard.lifeScore.overall}
            accent="text-rose-600"
            icon={<Heart className="h-3 w-3 fill-rose-500 text-rose-500" aria-hidden />}
          />
        )}
        {dashboard?.monthlySurplus?.formatted && (
          <HeaderStat label="Cash Flow" value={dashboard.monthlySurplus.formatted} accent="text-emerald-600" />
        )}
        {dashboard?.liquidCash?.formatted && (
          <HeaderStat label="Liquid Cash" value={dashboard.liquidCash.formatted} accent="text-amber-600" className="hidden sm:flex" />
        )}
        {dashboard?.netWorth?.formatted && (
          <HeaderStat label="Net Worth" value={dashboard.netWorth.formatted} accent="text-slate-900" />
        )}
      </div>

      <div className="gsv3-header-actions">
        <button type="button" className="gsv3-header-pill hidden sm:inline-flex" onClick={() => onOpenDrawer?.('stats')}>
          Stats
        </button>
        <button type="button" className="gsv3-header-pill" onClick={() => onOpenDrawer?.('dreams')}>
          Dreams{dreamProgressPercent > 0 ? ` ${dreamProgressPercent}%` : ''}
        </button>
        <button type="button" className="gsv3-header-pill" onClick={() => onOpenDrawer?.('advisor')}>
          Advisor
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
