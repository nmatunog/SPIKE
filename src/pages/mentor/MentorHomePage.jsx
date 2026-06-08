import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, Sparkles, Users } from 'lucide-react';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { RoleDashboardCards } from '../../components/dashboard/RoleDashboardCards.jsx';
import { MentorDay1Panel } from '../../components/day1/MentorDay1Panel.jsx';
import { FrameworkMetric } from '../../components/framework/FrameworkSections.jsx';
import {
  deriveBlueprintCompletionPct,
  deriveMentorRiskFlags,
  groupInternsBySquad,
} from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{
 *   user: object,
 *   interns: Array<object>,
 *   internSummary: object,
 *   pendingLogs: Array<object>,
 *   showToast: (message: string, type?: string) => void,
 * }} props
 */
export function MentorHomePage({ user, interns, internSummary, pendingLogs = [], showToast }) {
  const squads = groupInternsBySquad(interns);
  const atRisk = deriveMentorRiskFlags(interns);
  const avgBlueprint = internSummary.n
    ? Math.round(
        interns.reduce((sum, i) => sum + deriveBlueprintCompletionPct(i.id), 0) / internSummary.n,
      )
    : 0;

  return (
    <PageContainer>
      <PageTitle subtitle="Growth & Venture Coach — develop the person, not the curriculum.">
        Mentor Operating Framework
      </PageTitle>

      <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <strong>Mentor answers:</strong> What should participants become? You own discussions, coaching,
        reflection, career conversations, and accountability — not classroom delivery.
      </div>

      <RoleDashboardCards
        role="mentor"
        user={user}
        interns={interns}
        internSummary={internSummary}
        pendingLogs={pendingLogs.length}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FrameworkMetric label="Participants" value={internSummary.n} sub="in cohort" />
        <FrameworkMetric label="Squads" value={squads.length} sub="active groups" accent="text-sky-700" />
        <FrameworkMetric label="Blueprint avg" value={`${avgBlueprint}%`} sub="Venture Coach progress" accent="text-emerald-700" />
        <FrameworkMetric label="At risk" value={atRisk.length} sub="licensing window" accent="text-amber-700" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={ROUTES.mentorPlaybook} className="spike-btn-primary inline-flex items-center gap-2">
          <BookOpen size={18} /> Mentor Playbook
        </Link>
        <Link to={`${ROUTES.mentorHome}/advisory`} className="spike-btn-secondary inline-flex items-center gap-2">
          Traction & hours
        </Link>
        <Link to={ROUTES.mentorVentureCoach} className="spike-btn-secondary inline-flex items-center gap-2">
          <Sparkles size={18} /> Venture Coach reviews
        </Link>
        <Link to={ROUTES.playbook} className="spike-btn-secondary inline-flex items-center gap-2">
          <Users size={18} /> Playbook progress
        </Link>
      </div>

      {squads.length ? (
        <section className="mt-6 spike-card">
          <h3 className="text-sm font-semibold text-slate-900">Assigned squads</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {squads.map((squad) => (
              <li key={squad.name} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="font-semibold text-slate-900">{squad.name}</span>
                <span className="text-slate-500"> · {squad.count} members</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {atRisk.length ? (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <AlertTriangle size={16} /> Upcoming reviews
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {atRisk.map((intern) => (
              <li key={intern.id}>
                <Link to={`${ROUTES.mentorVentureCoach}/${intern.id}`} className="font-semibold hover:underline">
                  {intern.name}
                </Link>{' '}
                — {intern.hours}h, not yet licensed
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-6">
        <MentorDay1Panel
          mentorId={user?.id}
          interns={interns.map((i) => ({ id: i.id, name: i.name }))}
          showToast={showToast}
        />
      </div>
    </PageContainer>
  );
}
