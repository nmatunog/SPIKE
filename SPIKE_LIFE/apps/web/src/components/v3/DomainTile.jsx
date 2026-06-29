import { resolveDomainIdentity } from '../../illustrations/domain-identity.js'
import DomainHeroSvg from '../../illustrations/DomainHeroSvg.jsx'

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
        borderColor: isWinner ? '#ffffff' : `${identity.color}88`,
        background: `linear-gradient(180deg, ${identity.color} 0%, ${identity.color}cc 55%, ${identity.color}99 100%)`,
      }}
    >
      {isWinner && <WinnerParticles color={identity.color} />}
      <div className="px-3 pt-3 text-left">
        <span className="text-lg" aria-hidden>
          {domain.icon === 'briefcase' ? '💼' : '✨'}
        </span>
        <p className="mt-1 text-sm font-extrabold uppercase tracking-wide text-white drop-shadow-sm">
          {domain.label}
        </p>
        {identity.subtitle && (
          <p className="text-[10px] font-medium text-white/80">{identity.subtitle}</p>
        )}
      </div>
      <div className="gsv3-domain-tile__art">
        <DomainHeroSvg domainId={domain.id} className="gsv3-domain-tile__hero" />
      </div>
    </button>
  )
}
