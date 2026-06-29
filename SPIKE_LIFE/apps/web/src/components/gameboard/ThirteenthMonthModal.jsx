export default function ThirteenthMonthModal({ allocations, onSelect, onDismiss, busy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/25 p-4 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="thirteenth-month-title"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Philippine year-end
        </p>
        <h2 id="thirteenth-month-title" className="mt-2 text-2xl font-bold text-slate-900">
          13th month pay
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Your employer bonus just landed. Choose one primary allocation — every option has a
          trade-off.
        </p>

        <ul className="mt-5 max-h-64 space-y-2 overflow-y-auto">
          {allocations.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => onSelect(opt.id)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50"
              >
                <span className="font-semibold text-slate-900">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{opt.description}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700"
        >
          Decide later
        </button>
      </div>
    </div>
  )
}
