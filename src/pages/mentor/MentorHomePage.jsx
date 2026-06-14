import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, Sparkles, Users } from 'lucide-react';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { RoleDashboardCards } from '../../components/dashboard/RoleDashboardCards.jsx';
import { MentorDay1Panel } from '../../components/day1/MentorDay1Panel.jsx';
import { MentorDayDebriefPanel } from '../../components/mentor/MentorDayDebriefPanel.jsx';
import { MentorWeek1QuickPanel } from '../../components/mentor/MentorWeek1QuickPanel.jsx';
import { FrameworkMetric } from '../../components/framework/FrameworkSections.jsx';
import { MentorDashboardPanels } from '../../components/mentor/MentorDashboardPanels.jsx';
import { MENTOR_PHILOSOPHY } from '../../lib/mentorWeek1Constants.js';
import {
  deriveBlueprintCompletionPct,
  deriveMentorRiskFlags,
  groupInternsBySquad,
} from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES } from '../../routes/paths.js';
import { DailyActivationCodeCard } from '../../components/dashboard/DailyActivationCodeCard.jsx';
import { BrandLexiconDashboardCard } from '../../components/resources/BrandLexiconDashboardCard.jsx';
import { CohortOnboardingControls } from '../../components/faculty/CohortOnboardingControls.jsx';

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
        {MENTOR_PHILOSOPHY}
      </div>

      <BrandLexiconDashboardCard />

      <DailyActivationCodeCard className="mt-4" />

      {user?.id ? (
        <div className="mt-4">
          <CohortOnboardingControls staffId={user.id} photoOnly />
        </div>
      ) : null}

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

      <MentorDashboardPanels interns={interns} />

      {atRisk.length ? (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
            <AlertTriangle size={16} /> Upcoming reviews
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {atRisk.map((intern) => (
              <li key={intern.id}>
                <Link to={`${ROUTES.mentorParticipant}/${intern.id}`} className="font-semibold hover:underline">
                  {intern.name}
                </Link>{' '}
                — {intern.hours}h, not yet licensed
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-6 space-y-6">
        <MentorWeek1QuickPanel />
        {user?.id ? <MentorDayDebriefPanel mentorId={user.id} showToast={showToast} /> : null}
        <MentorDay1Panel
          mentorId={user?.id}
          interns={interns.map((i) => ({ id: i.id, name: i.name }))}
          showToast={showToast}
        />
      </div>
    </PageContainer>
  );
}
