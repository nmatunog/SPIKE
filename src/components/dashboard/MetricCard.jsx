export function MetricCard({ label, value, sub, accent = 'red', className = '' }) {
  const border =
    accent === 'green'
      ? 'border-l-green-600'
      : accent === 'blue'
        ? 'border-l-blue-600'
        : accent === 'amber'
          ? 'border-l-amber-500'
          : 'border-l-[#8B0000]';

  return (
    <div
      className={`rounded-xl border border-gray-200 border-l-4 bg-white p-4 shadow-sm sm:p-5 ${border} ${className}`}
    >
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 sm:text-xs">
        {label}
      </p>
      <p className="break-words text-xl font-black text-gray-900 sm:text-2xl">{value}</p>
      {sub ? <p className="mt-1 break-words text-xs text-gray-500">{sub}</p> : null}
    </div>
  );
}
