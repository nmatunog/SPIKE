const LENSES = [
  { id: 'life', label: 'Life' },
  { id: 'plan', label: 'Plan' },
  { id: 'protect', label: 'Protect' },
  { id: 'grow', label: 'Grow' },
  { id: 'journey', label: 'Journey' },
]

export default function LensNav({ activeLens, onChange, compact = false, horizontal = false }) {
  const navClass = horizontal
    ? 'flex flex-wrap gap-1'
    : compact
      ? 'fixed bottom-0 inset-x-0 z-20 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden'
      : 'hidden md:flex md:flex-col md:gap-1 md:w-44 md:shrink-0'

  return (
    <nav className={navClass} aria-label="Five lenses">
      {LENSES.map((lens) => {
        const active = activeLens === lens.id
        const horizontalClass = `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          active ? 'bg-[#8B0000] text-white' : 'text-slate-600 hover:bg-slate-100'
        }`
        const compactClass = `flex-1 py-3 text-xs font-medium transition-colors ${
          active
            ? 'text-[#8B0000] border-t-2 border-[#8B0000] -mt-px'
            : 'text-slate-500'
        }`
        const defaultClass = `rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
          active ? 'bg-[#8B0000] text-white' : 'text-slate-600 hover:bg-slate-100'
        }`

        return (
          <button
            key={lens.id}
            type="button"
            onClick={() => onChange(lens.id)}
            className={horizontal ? horizontalClass : compact ? compactClass : defaultClass}
          >
            {lens.label}
          </button>
        )
      })}
    </nav>
  )
}

export { LENSES }
