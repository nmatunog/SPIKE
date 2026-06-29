const DOMAIN_META = [
  { id: 'career', label: 'Career', icon: '💼', gradient: 'from-blue-500 to-blue-600 border-blue-400' },
  { id: 'opportunity', label: 'Opportunity', icon: '💡', gradient: 'from-emerald-500 to-emerald-600 border-emerald-400' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧', gradient: 'from-purple-500 to-purple-600 border-purple-400' },
  { id: 'health', label: 'Health', icon: '❤️', gradient: 'from-red-500 to-red-600 border-red-400' },
  { id: 'business', label: 'Business', icon: '📈', gradient: 'from-orange-500 to-orange-600 border-orange-400' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🛍️', gradient: 'from-amber-500 to-amber-600 border-amber-400' },
  { id: 'housing', label: 'Housing', icon: '🏠', gradient: 'from-teal-500 to-teal-600 border-teal-400' },
  { id: 'education', label: 'Education', icon: '🎓', gradient: 'from-sky-500 to-sky-600 border-sky-400' },
  { id: 'government', label: 'Government', icon: '🏛️', gradient: 'from-slate-500 to-slate-600 border-slate-400' },
  { id: 'community', label: 'Community', icon: '🤝', gradient: 'from-indigo-500 to-indigo-600 border-indigo-400' },
  { id: 'chance', label: 'Chance', icon: '🎲', gradient: 'from-yellow-500 to-yellow-600 border-yellow-400' },
  { id: 'milestone', label: 'Milestone', icon: '🏆', gradient: 'from-pink-500 to-pink-600 border-pink-400' },
]

export default function PremiumDomainRibbon({
  domains = [],
  selectedDomainId,
  scanning = false,
  scanHighlightId = null,
}) {
  const domainMap = Object.fromEntries(domains.map((d) => [d.id, d]))

  return (
    <section className="grid grid-cols-4 gap-1.5 px-2 sm:grid-cols-6 lg:grid-cols-12 lg:px-4">
      {DOMAIN_META.map((meta) => {
        const live = domainMap[meta.id]
        const isSelected = selectedDomainId === meta.id
        const isScanning = scanning && scanHighlightId === meta.id
        const inactive = !isSelected && !isScanning

        return (
          <div
            key={meta.id}
            id={`domain-${meta.id}`}
            className={`life-domain-chip flex flex-col items-center justify-center rounded-xl border bg-gradient-to-b p-2 shadow-sm transition ${
              meta.gradient
            } ${
              isSelected
                ? 'life-domain-chip-active scale-105 ring-4 ring-indigo-400'
                : isScanning
                  ? 'life-domain-chip-blink opacity-100'
                  : inactive
                    ? 'opacity-50'
                    : ''
            }`}
          >
            <span className="text-lg md:text-xl" aria-hidden>
              {live?.icon ?? meta.icon}
            </span>
            <span
              className={`text-[8px] font-bold uppercase tracking-wider md:text-[10px] ${
                meta.id === 'chance' ? 'text-slate-950' : 'text-white'
              }`}
            >
              {live?.label ?? meta.label}
            </span>
          </div>
        )
      })}
    </section>
  )
}

export { DOMAIN_META }
