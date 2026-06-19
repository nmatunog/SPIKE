import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { StageGateCertificateCard } from '../../components/stageGate/StageGateCertificateCard.jsx';
import {
  findCertificateByWeekLocal,
  listParticipantCertificates,
} from '../../lib/stageGateService.js';
import { saveCertificateLocal } from '../../lib/stageGateParticipantStorage.js';
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
      if (match) {
        saveCertificateLocal({ ...match, participantId: user.id, participantName: match.participantName || participantName });
      }
      if (!cancelled) setCertificate(match ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id, closingWeek, participantName]);

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
        <StageGateCertificateCard certificate={display} sample={!certificate} />

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
