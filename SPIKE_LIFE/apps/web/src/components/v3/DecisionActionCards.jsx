const MARKERS = ['A', 'B', 'C', 'D', 'E', 'F']

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
  const many = options.length > 4
  const selected = options[selectedIndex]

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Choose one response">
      <h2 className="gsv3-choice-heading">How to decide</h2>
      <p className="mb-2 shrink-0 text-center text-xs leading-relaxed text-slate-600">
        Read the situation above. Pick the response you would take in real life, then confirm.
        There is no perfect answer — learn from what changes.
      </p>

      {error && (
        <p className="mb-1.5 shrink-0 text-center text-sm text-red-600">{error}</p>
      )}

      {options.length === 0 && (
        <p className="flex flex-1 items-center justify-center text-sm text-slate-500">
          Loading decision options…
        </p>
      )}

      <div className={`gsv3-choice-row ${many ? 'gsv3-choice-row--grid' : ''}`}>
        {options.map((opt, index) => {
          const isSelected = selectedIndex === index
          const theme = THEMES[index % THEMES.length]
          const marker = MARKERS[index] ?? String(index + 1)

          return (
            <button
              key={opt.strategy}
              type="button"
              disabled={!canDecide || deciding}
              onClick={() => onSelect?.(index)}
              className={`gsv3-choice-btn border-slate-200 ${
                isSelected ? `gsv3-choice-btn--selected ${theme.ring}` : ''
              } disabled:opacity-40`}
            >
              <span className={`gsv3-choice-marker ${theme.marker}`}>{marker}</span>
              <span className="gsv3-choice-label">{opt.label}</span>
              {opt.description && (
                <span className="mt-1 line-clamp-2 text-[10px] font-normal leading-snug text-slate-500">
                  {opt.description}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {options.length > 0 && (
        <button
          type="button"
          disabled={!canDecide || deciding || !selected}
          onClick={() => onConfirm?.(selectedIndex)}
          className="mt-2 shrink-0 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-md disabled:opacity-40"
        >
          {deciding ? 'Recording…' : `Confirm: ${selected?.label ?? 'your choice'}`}
        </button>
      )}
    </section>
  )
}
