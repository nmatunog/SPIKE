import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { StaffCoachHomeDashboard } from '../../components/staff/StaffCoachHomeDashboard.jsx';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';
import { MentorDayDebriefPanel } from '../../components/mentor/MentorDayDebriefPanel.jsx';
import { MentorWeek1QuickPanel } from '../../components/mentor/MentorWeek1QuickPanel.jsx';
import { MentorDashboardPanels } from '../../components/mentor/MentorDashboardPanels.jsx';
import { ROUTES, staffStageGateHref } from '../../routes/paths.js';
import { DailyActivationCodeCard } from '../../components/dashboard/DailyActivationCodeCard.jsx';
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
export function MentorHomePage({ user, interns, showToast }) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const staffName = user?.name || user?.email || 'Mentor';
  const { cohortStartDate, programDay } = useCohortProgramDay();
  const stageGateHref = staffStageGateHref('mentor', 1, programDay.week);

  return (
    <PageContainer wide>
      <StaffCoachHomeDashboard
        role="mentor"
        staffName={staffName}
        interns={interns}
        homeHref={ROUTES.mentorHome}
        cohortStartDate={cohortStartDate}
      />

      <div className="mt-10 border-t border-slate-200 pt-8">
        <button
          type="button"
          onClick={() => setToolsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Coaching tools &amp; week guides
          <ChevronDown size={18} className={`transition ${toolsOpen ? 'rotate-180' : ''}`} />
        </button>

        {toolsOpen ? (
          <div className="mt-4 space-y-6">
            <section className="spike-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Stage gate ceremony</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Week {programDay.week} closing — run after squad pitch (projector + unlock next stage).
                </p>
              </div>
              <Link to={stageGateHref} className="spike-btn-primary shrink-0 text-sm">
                Open stage gate
              </Link>
            </section>
            <DailyActivationCodeCard />
            {user?.id ? <CohortOnboardingControls staffId={user.id} photoOnly /> : null}
            <MentorDashboardPanels interns={interns} />
            <MentorWeek1QuickPanel />
            {user?.id ? (
              <MentorDayDebriefPanel mentorId={user.id} showToast={showToast} />
            ) : null}
            <Link to={stageGateHref} className="spike-btn-secondary inline-flex text-sm">
              Stage gate ceremony
            </Link>
            <Link to={`${ROUTES.mentorHome}/advisory`} className="spike-btn-secondary inline-flex text-sm">
              Traction &amp; hours
            </Link>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
