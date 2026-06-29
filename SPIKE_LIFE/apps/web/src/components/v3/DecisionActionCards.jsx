const MARKERS = ['A', 'B', 'C', 'D']
const THEMES = [
  { ring: 'ring-emerald-500 border-emerald-400', marker: 'bg-emerald-500' },
  { ring: 'ring-blue-500 border-blue-400', marker: 'bg-blue-500' },
  { ring: 'ring-violet-500 border-violet-400', marker: 'bg-violet-500' },
  { ring: 'ring-amber-500 border-amber-400', marker: 'bg-amber-500' },
]

export default function DecisionActionCards({
  options = [],
  selectedIndex = 0,
  onSelect,
  onConfirm,
  canDecide,
  deciding,
  error,
}) {
  return (
    <section className="flex h-full flex-col" aria-label="Choose one response">
      <h2 className="gsv3-choice-heading">Choose one response</h2>

      {error && (
        <p className="mb-1.5 shrink-0 text-center text-sm text-red-600">{error}</p>
      )}

      <div className="gsv3-choice-row">
        {options.map((opt, index) => {
          const selected = selectedIndex === index
          const theme = THEMES[index % THEMES.length]

          return (
            <button
              key={opt.strategy}
              type="button"
              disabled={!canDecide || deciding}
              onClick={() => {
                onSelect?.(index)
                if (canDecide && !deciding) onConfirm?.(index)
              }}
              className={`gsv3-choice-btn border-slate-200 ${
                selected ? `gsv3-choice-btn--selected ${theme.ring}` : ''
              } disabled:opacity-40`}
            >
              <span className={`gsv3-choice-marker ${theme.marker}`}>{MARKERS[index]}</span>
              <span className="gsv3-choice-label">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
