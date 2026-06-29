const MARKERS = ['A', 'B', 'C', 'D']
const ACCENTS = [
  'border-emerald-400/30 hover:border-emerald-400/50',
  'border-blue-400/30 hover:border-blue-400/50',
  'border-purple-400/30 hover:border-purple-400/50',
  'border-amber-400/30 hover:border-amber-400/50',
]

export default function DecisionChoiceRow({
  options = [],
  selectedIndex = 0,
  onSelect,
  onConfirm,
  canDecide,
  deciding,
  error,
}) {
  return (
    <section className="mx-auto w-full max-w-4xl px-3 pb-4">
      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-center text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((opt, index) => {
          const selected = selectedIndex === index
          return (
            <button
              key={opt.strategy}
              type="button"
              disabled={!canDecide || deciding}
              onClick={() => onSelect?.(index)}
              className={`gsv2-choice-card ${ACCENTS[index % ACCENTS.length]} ${
                selected ? 'gsv2-choice-card--selected' : ''
              } disabled:opacity-45`}
            >
              <div className="flex items-start gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-bold text-slate-800">
                  {MARKERS[index]}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-snug text-slate-900">{opt.label}</p>
                  {opt.description && (
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{opt.description}</p>
                  )}
                  {opt.costLabel && (
                    <p className="mt-2 font-mono text-[10px] font-bold text-slate-500">
                      {opt.costLabel}
                    </p>
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
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-12 py-3.5 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg shadow-emerald-900/30 transition hover:brightness-110 disabled:opacity-45"
          >
            {deciding ? 'Locking in…' : 'Lock decision'}
          </button>
        </div>
      )}
    </section>
  )
}
