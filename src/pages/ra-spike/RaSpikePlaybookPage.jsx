import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { RaSpikeContentPending } from '../../components/ra-spike/RaSpikeContentPending.jsx';
import { WeeklyCardStack } from '../../components/ra-spike/learning/WeeklyCardStack.jsx';
import { RaSpikeGraduationModal } from '../../components/ra-spike/RaSpikeGraduationModal.jsx';
import { shouldShowRaSpikeGraduation } from '../../lib/raSpikeGraduation.js';
import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';
import {
  getRaSpikeWeekContent,
  isRaSpikeWeekContentReady,
  listRaSpikeWeekStepIds,
  RA_SPIKE_STEP_ORDER,
} from '../../lib/raSpikeContentLoader.js';
import {
  fetchRaSpikeWeekProgress,
  raSpikeWeekPercentComplete,
} from '../../lib/raSpikeWeekProgress.js';
import { isRaSpikeWeekUnlocked } from '../../lib/programUnlockPolicy.js';
import { RaSpikeWeekStepPage } from './RaSpikeWeekStepPage.jsx';
import { RaSpikeWeek1Experience } from '../../components/ra-spike/week1/RaSpikeWeek1Experience.jsx';
import { parseRaSpikePlaybookPath, ROUTES } from '../../routes/paths.js';

/**
 * @param {{ user?: { id?: string, internProgress?: object | null } }} props
 */
export function RaSpikePlaybookPage({ user }) {
  const location = useLocation();
  const parsed = parseRaSpikePlaybookPath(location.pathname);
  const weekParam = Number(new URLSearchParams(location.search).get('week'));
  const ctxWeek = getRaSpikeContext(user?.internProgress).week;
  const week = Number.isFinite(weekParam) && weekParam >= 1 ? weekParam : ctxWeek;

  // Only Week 1 has authored RA-SPIKE experience. No internship tools (persona, FEC, worksheets).
  if (week === 1 && isRaSpikeWeekContentReady(1)) {
    if (parsed?.view === 'dream-board') {
      return <RaSpikeWeek1Experience user={user} stepId="learn" />;
    }
    if (parsed?.view === 'overview' || !parsed) {
      return <RaSpikeWeek1Experience user={user} stepId="learn" />;
    }
    if (parsed?.view === 'step' && parsed.stepId) {
      return <RaSpikeWeek1Experience user={user} stepId={parsed.stepId} />;
    }
  }

  if (parsed?.view === 'step' && parsed.stepId && isRaSpikeWeekContentReady(week)) {
    return <RaSpikeWeekStepPage user={user} week={week} stepId={parsed.stepId} />;
  }

  return <RaSpikePlaybookOverview user={user} />;
}

/** @param {{ user?: { id?: string, internProgress?: object | null } }} props */
function RaSpikePlaybookOverview({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const participantId = user?.id ?? '';
  const baseCtx = getRaSpikeContext(user?.internProgress);
  const queryWeek = Number(new URLSearchParams(location.search).get('week'));
  const displayWeek = useMemo(() => {
    const unlocked = baseCtx.week;
    if (Number.isFinite(queryWeek) && queryWeek >= 1 && queryWeek <= unlocked) return queryWeek;
    return unlocked;
  }, [queryWeek, baseCtx.week]);
  const weekUnlocked = isRaSpikeWeekUnlocked(displayWeek, user?.internProgress);
  const weekContent = getRaSpikeWeekContent(displayWeek);
  const contentReady = isRaSpikeWeekContentReady(displayWeek);
  const [progress, setProgress] = useState({});
  const [showGrad, setShowGrad] = useState(false);

  useEffect(() => {
    if (shouldShowRaSpikeGraduation(participantId, user?.internProgress)) {
      setShowGrad(true);
    }
  }, [participantId, user?.internProgress]);

  useEffect(() => {
    if (!participantId || !weekUnlocked || !contentReady) return;
    fetchRaSpikeWeekProgress(participantId, displayWeek)
      .then(setProgress)
      .catch(() => setProgress({}));
  }, [participantId, displayWeek, weekUnlocked, contentReady]);

  const steps = listRaSpikeWeekStepIds(displayWeek).map((id) => {
    const step = weekContent.steps?.[id];
    return { id, label: step?.label ?? id, summary: step?.summary ?? '' };
  });

  const percent = contentReady ? raSpikeWeekPercentComplete(progress) : 0;

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          {showGrad ? (
            <RaSpikeGraduationModal user={user} onClose={() => setShowGrad(false)} />
          ) : null}
          <header>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Playbook</h1>
              <label className="text-sm text-slate-600">
                <span className="sr-only">Select week</span>
                <select
                  value={displayWeek}
                  onChange={(e) => navigate(`${ROUTES.raSpikePlaybook}?week=${e.target.value}`)}
                  className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  {Array.from({ length: RA_SPIKE_PROGRAM.totalWeeks }, (_, i) => i + 1)
                    .filter((w) => isRaSpikeWeekUnlocked(w, user?.internProgress))
                    .map((w) => (
                      <option key={w} value={w}>
                        Week {w}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <p className="mt-1 text-slate-600">
              Week {displayWeek}: {weekContent.title}
            </p>
            {weekUnlocked && contentReady ? (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Week progress</span>
                  <span>{percent}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-spike transition-all" style={{ width: `${percent}%` }} />
                </div>
              </div>
            ) : null}
          </header>

          {!weekUnlocked ? (
            <section className="spike-card text-sm text-slate-600">
              <p className="font-semibold text-slate-900">This week is locked</p>
              <p className="mt-1">Your coach publishes each week when the cohort is ready.</p>
            </section>
          ) : !contentReady ? (
            <RaSpikeContentPending
              week={displayWeek}
              title={weekContent.title}
              theme={weekContent.theme}
            />
          ) : (
            <WeeklyCardStack week={displayWeek} steps={steps} progress={progress} />
          )}

          {contentReady ? (
            <p className="text-xs text-slate-500">
              Flow: {RA_SPIKE_STEP_ORDER.join(' → ')}. Complete each step in order.
            </p>
          ) : null}
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
