import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { StaffCoachHomeDashboard } from '../../components/staff/StaffCoachHomeDashboard.jsx';
import { MentorDayDebriefPanel } from '../../components/mentor/MentorDayDebriefPanel.jsx';
import { MentorWeek1QuickPanel } from '../../components/mentor/MentorWeek1QuickPanel.jsx';
import { MentorDashboardPanels } from '../../components/mentor/MentorDashboardPanels.jsx';
import { ROUTES } from '../../routes/paths.js';
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

  return (
    <PageContainer wide>
      <StaffCoachHomeDashboard
        role="mentor"
        staffName={staffName}
        interns={interns}
        homeHref={ROUTES.mentorHome}
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
            <DailyActivationCodeCard />
            {user?.id ? <CohortOnboardingControls staffId={user.id} photoOnly /> : null}
            <MentorDashboardPanels interns={interns} />
            <MentorWeek1QuickPanel />
            {user?.id ? (
              <MentorDayDebriefPanel mentorId={user.id} showToast={showToast} />
            ) : null}
            <Link to={`${ROUTES.mentorHome}/advisory`} className="spike-btn-secondary inline-flex text-sm">
              Traction &amp; hours
            </Link>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
