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
      className={`rounded-xl border border-gray-200 border-l-4 bg-white p-5 shadow-sm ${border} ${className}`}
    >
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-gray-500">{sub}</p> : null}
    </div>
  );
}
