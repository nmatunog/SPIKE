import { resolveDomainIdentity } from '../../illustrations/domain-identity.js'
import DomainHeroSvg from '../../illustrations/DomainHeroSvg.jsx'
import DomainIcon from '../../illustrations/DomainIcon.jsx'

function WinnerParticles({ color }) {
  return (
    <div className="gsv3-particles" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="gsv3-particle"
          style={{
            left: `${12 + i * 10}%`,
            bottom: `${20 + (i % 3) * 12}%`,
            background: color,
            animationDelay: `${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function DomainTile({
  domain,
  state = 'idle',
  onClick,
}) {
  const identity = resolveDomainIdentity(domain.id, domain.label)
  const isWinner = state === 'winner'
  const isScan = state === 'scan'
  const isDimmed = state === 'dimmed'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`gsv3-domain-tile ${
        isWinner
          ? 'gsv3-domain-tile--winner'
          : isScan
            ? 'gsv3-domain-tile--scan'
            : isDimmed
              ? 'gsv3-domain-tile--dimmed'
              : 'gsv3-domain-tile--idle'
      }`}
      style={{
        '--domain-glow': identity.glow,
        '--domain-color': identity.color,
        borderColor: isWinner ? identity.color : `${identity.color}55`,
      }}
    >
      {isWinner && <WinnerParticles color={identity.color} />}
      <div className="gsv3-domain-tile__header">
        <span
          className="gsv3-domain-tile__badge"
          style={{ backgroundColor: identity.color }}
        >
          <DomainIcon name={domain.icon} className="h-4 w-4 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-extrabold uppercase tracking-wide" style={{ color: identity.color }}>
          {domain.label}
        </p>
        {identity.subtitle && (
          <p className="truncate text-[9px] font-medium text-slate-500">{identity.subtitle}</p>
        )}
        </div>
      </div>
      <div className="gsv3-domain-tile__art">
        <DomainHeroSvg domainId={domain.id} className="gsv3-domain-tile__hero" />
      </div>
    </button>
  )
}
