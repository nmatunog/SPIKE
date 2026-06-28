import { TURN_STEPS } from '../../content/learning-beats.js'

export default function FnaExplainer({ compact = false }) {
  if (compact) {
    return (
      <p className="rounded-xl bg-sky-50 px-4 py-3 text-body text-sky-950 ring-1 ring-sky-100">
        <span className="font-semibold">Financial Needs Analysis</span> finds your biggest gaps first—so
        recommendations fit your life, not a product catalog.
      </p>
    )
  }

  return (
    <section className="rounded-2xl border border-sky-100 bg-sky-50/80 px-5 py-4">
      <h3 className="text-title font-semibold text-sky-950">Why advisors start with FNA</h3>
      <p className="mt-2 text-body leading-relaxed text-sky-900/90">
        Professional planners never lead with products. They measure protection, cash flow, debt, goals,
        and retirement—then rank what needs attention now.
      </p>
      <ul className="mt-4 space-y-2 text-caption text-sky-900/85">
        <li className="flex gap-2">
          <span className="font-bold text-sky-700" aria-hidden>
            1
          </span>
          <span>
            <strong className="font-semibold">Diagnose</strong> — score each dimension of your financial life
          </span>
        </li>
        <li className="flex gap-2">
          <span className="font-bold text-sky-700" aria-hidden>
            2
          </span>
          <span>
            <strong className="font-semibold">Prioritize</strong> — focus on critical gaps before nice-to-haves
          </span>
        </li>
        <li className="flex gap-2">
          <span className="font-bold text-sky-700" aria-hidden>
            3
          </span>
          <span>
            <strong className="font-semibold">Recommend</strong> — match actions to your top need this turn
          </span>
        </li>
      </ul>
    </section>
  )
}

export { TURN_STEPS }
