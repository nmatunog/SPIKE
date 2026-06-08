/** @param {{ title: string, items?: string[], empty?: string }} props */
export function FrameworkBulletList({ title, items = [], empty = 'None listed.' }) {
  return (
    <div className="spike-card">
      <h3 className="spike-label">{title}</h3>
      {items.length ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}

/** @param {{ label: string, value: string | number, sub?: string, accent?: string }} props */
export function FrameworkMetric({ label, value, sub, accent = 'text-slate-900' }) {
  return (
    <div className="spike-card text-center">
      <p className="spike-label">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

/** @param {{ title: string, children: import('react').ReactNode }} props */
export function FrameworkSection({ title, children }) {
  return (
    <section className="spike-card space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}
