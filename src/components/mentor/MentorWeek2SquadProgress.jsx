import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle, Users } from 'lucide-react';
import { groupInternsBySquad } from '../../lib/mentorFrameworkService.js';
import { deriveSquadWeek2Progress } from '../../lib/customerDiscovery/week2MentorSquadService.js';
import { MIN_ENCODED_INTERVIEWS, TARGET_ENCODED_INTERVIEWS } from '../../lib/customerDiscovery/week2Constants.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * Mentor Week 2 — assigned squad progress (interviews, portfolio, readiness, pitch).
 * @param {{ interns: Array<{ id: string, name: string, squad?: string }> }} props
 */
export function MentorWeek2SquadProgress({ interns }) {
  const squads = groupInternsBySquad(interns);

  if (!squads.length) {
    return (
      <section className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Squad progress</p>
        <p className="mt-2">Assign squads in cohort formation to track Week 2 mission progress.</p>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-4 border-t border-slate-200 pt-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-spike">Week 2</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Squad progress</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Mission-driven journey — interviews, portfolio, professional readiness, and pitch readiness
            for your assigned squads.
          </p>
        </div>
        <Link
          to={ROUTES.mentorSquads}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-spike hover:underline"
        >
          Squad hub
          <ArrowRight size={14} aria-hidden />
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {squads.map((squad) => {
          const memberIds = (squad.members ?? []).map((m) => m.id);
          const progress = deriveSquadWeek2Progress(memberIds);
          return (
            <article key={squad.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Users size={15} className="text-spike" aria-hidden />
                    {squad.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {progress.memberCount} member{progress.memberCount === 1 ? '' : 's'} ·{' '}
                    {progress.weekProgressPct}% week complete
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    progress.stageGateReady
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {progress.stageGateReady ? 'Stage gate ready' : 'In progress'}
                </span>
              </div>

              <ul className="mt-4 space-y-2 text-sm">
                <ProgressRow
                  label="Interviews encoded"
                  detail={`${progress.interviewCount} / ${TARGET_ENCODED_INTERVIEWS} (min ${MIN_ENCODED_INTERVIEWS})`}
                  done={progress.interviewsMet}
                />
                <ProgressRow label="Portfolio synced" done={progress.portfolioComplete} />
                <ProgressRow label="Professional readiness" done={progress.readinessComplete} />
                <ProgressRow label="Pitch started" done={progress.pitchReady} />
                <ProgressRow label="Pitch submitted" done={progress.pitchSubmitted} />
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** @param {{ label: string, detail?: string, done: boolean }} props */
function ProgressRow({ label, detail, done }) {
  const Icon = done ? CheckCircle2 : Circle;
  return (
    <li className="flex items-center gap-2 text-slate-700">
      <Icon size={16} className={done ? 'text-emerald-600' : 'text-slate-300'} aria-hidden />
      <span className={done ? 'font-medium text-slate-900' : ''}>{label}</span>
      {detail ? <span className="ml-auto text-xs text-slate-500">{detail}</span> : null}
    </li>
  );
}
