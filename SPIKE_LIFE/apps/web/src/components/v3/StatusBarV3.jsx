import { Heart, Menu, Mountain, UserRound } from 'lucide-react'

export default function StatusBarV3({
  dashboard,
  dreamProgressPercent = 0,
  onOpenDrawer,
}) {
  const progress = Math.min(100, Math.max(0, dreamProgressPercent))

  return (
    <header className="gsv3-header gsv3-zone-header">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <linearGradient id="gsv3-heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      <div className="gsv3-header-brand">
        <SpikeMark className="gsv3-header-logo" />
        <span className="gsv3-header-brand__text">SPIKE LIFE™</span>
      </div>

      <div className="gsv3-header-stats" role="group" aria-label="Player stats">
        {dashboard?.age != null && (
          <HeaderStat label="Age" value={dashboard.age} accent="navy" />
        )}
        {dashboard?.lifeScore?.overall != null && (
          <HeaderStat
            label="Life Score"
            value={dashboard.lifeScore.overall}
            accent="navy"
            icon={<Heart className="gsv3-header-heart" aria-hidden strokeWidth={0} />}
          />
        )}
        {dashboard?.monthlySurplus?.formatted && (
          <HeaderStat
            label="Cash Flow"
            value={dashboard.monthlySurplus.formatted}
            accent="teal"
          />
        )}
        {dashboard?.liquidCash?.formatted && (
          <HeaderStat
            label="Liquid Cash"
            value={dashboard.liquidCash.formatted}
            accent="amber"
          />
        )}
        {dashboard?.netWorth?.formatted && (
          <HeaderStat
            label="Net Worth"
            value={dashboard.netWorth.formatted}
            accent="navy"
          />
        )}
      </div>

      <div className="gsv3-header-actions">
        <button
          type="button"
          className="gsv3-header-dreams"
          onClick={() => onOpenDrawer?.('dreams')}
        >
          <Mountain className="gsv3-header-dreams__icon" aria-hidden strokeWidth={2.25} />
          <div className="gsv3-header-dreams__copy">
            <span className="gsv3-header-dreams__label">Dreams</span>
            <div className="gsv3-header-dreams__track" aria-hidden>
              <div
                className="gsv3-header-dreams__fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="gsv3-header-dreams__pct">{progress}%</span>
          </div>
        </button>

        <button
          type="button"
          className="gsv3-header-advisor"
          onClick={() => onOpenDrawer?.('advisor')}
        >
          <UserRound className="gsv3-header-advisor__glyph" aria-hidden strokeWidth={2} />
          <span className="gsv3-header-advisor__label">Advisor</span>
          <span className="gsv3-header-advisor__avatar" aria-hidden>
            <span className="gsv3-header-advisor__initial">A</span>
            <span className="gsv3-header-advisor__online" />
          </span>
        </button>

        <button
          type="button"
          className="gsv3-header-menu"
          onClick={() => onOpenDrawer?.('stats')}
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
    </header>
  )
}

const ACCENT_CLASS = {
  navy: 'gsv3-header-stat__value--navy',
  teal: 'gsv3-header-stat__value--teal',
  amber: 'gsv3-header-stat__value--amber',
}

function HeaderStat({ label, value, accent = 'navy', icon }) {
  return (
    <div className="gsv3-header-stat">
      <span className="gsv3-header-stat__label">{label}</span>
      <span className={`gsv3-header-stat__value ${ACCENT_CLASS[accent] ?? ACCENT_CLASS.navy}`}>
        {icon}
        {value}
      </span>
    </div>
  )
}

function SpikeMark({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        fill="#dc2626"
        d="M16 1.5 18.2 12.8 29.5 15 18.2 17.2 16 28.5 13.8 17.2 2.5 15 13.8 12.8Z"
      />
      <path
        fill="#dc2626"
        d="M15 2.5h2v11h11v2H17v11h-2V15.5H4v-2h11V2.5z"
      />
    </svg>
  )
}
