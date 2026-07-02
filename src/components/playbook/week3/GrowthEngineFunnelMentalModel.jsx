import { ArrowRight } from 'lucide-react';

const FLOW_STEPS = [
  {
    id: 'revenue',
    title: 'Year 1 revenue goal',
    detail: 'Your income target for the year',
  },
  {
    id: 'clients',
    title: 'Required clients',
    detail: 'Revenue goal ÷ average revenue per client',
  },
  {
    id: 'weekly',
    title: 'Weekly new clients',
    detail: 'Annual clients ÷ 52 weeks (rounded up)',
  },
  {
    id: 'engine',
    title: 'Scale the Business Engine',
    detail: '10 → 5 → 3 → 1 → ₱10,000 → 3 referrals',
  },
  {
    id: 'weekly-targets',
    title: 'Weekly activity targets',
    detail: 'Prospects, discovery, presentations, revenue, referrals',
  },
  {
    id: 'monthly',
    title: 'Monthly targets',
    detail: 'Weekly activity × 4 · monthly clients = annual ÷ 12',
  },
];

const ENGINE_RATIOS = [
  { from: '10', to: '5', label: 'prospects → discovery (50%)' },
  { from: '5', to: '3', label: 'discovery → presentations (60%)' },
  { from: '3', to: '1', label: 'presentations → new client (3:1)' },
  { from: '1', to: '₱10k', label: 'revenue per client' },
  { from: '1', to: '3', label: 'referrals per client' },
];

/**
 * How Growth Engine targets are derived from the 10–5–3–1–₱10,000–3 Business Engine.
 */
export function GrowthEngineFunnelMentalModel({ className = '' }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-slate-50 p-5 shadow-sm sm:p-6 ${className}`}
      aria-label="How growth targets are calculated"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">
        Mental model
      </p>
      <h3 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
        From income target to weekly funnel
      </h3>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Set your Year 1 revenue goal — the worksheet walks the same Business Engine ratios you
        built on Day 3, scaled to how many clients you need each week.
      </p>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FLOW_STEPS.map((step, index) => (
          <li
            key={step.id}
            className="relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              {index + 1}
            </span>
            <p className="mt-2 text-sm font-bold text-slate-900">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.detail}</p>
            {index < FLOW_STEPS.length - 1 ? (
              <ArrowRight
                className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-orange-300 lg:block"
                aria-hidden
              />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-900 px-4 py-4 text-white sm:px-5">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
          Base engine · 1 new client per week
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold">
          {ENGINE_RATIOS.map((row, i) => (
            <span key={row.label} className="inline-flex items-center gap-2">
              <span className="rounded-lg bg-white/10 px-2 py-1 tabular-nums">{row.from}</span>
              <ArrowRight size={14} className="shrink-0 text-orange-400" aria-hidden />
              <span className="rounded-lg bg-orange-500/90 px-2 py-1 tabular-nums">{row.to}</span>
              {i < ENGINE_RATIOS.length - 1 ? (
                <span className="hidden text-slate-500 sm:inline" aria-hidden>
                  ·
                </span>
              ) : null}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-300">
          Need more than 1 client per week? Multiply the whole chain — e.g.{' '}
          <strong className="text-white">10 clients/week</strong> → 50 prospects, 25 discovery, 15
          presentations, ₱100,000 revenue, 30 referrals.
        </p>
      </div>
    </section>
  );
}
