import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { DreamBoardStudio } from '../../components/day1/builders/DreamBoardStudio.jsx';
import {
  completeDay1Builder,
  getBuilderData,
  isBuilderCompleted,
  saveBuilderDraft,
} from '../../lib/day1BuilderService.js';
import { setRaSpikeStepStatus } from '../../lib/raSpikeWeekProgress.js';
import { ROUTES } from '../../routes/paths.js';
import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';

/**
 * RA-SPIKE Week 1 — Dream Board only (no full Venture Blueprint shell).
 * @param {{ user?: { id?: string, name?: string, internProgress?: object | null } }} props
 */
export function RaSpikeDreamBoardPage({ user }) {
  const participantId = user?.id ?? '';
  const ctx = getRaSpikeContext(user?.internProgress);
  const week = ctx.week;
  const [draft, setDraft] = useState(() => getBuilderData(participantId, 'dream-board') ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const completed = isBuilderCompleted(participantId, 'dream-board');

  useEffect(() => {
    if (!participantId || !completed) return;
    void setRaSpikeStepStatus(participantId, week, 'assignment', 'complete');
  }, [participantId, completed, week]);

  function handleDraftChange(next) {
    setDraft(next);
    saveBuilderDraft(participantId, 'dream-board', next);
  }

  async function handleComplete(next) {
    setBusy(true);
    setError('');
    try {
      await completeDay1Builder(participantId, 'dream-board', next);
      await setRaSpikeStepStatus(participantId, week, 'assignment', 'complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save Dream Board.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-4">
          <Link
            to={ROUTES.raSpikePlaybook}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-slate-600 hover:text-spike"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Playbook
          </Link>

          <header>
            <p className="text-sm font-semibold uppercase tracking-wider text-spike">Week {week} assignment</p>
            <h1 className="text-2xl font-bold text-slate-900">Dream Board Studio</h1>
            <p className="mt-1 text-sm text-slate-600">
              Visualize the life and business you are building. Photos sync to your account when signed in.
            </p>
          </header>

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
          ) : null}

          <DreamBoardStudio
            participantId={participantId}
            draft={draft}
            completed={completed}
            editLocked={busy}
            onChange={handleDraftChange}
            onComplete={handleComplete}
          />
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
