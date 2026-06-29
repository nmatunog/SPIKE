/** Premium 2D vector-style hero placeholders — replace with Storyset SVGs per domain. */

const SCENES = {
  career: (
    <>
      <rect x="28" y="88" width="84" height="52" rx="6" fill="#1D4ED8" opacity="0.15" />
      <circle cx="70" cy="62" r="18" fill="#FCD34D" />
      <path d="M52 118h36v24H52z" fill="#2563EB" />
      <rect x="88" y="96" width="28" height="20" rx="3" fill="#93C5FD" />
    </>
  ),
  business: (
    <>
      <rect x="24" y="72" width="92" height="56" rx="8" fill="#FB923C" opacity="0.25" />
      <rect x="40" y="88" width="60" height="32" rx="4" fill="#FF8C42" />
      <path d="M52 72 L70 52 L88 72 Z" fill="#FDBA74" />
    </>
  ),
  income_finance: (
    <>
      <circle cx="70" cy="78" r="32" fill="#FDE68A" opacity="0.5" />
      <text x="70" y="86" textAnchor="middle" fontSize="28" fill="#B45309" fontWeight="bold">
        ₱
      </text>
      <rect x="44" y="108" width="52" height="8" rx="4" fill="#F59E0B" />
    </>
  ),
  family: (
    <>
      <path d="M30 120 L70 60 L110 120 Z" fill="#C4B5FD" opacity="0.4" />
      <circle cx="52" cy="98" r="10" fill="#A855F7" />
      <circle cx="70" cy="90" r="12" fill="#7C3AED" />
      <circle cx="88" cy="98" r="10" fill="#A855F7" />
    </>
  ),
  health: (
    <>
      <path
        d="M70 118 C70 118 42 92 42 72 C42 58 54 48 70 62 C86 48 98 58 98 72 C98 92 70 118 70 118Z"
        fill="#FF6B6B"
        opacity="0.85"
      />
      <rect x="64" y="52" width="12" height="28" rx="6" fill="#FDA4AF" />
      <circle cx="70" cy="48" r="8" fill="#FDA4AF" />
    </>
  ),
  housing: (
    <>
      <rect x="36" y="88" width="68" height="44" rx="4" fill="#5EEAD4" />
      <path d="M32 88 L70 48 L108 88 Z" fill="#14B8A6" />
      <rect x="58" y="104" width="24" height="28" rx="2" fill="#0F766E" opacity="0.5" />
    </>
  ),
  education: (
    <>
      <rect x="38" y="96" width="64" height="12" rx="2" fill="#38BDF8" />
      <rect x="42" y="108" width="56" height="10" rx="2" fill="#7DD3FC" />
      <path d="M48 96 L70 68 L92 96 Z" fill="#0EA5E9" />
      <circle cx="70" cy="64" r="6" fill="#FDE047" />
    </>
  ),
  lifestyle: (
    <>
      <circle cx="52" cy="100" r="14" fill="#F9A8D4" />
      <circle cx="88" cy="100" r="14" fill="#F472B6" />
      <rect x="44" y="72" width="52" height="20" rx="10" fill="#EC4899" opacity="0.6" />
    </>
  ),
  community: (
    <>
      <ellipse cx="70" cy="112" rx="40" ry="12" fill="#86EFAC" opacity="0.5" />
      <circle cx="52" cy="88" r="12" fill="#22C55E" />
      <circle cx="88" cy="88" r="12" fill="#16A34A" />
      <rect x="62" y="76" width="16" height="24" rx="3" fill="#4ADE80" />
    </>
  ),
  government: (
    <>
      <rect x="48" y="56" width="44" height="64" rx="4" fill="#94A3B8" />
      <path d="M40 56 H100 V64 H40 Z" fill="#64748B" />
      <rect x="58" y="72" width="8" height="40" fill="#CBD5E1" />
      <rect x="74" y="72" width="8" height="40" fill="#CBD5E1" />
    </>
  ),
  investment: (
    <>
      <path d="M32 112 L52 80 L68 96 L88 64 L108 112 Z" fill="#EAB308" opacity="0.35" />
      <path d="M32 112 L52 80 L68 96 L88 64" stroke="#CA8A04" strokeWidth="3" fill="none" />
    </>
  ),
  milestone: (
    <>
      <circle cx="70" cy="78" r="28" fill="#F0ABFC" opacity="0.5" />
      <path d="M70 52 L78 72 L100 74 L82 88 L88 110 L70 98 L52 110 L58 88 L40 74 L62 72 Z" fill="#D946EF" />
    </>
  ),
  chance: (
    <>
      <rect x="44" y="64" width="52" height="52" rx="10" fill="#FDE047" />
      <circle cx="58" cy="78" r="5" fill="#1E293B" />
      <circle cx="82" cy="78" r="5" fill="#1E293B" />
      <circle cx="70" cy="96" r="5" fill="#1E293B" />
    </>
  ),
}

export default function DomainHeroSvg({ domainId = 'career', className = '' }) {
  return (
    <svg
      viewBox="0 0 140 140"
      className={className}
      aria-hidden
      role="img"
    >
      {SCENES[domainId] ?? SCENES.career}
    </svg>
  )
}
