const MARKERS = ['A', 'B', 'C', 'D']
const RINGS = [
  'border-emerald-400 ring-emerald-400',
  'border-blue-400 ring-blue-400',
  'border-violet-400 ring-violet-400',
  'border-amber-400 ring-amber-400',
]
const MARKER_BG = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500']

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
    <section className="mx-auto w-full max-w-5xl px-4 pb-2" aria-label="Choose one response">
      <h2 className="mb-3 text-center text-[11px] font-extrabold uppercase tracking-[0.3em] text-slate-500">
        Choose one response
      </h2>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-center text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((opt, index) => {
          const selected = selectedIndex === index
          return (
            <button
              key={opt.strategy}
              type="button"
              disabled={!canDecide || deciding}
              onClick={() => onSelect?.(index)}
              className={`gsv3-decision-card border-slate-200 ${
                selected ? `gsv3-decision-card--selected ${RINGS[index % RINGS.length]}` : ''
              } disabled:opacity-45`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${MARKER_BG[index % MARKER_BG.length]}`}
                >
                  {MARKERS[index]}
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold leading-snug text-slate-900">{opt.label}</p>
                  {opt.description && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{opt.description}</p>
                  )}
                  {opt.outcomePreview && (
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                      {opt.outcomePreview}
                    </p>
                  )}
                  {opt.costLabel && (
                    <p className="mt-1 font-mono text-[10px] text-slate-400">{opt.costLabel}</p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {options.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={!canDecide || deciding}
            onClick={onConfirm}
            className="rounded-2xl bg-slate-900 px-12 py-3.5 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-45"
          >
            {deciding ? 'Locking in…' : 'Lock decision'}
          </button>
        </div>
      )}
    </section>
  )
}
