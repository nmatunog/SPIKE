export function MetricCard({ label, value, sub, accent = 'red', className = '', compact = false }) {
  const accentBg =
    accent === 'green'
      ? 'bg-emerald-50 text-emerald-800'
      : accent === 'blue'
        ? 'bg-sky-50 text-sky-800'
        : accent === 'amber'
          ? 'bg-amber-50 text-amber-900'
          : 'bg-spike-muted text-spike';

  if (compact) {
    return (
      <div className={`rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-card ${className}`}>
        <p className="spike-label">{label}</p>
        <p className="mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
        {sub ? <p className="mt-0.5 text-2xs text-slate-500">{sub}</p> : null}
      </div>
    );
  }

  return (
    <div className={`spike-card ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="spike-label">{label}</p>
        <span className={`rounded-md px-1.5 py-0.5 text-2xs font-semibold ${accentBg}`} aria-hidden>
          •
        </span>
      </div>
      <p className="mt-1 break-words text-xl font-semibold text-slate-900 sm:text-2xl">{value}</p>
      {sub ? <p className="mt-1 break-words text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
