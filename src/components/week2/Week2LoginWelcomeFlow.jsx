import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { StageGateCertificateCard } from '../stageGate/StageGateCertificateCard.jsx';
import { Week2ActivateHero } from '../playbook/week2/Week2ActivateHero.jsx';
import { getParticipantSquad } from '../../lib/cohortFormationService.js';
import { buildSampleStageGateCertificate } from '../../lib/stageGateService.js';
import { findCertificateByWeekLocal } from '../../lib/stageGateParticipantStorage.js';
import { applyStageUnlockToParticipant } from '../../lib/stageGateParticipantStorage.js';
import { markWeek2LoginWelcomeSeen } from '../../lib/week2LoginWelcome.js';
import { BLUEPRINT_LINKS } from '../../routes/paths.js';

/**
 * Post-login welcome — Week 1 certificate, then Week 2 Activate hero.
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   onFinished?: () => void,
 * }} props
 */
export function Week2LoginWelcomeFlow({ participantId, participantName = 'Participant', onFinished }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const squad = getParticipantSquad(participantId);
  const storedCert = findCertificateByWeekLocal(participantId, 1);
  const certificate =
    storedCert ??
    buildSampleStageGateCertificate(1, {
      participantName,
      squadName: squad?.name ?? '—',
    });

  useEffect(() => {
    const completedDate = new Date().toISOString().slice(0, 10);
    applyStageUnlockToParticipant(participantId, 1, completedDate);
  }, [participantId]);

  function finish() {
    markWeek2LoginWelcomeSeen(participantId);
    onFinished?.();
    navigate(BLUEPRINT_LINKS.customerDiscovery);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-spike">
            <Sparkles size={14} />
            {step === 0 ? 'Week 1 complete' : 'Welcome to Week 2'}
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">
            {step === 0 ? 'Your Discover certificate' : 'Week 2: Activate'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {step === 0
              ? 'Celebrate your squad’s Stage Gate I completion before you activate validation.'
              : 'Your squad mission is live — customer discovery and market evidence.'}
          </p>
        </div>

        <div className="px-6 py-6">
          {step === 0 ? (
            <StageGateCertificateCard
              certificate={{
                ...certificate,
                participantName: certificate.participantName || participantName,
                squadName: certificate.squadName || squad?.name || '—',
              }}
              sample={!storedCert}
            />
          ) : (
            <Week2ActivateHero variant="intern" showActions={false} />
          )}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={finish}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            Skip for now
          </button>
          {step === 0 ? (
            <button type="button" onClick={() => setStep(1)} className="spike-btn-primary inline-flex gap-2">
              Continue to Week 2
              <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={finish} className="spike-btn-primary inline-flex gap-2">
              Activate Week 2
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
