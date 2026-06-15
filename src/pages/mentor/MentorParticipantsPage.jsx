import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { getCoachSummaryForMentor } from '../../lib/ventureCoachService.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ interns: Array<{ id: string, name: string, segment?: number, hours?: number, squad?: string }> }} props
 */
export function MentorParticipantsPage({ interns = [] }) {
  const { ready, version } = useCohortHydration(interns.map((i) => i.id));
  void version;

  return (
    <PageContainer>
      <PageTitle subtitle="Review Venture Coach progress and leave coaching feedback.">
        Participants
      </PageTitle>

      {!ready && interns.length > 0 ? (
        <p className="mt-4 text-sm text-slate-500">Loading participant work from the server…</p>
      ) : null}

      {interns.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
          No participants loaded yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {interns.map((intern) => {
            const summary = getCoachSummaryForMentor(intern.id);
            const progress = summary?.progress?.percent ?? 0;

            return (
              <li key={intern.id} className="spike-card flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-slate-900">{intern.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Seg {intern.segment ?? '—'}
                      {intern.squad ? ` · ${intern.squad}` : ''}
                      {typeof intern.hours === 'number' ? ` · ${intern.hours}h` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-spike-muted px-2.5 py-1 text-xs font-bold text-spike">
                    {progress}%
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                  {summary?.ambition?.trim()
                    ? summary.ambition
                    : summary?.tagline?.trim()
                      ? summary.tagline
                      : 'Venture Coach not started yet.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`${ROUTES.mentorVentureCoach}/${intern.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-spike px-3 py-2 text-xs font-semibold text-white hover:bg-red-900"
                  >
                    <Sparkles size={14} /> Venture Coach
                  </Link>
                  <Link
                    to={ROUTES.playbook}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Users size={14} /> Playbook
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to={ROUTES.analyticsCohortIdentity}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
      >
        Cohort identity analytics <ArrowRight size={16} />
      </Link>
    </PageContainer>
  );
}
