import { motion } from 'framer-motion'

const ICONS = {
  briefcase: '💼',
  wallet: '💰',
  'chart-line': '📈',
  sparkles: '✨',
  users: '👨‍👩‍👧',
  'heart-pulse': '❤️',
  'trending-up': '📈',
  'shopping-bag': '🛍️',
  home: '🏠',
  'graduation-cap': '🎓',
  landmark: '🏛️',
  'hand-heart': '🤝',
  'dice-5': '🎲',
  trophy: '🏆',
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized
  const int = Number.parseInt(value, 16)
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  }
}

function isLightTileColor(hex) {
  const { r, g, b } = hexToRgb(hex)
  const luminance = (r * 299 + g * 587 + b * 114) / 1000
  return luminance > 168
}

function tileBackground(color, active) {
  const { r, g, b } = hexToRgb(color)
  const top = active ? 1 : 0.92
  const bottom = active ? 0.78 : 0.68
  return `linear-gradient(160deg, rgba(${r},${g},${b},${top}) 0%, rgba(${r},${g},${b},${bottom}) 100%)`
}

export default function DomainBoard({
  domains = [],
  selectedDomainId = null,
  scanHighlightId = null,
  scanning = false,
  compact = false,
}) {
  if (!domains.length) return null

  return (
    <div
      className={`grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-12 ${
        compact ? 'px-2' : 'px-3'
      }`}
      role="list"
      aria-label="Life domain board"
      aria-busy={scanning}
    >
      {domains.map((domain) => {
        const isSelected = selectedDomainId === domain.id
        const isScanning = scanning && scanHighlightId === domain.id
        const active = isSelected || isScanning
        const dim = scanning && !active
        const lightText = !isLightTileColor(domain.color)

        return (
          <motion.div
            key={domain.id}
            role="listitem"
            className={`gsv2-domain-tile flex flex-col items-center justify-center rounded-xl border-2 px-1 py-2 text-center shadow-sm sm:rounded-2xl sm:py-2.5 ${
              active ? 'gsv2-domain-tile--selected' : isScanning ? 'gsv2-domain-tile--scan' : ''
            } ${dim ? 'opacity-30 saturate-50' : 'opacity-100'}`}
            style={{
              '--domain-glow': domain.color,
              borderColor: active ? '#ffffff' : `${domain.color}99`,
              background: tileBackground(domain.color, active),
              boxShadow: active
                ? `0 10px 28px ${domain.color}55, 0 0 0 2px ${domain.color}33`
                : `0 3px 10px ${domain.color}33`,
            }}
          >
            <span className="text-base drop-shadow-sm sm:text-lg" aria-hidden>
              {ICONS[domain.icon] ?? '•'}
            </span>
            <span
              className={`mt-0.5 text-[0.55rem] font-extrabold uppercase leading-tight tracking-wide sm:text-[0.625rem] ${
                lightText ? 'text-white drop-shadow-sm' : 'text-slate-900'
              }`}
            >
              {domain.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
