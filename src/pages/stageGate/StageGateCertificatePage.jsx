import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import {
  findCertificateByWeekLocal,
  listParticipantCertificates,
} from '../../lib/stageGateService.js';
import { exportStageGateCertificatePdf } from '../../lib/stageGateCertificatePdf.js';
import { getStageGateDefinition } from '../../lib/stageGateCeremonyConstants.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ user: { id: string, name?: string, email?: string }, closingWeek: number }} props
 */
export function StageGateCertificatePage({ user, closingWeek }) {
  const [certificate, setCertificate] = useState(null);
  const gate = getStageGateDefinition(closingWeek);
  const participantName = user.name || user.email || 'Participant';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = findCertificateByWeekLocal(user.id, closingWeek);
      if (local) {
        if (!cancelled) setCertificate(local);
        return;
      }
      const rows = await listParticipantCertificates(user.id);
      const match = rows.find((c) => c.closingWeek === closingWeek);
      if (!cancelled) setCertificate(match ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id, closingWeek]);

  const display = certificate ?? {
    stageLabel: gate.stageLabel,
    nextStageLabel: gate.nextStageLabel,
    completedDate: new Date().toISOString().slice(0, 10),
    programName: 'SPIKE Venture Studio',
    squadName: '—',
    participantName,
    closingWeek,
  };

  return (
    <PageContainer wide>
      <Link
        to={ROUTES.myVenturePortfolio}
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> Back to Portfolio
      </Link>

      <div className="mx-auto mt-8 max-w-2xl">
        <article className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-spike">SPIKE</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Stage Gate Certificate
            </p>
          </div>

          <dl className="mx-auto mt-10 max-w-md space-y-3 text-sm">
            <Row label="Participant" value={display.participantName || participantName} />
            <Row label="Squad" value={display.squadName || '—'} />
            <Row label="Program" value={display.programName || 'SPIKE Venture Studio'} />
            <Row label="Date" value={formatDate(display.completedDate)} />
          </dl>

          <div className="mt-12 text-center">
            <p className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {display.stageLabel || gate.stageLabel}
            </p>
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-spike">
              ✓ Completed
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Next stage</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {display.nextStageLabel || gate.nextStageLabel}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Unlocked</p>
          </div>

          <footer className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
            <p className="font-semibold text-slate-500">SPIKE Venture Studio</p>
            <p>Official Program Record</p>
          </footer>
        </article>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() =>
              exportStageGateCertificatePdf({
                ...display,
                participantName: display.participantName || participantName,
                closingWeek,
              })
            }
            className="spike-btn-primary inline-flex items-center gap-2"
          >
            <Download size={16} /> Download PDF
          </button>
          <Link to={ROUTES.myVenturePortfolio} className="spike-btn-secondary">
            Back to Portfolio
          </Link>
        </div>
      </div>
    </PageContainer>
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

/** @param {string} value */
function formatDate(value) {
  const d = new Date(value?.includes?.('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
