import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { RaSpikeSquadAndCohortPanel } from '../../components/ra-spike/week1/RaSpikeSquadAndCohortPanel.jsx';
import { Users } from 'lucide-react';
import { getRaSpikeAssignment } from '../../lib/programs/ra-spike-assignments.js';
import { getRaSpikeContext } from '../../lib/programs/ra-spike-context.js';
import { getRaSpikeGateStatus } from '../../lib/raSpikeGateService.js';
import { fetchRaSpikeWeekProgress, raSpikeWeekPercentComplete } from '../../lib/raSpikeWeekProgress.js';
import { useRaSpikeHomeDashboard } from '../../hooks/useRaSpikeHomeDashboard.js';
import { ROUTES, raSpikeDreamBoardHref } from '../../routes/paths.js';

/**
 * @param {{ user?: { id?: string, name?: string, internProgress?: object | null } }} props
 */
export function RaSpikeSquadPage({ user }) {
  const participantId = user?.id ?? '';
  const ctx = getRaSpikeContext(user?.internProgress);
  const assignment = getRaSpikeAssignment(ctx.week);
  const { squad, loading } = useRaSpikeHomeDashboard(user);
  const [weekProgress, setWeekProgress] = useState({});

  useEffect(() => {
    if (!participantId) return;
    fetchRaSpikeWeekProgress(participantId, ctx.week).then(setWeekProgress).catch(() => {});
  }, [participantId, ctx.week]);

  const squadPct = useMemo(() => raSpikeWeekPercentComplete(weekProgress), [weekProgress]);
  const gate1 = getRaSpikeGateStatus(user?.internProgress, 1);
  const gate2 = getRaSpikeGateStatus(user?.internProgress, 2);

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <header>
            <h1 className="text-2xl font-bold text-slate-900">Squad</h1>
            <p className="mt-1 text-slate-600">Week {ctx.week} · {ctx.segmentLabel}</p>
          </header>

          <section className="spike-card">
            <div className="flex items-start gap-4">
              <Users className="shrink-0 text-spike" size={36} aria-hidden />
              <div>
                {loading ? (
                  <p className="text-sm text-slate-500">Loading squad…</p>
                ) : squad.forming || !squad.name ? (
                  <>
                    <h2 className="text-xl font-bold text-slate-900">Squad forming</h2>
                    <p className="mt-1 text-sm text-slate-600">Your coach will assign squads before workshops.</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-slate-900">{squad.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {squad.memberCount > 1
                        ? `${squad.memberCount} members`
                        : 'You are the first member — teammates joining soon'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="spike-card space-y-3">
            <p className="text-sm font-semibold text-slate-900">This week&apos;s squad objective</p>
            <p className="text-sm text-slate-700">
              {assignment?.squadObjective || 'No squad objective published for this week yet.'}
            </p>
            <div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Your week progress</span>
                <span>{squadPct}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-spike" style={{ width: `${squadPct}%` }} />
              </div>
            </div>
          </section>

          <section className="spike-card space-y-2 text-sm">
            <p className="font-semibold text-slate-900">Cohort milestones</p>
            <p className="text-slate-600">
              Stage Gate 1: <strong>{gate1 || 'not started'}</strong>
            </p>
            <p className="text-slate-600">
              Stage Gate 2: <strong>{gate2 || 'not started'}</strong>
            </p>
          </section>

          <section className="spike-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Squad registration</p>
              {ctx.week === 1 ? (
                <Link
                  to={raSpikeDreamBoardHref({ images: true })}
                  className="text-sm font-semibold text-spike hover:underline"
                >
                  Dream Board uploads
                </Link>
              ) : null}
            </div>
            <RaSpikeSquadAndCohortPanel
              participantId={participantId}
              internProgress={user?.internProgress}
            />
          </section>
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
