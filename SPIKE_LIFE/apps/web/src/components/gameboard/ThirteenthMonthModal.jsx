export default function ThirteenthMonthModal({ allocations, onSelect, onDismiss, busy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        className="w-full max-w-lg rounded-3xl border border-amber-300/30 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl"
        role="dialog"
        aria-labelledby="thirteenth-month-title"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
          Philippine year-end
        </p>
        <h2 id="thirteenth-month-title" className="mt-2 text-2xl font-bold text-white">
          13th month pay
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
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
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-amber-400/40 hover:bg-amber-400/10 disabled:opacity-50"
              >
                <span className="font-semibold text-white">{opt.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{opt.description}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-300"
        >
          Decide later
        </button>
      </div>
    </div>
  )
}
