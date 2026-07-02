import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { WeeklyCardStack } from '../../components/ra-spike/learning/WeeklyCardStack.jsx';
import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';
import { resolveRaSpikeCalendarWeek } from '../../lib/programs/ra-spike-session.js';
import {
  getRaSpikeWeekContent,
  listRaSpikeWeekStepIds,
  RA_SPIKE_STEP_ORDER,
} from '../../lib/raSpikeContentLoader.js';
import {
  fetchRaSpikeWeekProgress,
  raSpikeWeekPercentComplete,
} from '../../lib/raSpikeWeekProgress.js';
import { isRaSpikeWeekUnlocked } from '../../lib/programUnlockPolicy.js';
import { useRaSpikeHomeDashboard } from '../../hooks/useRaSpikeHomeDashboard.js';
import { RaSpikeWeekStepPage } from './RaSpikeWeekStepPage.jsx';
import { RaSpikeDreamBoardPage } from './RaSpikeDreamBoardPage.jsx';
import {
  parseRaSpikePlaybookPath,
} from '../../routes/paths.js';

/**
 * @param {{ user?: { id?: string, internProgress?: object | null } }} props
 */
export function RaSpikePlaybookPage({ user }) {
  const location = useLocation();
  const parsed = parseRaSpikePlaybookPath(location.pathname);
  const weekParam = Number(new URLSearchParams(location.search).get('week'));

  if (parsed?.view === 'dream-board') {
    return <RaSpikeDreamBoardPage user={user} />;
  }
  if (parsed?.view === 'step' && parsed.stepId) {
    const week = Number.isFinite(weekParam) && weekParam >= 1
      ? weekParam
      : getRaSpikeContext(user?.internProgress).week;
    return <RaSpikeWeekStepPage user={user} week={week} stepId={parsed.stepId} />;
  }

  return <RaSpikePlaybookOverview user={user} />;
}

/** @param {{ user?: { id?: string, internProgress?: object | null } }} props */
function RaSpikePlaybookOverview({ user }) {
  const participantId = user?.id ?? '';
  const { cohortStartDate } = useRaSpikeHomeDashboard(user);
  const baseCtx = getRaSpikeContext(user?.internProgress);
  const displayWeek = useMemo(
    () => resolveRaSpikeCalendarWeek(cohortStartDate, baseCtx.week),
    [cohortStartDate, baseCtx.week],
  );
  const weekUnlocked = isRaSpikeWeekUnlocked(displayWeek, user?.internProgress);
  const weekContent = getRaSpikeWeekContent(displayWeek);

  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (!participantId || !weekUnlocked) return;
    fetchRaSpikeWeekProgress(participantId, displayWeek)
      .then(setProgress)
      .catch(() => setProgress({}));
  }, [participantId, displayWeek, weekUnlocked]);

  const steps = listRaSpikeWeekStepIds(displayWeek).map((id) => {
    const step = weekContent.steps?.[id];
    return {
      id,
      label: step?.label ?? id,
      summary: step?.summary ?? '',
    };
  });

  const percent = raSpikeWeekPercentComplete(progress);

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <header>
            <h1 className="text-2xl font-bold text-slate-900">Playbook</h1>
            <p className="mt-1 text-slate-600">
              Week {displayWeek}: {weekContent.title}
            </p>
            {weekUnlocked ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Week progress</span>
                  <span>{percent}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-spike transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ) : null}
          </header>

          {!weekUnlocked ? (
            <section className="spike-card text-sm text-slate-600">
              <p className="font-semibold text-slate-900">This week is locked</p>
              <p className="mt-1">Complete prior weeks or wait for your cohort calendar to unlock Week {displayWeek}.</p>
            </section>
          ) : (
            <WeeklyCardStack week={displayWeek} steps={steps} progress={progress} />
          )}

          <p className="text-xs text-slate-500">
            Flow: {RA_SPIKE_STEP_ORDER.join(' → ')}. Complete each step in order.
          </p>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
