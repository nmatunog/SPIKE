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
        const dim = scanning && !isScanning && !isSelected

        return (
          <motion.div
            key={domain.id}
            role="listitem"
            className={`gsv2-domain-tile flex flex-col items-center justify-center rounded-xl border px-1 py-2 text-center sm:rounded-2xl sm:py-2.5 ${
              isSelected ? 'gsv2-domain-tile--selected' : isScanning ? 'gsv2-domain-tile--scan' : ''
            } ${dim ? 'opacity-25' : isSelected || isScanning ? 'opacity-100' : 'opacity-55'}`}
            style={{
              '--domain-glow': domain.color,
              borderColor: isSelected ? domain.color : 'rgba(148, 163, 184, 0.45)',
              background: isSelected
                ? `linear-gradient(180deg, ${domain.color}33 0%, #ffffff 100%)`
                : 'rgba(255, 255, 255, 0.85)',
            }}
          >
            <span className="text-base sm:text-lg" aria-hidden>
              {ICONS[domain.icon] ?? '•'}
            </span>
            <span className="mt-0.5 text-[0.55rem] font-bold uppercase leading-tight tracking-wide text-slate-700 sm:text-[0.625rem]">
              {domain.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
