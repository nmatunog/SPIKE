import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download } from 'lucide-react';
import { listParticipantCertificates } from '../../lib/stageGateService.js';
import { exportStageGateCertificatePdf } from '../../lib/stageGateCertificatePdf.js';
import { getStageGateDefinition, STAGE_GATE_BY_CLOSING_WEEK } from '../../lib/stageGateCeremonyConstants.js';
import { stageGateCertificateHref } from '../../routes/paths.js';

/**
 * @param {{ participantId: string, participantName?: string }} props
 */
export function PortfolioStageGateCertificates({ participantId, participantName = '' }) {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listParticipantCertificates(participantId).then((rows) => {
      if (!cancelled) setCertificates(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  const futureWeeks = Object.keys(STAGE_GATE_BY_CLOSING_WEEK)
    .map(Number)
    .filter((week) => !certificates.some((c) => c.closingWeek === week));

  return (
    <section className="spike-card p-6">
      <div className="flex items-center gap-2">
        <Award size={18} className="text-spike" />
        <h2 className="text-lg font-bold text-slate-900">Stage Gate Certificates</h2>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Official SPIKE stage completion records — not badges.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {certificates.map((cert) => (
          <article
            key={cert.id}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Week {cert.closingWeek}
            </p>
            <p className="mt-1 text-lg font-black text-slate-900">{cert.stageLabel}</p>
            <p className="text-xs font-semibold text-emerald-700">Completed</p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(cert.completedDate)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={stageGateCertificateHref(cert.closingWeek)}
                className="spike-btn-secondary !px-3 !py-1.5 text-xs"
              >
                View
              </Link>
              <button
                type="button"
                onClick={() =>
                  exportStageGateCertificatePdf({
                    ...cert,
                    participantName: cert.participantName || participantName,
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download size={14} /> PDF
              </button>
            </div>
          </article>
        ))}

        {futureWeeks.map((week) => {
          const gate = getStageGateDefinition(week);
          return (
            <article
              key={`future-${week}`}
              className="rounded-xl border border-dashed border-slate-200 bg-white p-4 opacity-60"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Week {week}
              </p>
              <p className="mt-1 text-lg font-bold text-slate-400">{gate.stageLabel}</p>
              <p className="text-xs text-slate-400">Locked</p>
            </article>
          );
        })}
      </div>

      {certificates.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Complete a stage gate ceremony to earn your first certificate.
        </p>
      ) : null}
    </section>
  );
}

/** @param {string} value */
function formatDate(value) {
  const d = new Date(value?.includes?.('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}
