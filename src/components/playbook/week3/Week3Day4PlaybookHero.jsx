export const WEEK3_DAY4_ID = 'day-segment-1-week-3-day-4';

/**
 * Week 3 Day 4 playbook hero — Growth Engine (SPIKE Design System 2.0).
 * @param {{ className?: string }} props
 */
export function Week3Day4PlaybookHero({ className = '' }) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card ${className}`}
      aria-label="Week 3 Day 4 hero"
    >
      <div className="relative flex min-h-[200px] flex-col justify-end bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-900 px-6 py-10 sm:min-h-[240px] sm:px-10 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-400">
          SPIKE WEEK 3 · DAY 4 · PLAYBOOK
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Growth Engine
        </h1>
        <p className="mt-2 text-lg font-medium text-orange-300 sm:text-xl">
          Build Capacity. Multiply Impact.
        </p>
        <p className="mt-4 text-sm font-medium text-slate-400">Financial Entrepreneurship</p>
        <div
          className="pointer-events-none absolute -right-8 top-8 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl"
          aria-hidden
        />
      </div>
      <div className="border-t border-slate-100 bg-white px-6 py-4 sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning journey</p>
        <ol className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-700">
          {[
            'Client Experience',
            'Business Engine',
            'Growth Engine',
            'Financial Engine',
            'Venture Pitch',
          ].map((step, i, arr) => (
            <li key={step} className="flex items-center gap-2">
              <span className={i === 2 ? 'font-bold text-orange-600' : ''}>{step}</span>
              {i < arr.length - 1 ? <span className="text-slate-300" aria-hidden>↓</span> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
