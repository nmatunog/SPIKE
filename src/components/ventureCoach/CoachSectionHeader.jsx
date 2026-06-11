/**
 * @param {{ step: number, total: number, title: string, description?: string }} props
 */
export function CoachSectionHeader({ step, total, title, description }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-2xs font-bold uppercase tracking-wide text-slate-500">
        Step {step} of {total}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
    </section>
  );
}
