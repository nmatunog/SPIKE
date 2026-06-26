const LENSES = [
  { id: 'life', label: 'Life' },
  { id: 'plan', label: 'Plan' },
  { id: 'protect', label: 'Protect' },
  { id: 'grow', label: 'Grow' },
  { id: 'journey', label: 'Journey' },
]

export default function LensNav({ activeLens, onChange, compact = false }) {
  return (
    <nav
      className={
        compact
          ? 'fixed bottom-0 inset-x-0 z-20 flex border-t border-slate-200 bg-white/95 backdrop-blur md:hidden'
          : 'hidden md:flex md:flex-col md:gap-1 md:w-44 md:shrink-0'
      }
      aria-label="Five lenses"
    >
      {LENSES.map((lens) => {
        const active = activeLens === lens.id
        return (
          <button
            key={lens.id}
            type="button"
            onClick={() => onChange(lens.id)}
            className={
              compact
                ? `flex-1 py-3 text-xs font-medium transition-colors ${
                    active
                      ? 'text-[#8B0000] border-t-2 border-[#8B0000] -mt-px'
                      : 'text-slate-500'
                  }`
                : `rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#8B0000] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
            }
          >
            {lens.label}
          </button>
        )
      })}
    </nav>
  )
}

export { LENSES }
