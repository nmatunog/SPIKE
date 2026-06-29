const MARKERS = ['A', 'B', 'C', 'D']
const THEMES = [
  { ring: 'border-emerald-400 ring-emerald-400', marker: 'bg-emerald-500', impact: 'bg-emerald-50 text-emerald-700' },
  { ring: 'border-blue-400 ring-blue-400', marker: 'bg-blue-500', impact: 'bg-blue-50 text-blue-700' },
  { ring: 'border-violet-400 ring-violet-400', marker: 'bg-violet-500', impact: 'bg-violet-50 text-violet-700' },
  { ring: 'border-amber-400 ring-amber-400', marker: 'bg-amber-500', impact: 'bg-amber-50 text-amber-700' },
]

function formatImpact(opt) {
  if (opt.outcomePreview) {
    return `Impact: ${opt.outcomePreview}`
  }
  if (opt.costLabel) {
    return `Impact: ${opt.costLabel}`
  }
  return null
}

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
      <h2 className="mb-1 shrink-0 text-center text-[10px] font-extrabold uppercase tracking-[0.28em] text-slate-500">
        Choose one response
      </h2>

      {error && (
        <p className="mb-1 shrink-0 rounded-lg bg-red-50 px-3 py-1 text-center text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="gsv3-choice-grid min-h-0 flex-1">
        {options.map((opt, index) => {
          const selected = selectedIndex === index
          const theme = THEMES[index % THEMES.length]
          const impact = formatImpact(opt)

          return (
            <button
              key={opt.strategy}
              type="button"
              disabled={!canDecide || deciding}
              onClick={() => {
                onSelect?.(index)
                if (canDecide && !deciding) onConfirm?.(index)
              }}
              className={`gsv3-decision-card border-slate-200 ${
                selected ? `gsv3-decision-card--selected ${theme.ring}` : ''
              } disabled:opacity-45`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${theme.marker}`}
                >
                  {MARKERS[index]}
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-bold leading-snug text-slate-900 md:text-xs">
                    {opt.label}
                  </p>
                  {opt.description && (
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">
                      {opt.description}
                    </p>
                  )}
                </div>
              </div>
              {impact && (
                <p className={`gsv3-decision-card__impact ${theme.impact}`}>{impact}</p>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
