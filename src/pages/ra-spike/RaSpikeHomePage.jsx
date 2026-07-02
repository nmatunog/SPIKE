import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { RaSpikeAssignmentCard } from '../../components/ra-spike/RaSpikeAssignmentCard.jsx';
import { RaSpikeNextSessionCard } from '../../components/ra-spike/RaSpikeNextSessionCard.jsx';
import { RaSpikeSquadSummaryCard } from '../../components/ra-spike/RaSpikeSquadSummaryCard.jsx';
import { useRaSpikeHomeDashboard } from '../../hooks/useRaSpikeHomeDashboard.js';

/**
 * @param {{ user?: { id?: string, name?: string, internProgress?: object | null } }} props
 */
export function RaSpikeHomePage({ user }) {
  const { loading, model, nextSession, squad } = useRaSpikeHomeDashboard(user);
  const { ctx, assignment, assignmentStatus, primaryAction } = model;
  const firstName = (user?.name || 'Participant').split(' ')[0];

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <header>
            <p className="text-sm font-medium text-slate-500">Welcome back, {firstName}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {ctx.weekTheme}
            </h1>
            <p className="mt-2 text-slate-600">{ctx.weekSubtitle}</p>
          </header>

          <section className="spike-card space-y-4 border-spike/20 ring-1 ring-spike/10">
            <div>
              <p className="spike-label text-spike">Current lesson</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                Week {ctx.week}: {ctx.weekTheme}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {ctx.stageGate
                  ? `Milestone week — ${ctx.stageGate.title}. Focus on preparation and rehearsal.`
                  : 'Work through Learn, Workshop, Assignment, Reflection, and Submit in Playbook.'}
              </p>
            </div>
            <Link
              to={primaryAction.href}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-spike px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-spike-dark sm:w-auto"
            >
              {primaryAction.label}
              <ArrowRight size={18} aria-hidden />
            </Link>
          </section>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={18} aria-hidden />
              Loading your dashboard…
            </div>
          ) : (
            <>
              <RaSpikeAssignmentCard
                title={assignment.title}
                summary={assignment.summary}
                dueHint={assignment.dueHint}
                estimatedMinutes={assignment.estimatedMinutes}
                status={assignmentStatus}
              />

              <RaSpikeNextSessionCard
                label={nextSession.label}
                date={nextSession.date}
                timeLabel={nextSession.timeLabel}
                isToday={nextSession.isToday}
                daysUntil={nextSession.daysUntil}
                week={nextSession.week}
              />

              <RaSpikeSquadSummaryCard
                squadName={squad.name}
                memberCount={squad.memberCount}
                squadObjective={assignment.squadObjective}
                forming={squad.forming}
              />
            </>
          )}

          {ctx.stageGate ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">{ctx.stageGate.label}</p>
              <p className="mt-1">{ctx.stageGate.title}</p>
            </section>
          ) : null}
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
