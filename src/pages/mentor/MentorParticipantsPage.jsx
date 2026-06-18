import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { getCoachSummaryForMentor } from '../../lib/ventureCoachService.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { groupInternsBySquad } from '../../lib/facultyMentorFrameworkService.js';
import { week1OutputCompletionPct, getParticipantWeek1Outputs } from '../../lib/mentorFrameworkService.js';
import { deriveVentureIdentity } from '../../lib/myVentureHqService.js';
import { ROUTES, mentorParticipantReviewHref, staffSquadsListHref } from '../../routes/paths.js';

/**
 * @param {{ interns: Array<{ id: string, name: string, segment?: number, hours?: number, squad?: string }>, role?: 'faculty' | 'mentor' }} props
 */
export function MentorParticipantsPage({ interns = [], role = 'mentor' }) {
  const { ready, version } = useCohortHydration(interns.map((i) => i.id), { interns });
  void version;
  const squads = groupInternsBySquad(interns);

  return (
    <PageContainer>
      <PageTitle subtitle="Browse by squad — open venture board, FEC, portfolio, or leave feedback.">
        People
      </PageTitle>

      <Link
        to={staffSquadsListHref(role)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
      >
        Squad hub view <ArrowRight size={14} />
      </Link>

      {!ready && interns.length > 0 ? (
        <p className="text-sm text-slate-500">Loading participant work from the server…</p>
      ) : null}

      {interns.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
          No participants loaded yet.
        </p>
      ) : (
        <div className="mt-4 space-y-8">
          {squads.map((squad) => (
            <section key={squad.name}>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">{squad.name}</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {squad.members.map((member) => {
                  const intern = interns.find((i) => i.id === member.id);
                  if (!intern) return null;
                  const summary = getCoachSummaryForMentor(intern.id);
                  const progress = week1OutputCompletionPct(getParticipantWeek1Outputs(intern.id));
                  const identity = deriveVentureIdentity(intern.id, intern.squad ?? '');

                  return (
                    <li
                      key={intern.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-spike/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900">{intern.name}</h3>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{identity.ventureName}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-spike-muted px-2 py-0.5 text-xs font-bold text-spike">
                          {progress}%
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {summary?.ambition?.trim() || summary?.tagline?.trim() || 'Venture work in progress.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <MiniLink to={mentorParticipantReviewHref(intern.id, 'overview')} icon={Sparkles} label="Open" />
                        <MiniLink
                          to={mentorParticipantReviewHref(intern.id, 'feedback')}
                          icon={MessageSquare}
                          label="Feedback"
                          primary
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

/** @param {{ to: string, icon: import('lucide-react').LucideIcon, label: string, primary?: boolean }} props */
function MiniLink({ to, icon, label, primary }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
        primary ? 'bg-spike text-white hover:bg-spike-light' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {createElement(icon, { size: 12 })}
      {label}
    </Link>
  );
}
