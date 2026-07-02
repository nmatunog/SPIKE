import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { CanvasWizardEngine } from '../../components/ra-spike/learning/CanvasWizardEngine.jsx';
import { prepareFecCanvas } from '../../lib/fecCanvasService.js';
import { isCanvasWizardComplete } from '../../lib/raSpikeCanvasWizard.js';
import { setRaSpikeStepStatus } from '../../lib/raSpikeWeekProgress.js';
import { ROUTES } from '../../routes/paths.js';

const CANVAS_WEEK = 3;

/**
 * @param {{ user?: { id?: string, internProgress?: object | null } }} props
 */
export function RaSpikeCanvasWizardPage({ user }) {
  const participantId = user?.id ?? '';
  const week = CANVAS_WEEK;
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (participantId) prepareFecCanvas(participantId);
  }, [participantId]);

  useEffect(() => {
    if (!participantId) return;
    if (isCanvasWizardComplete(participantId)) {
      setDone(true);
      void setRaSpikeStepStatus(participantId, week, 'assignment', 'complete');
    }
  }, [participantId, week]);

  async function handleComplete() {
    if (!participantId) return;
    await setRaSpikeStepStatus(participantId, week, 'assignment', 'complete');
    setDone(true);
  }

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-4">
          <Link to={ROUTES.raSpikePlaybook} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-spike">
            <ArrowLeft size={16} /> Playbook
          </Link>
          <header>
            <h1 className="text-2xl font-bold text-slate-900">FEC Canvas Wizard</h1>
            <p className="mt-1 text-sm text-slate-600">One section at a time — auto-saves to your canvas.</p>
          </header>
          {done ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Canvas assignment complete. Return to Playbook to finish Reflection and Submit.
            </p>
          ) : null}
          <CanvasWizardEngine participantId={participantId} onComplete={handleComplete} />
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
