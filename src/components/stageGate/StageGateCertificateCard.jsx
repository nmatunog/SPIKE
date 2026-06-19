/**
 * Stage Gate certificate — shared layout for participant view and coach sample preview.
 * @param {{
 *   certificate: {
 *     participantName?: string,
 *     squadName?: string,
 *     programName?: string,
 *     completedDate?: string,
 *     stageLabel?: string,
 *     nextStageLabel?: string,
 *   },
 *   sample?: boolean,
 * }} props
 */
export function StageGateCertificateCard({ certificate, sample = false }) {
  return (
    <article
      className={`rounded-3xl border bg-white p-8 shadow-sm sm:p-12 ${
        sample ? 'border-dashed border-amber-300 bg-amber-50/30' : 'border-slate-200'
      }`}
    >
      {sample ? (
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-amber-800">
          Sample preview — not issued until unlock
        </p>
      ) : null}

      <div className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-spike">SPIKE</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Stage Gate Certificate
        </p>
      </div>

      <dl className="mx-auto mt-10 max-w-md space-y-3 text-sm">
        <Row label="Participant" value={certificate.participantName || '—'} />
        <Row label="Squad" value={certificate.squadName || '—'} />
        <Row label="Program" value={certificate.programName || 'SPIKE Venture Studio'} />
        <Row label="Date" value={formatCertDisplayDate(certificate.completedDate)} />
      </dl>

      <div className="mt-12 text-center">
        <p className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          {certificate.stageLabel || 'DISCOVER'}
        </p>
        <p className="mt-3 text-sm font-bold uppercase tracking-widest text-spike">✓ Completed</p>
      </div>

      <div className="mt-12 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Next stage</p>
        <p className="mt-2 text-xl font-bold text-slate-900">
          {certificate.nextStageLabel || 'VALIDATE'}
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Unlocked</p>
      </div>

      <footer className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-500">SPIKE Venture Studio</p>
        <p>Official Program Record</p>
      </footer>
    </article>
  );
}

/** @param {{ label: string, value: string }} props */
function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

/** @param {string | undefined} value */
function formatCertDisplayDate(value) {
  if (!value) {
    return new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  const d = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
