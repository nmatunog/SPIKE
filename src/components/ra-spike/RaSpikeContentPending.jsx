/**
 * Participant-facing blank state when curriculum is not authored yet.
 * @param {{ week: number, title?: string, theme?: string }} props
 */
export function RaSpikeContentPending({ week, title, theme }) {
  return (
    <section className="spike-card space-y-3 border-dashed border-slate-300 bg-slate-50/80">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Week {week}
        {title ? ` · ${title}` : ''}
      </p>
      <h2 className="text-lg font-semibold text-slate-900">Content not published yet</h2>
      {theme ? <p className="text-sm text-slate-600">{theme}</p> : null}
      <p className="text-sm text-slate-600">
        This week&apos;s playbook and portfolio stay blank until your coach publishes RA-SPIKE materials.
        Nothing from other programs is shown here.
      </p>
    </section>
  );
}
