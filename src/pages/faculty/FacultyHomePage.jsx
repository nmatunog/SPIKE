import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { StaffCoachHomeDashboard } from '../../components/staff/StaffCoachHomeDashboard.jsx';
import { useCohortProgramDay } from '../../hooks/useCohortProgramDay.js';
import { Day1CohortOutputsPanel } from '../../components/day1/Day1CohortOutputsPanel.jsx';
import { FacultyDay1Panel } from '../../components/day1/FacultyDay1Panel.jsx';
import { FacultyDashboardPanels } from '../../components/faculty/FacultyDashboardPanels.jsx';
import { FacultyWeek1ProgressPanel } from '../../components/faculty/FacultyWeek1ProgressPanel.jsx';
import { ROUTES, staffStageGateHref } from '../../routes/paths.js';
import { DailyActivationCodeCard } from '../../components/dashboard/DailyActivationCodeCard.jsx';
import { FacultyCohortSyncPanel } from '../../components/faculty/FacultyCohortSyncPanel.jsx';
import { CohortOnboardingControls } from '../../components/faculty/CohortOnboardingControls.jsx';

/**
 * @param {{
 *   interns: Array<object>,
 *   internSummary: object,
 *   pendingLogs: Array<object>,
 *   staffId?: string,
 *   staffName?: string,
 *   onSquadChanged?: () => void,
 * }} props
 */
export function FacultyHomePage({
  interns,
  staffId = '',
  staffName = 'Coach',
  onSquadChanged,
}) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const { cohortStartDate, programDay } = useCohortProgramDay();
  const stageGateHref = staffStageGateHref('faculty', 1, programDay.week);

  return (
    <PageContainer wide>
      <StaffCoachHomeDashboard
        role="faculty"
        staffName={staffName}
        interns={interns}
        homeHref={ROUTES.programCoachHome}
        cohortStartDate={cohortStartDate}
      />

      <div className="mt-10 border-t border-slate-200 pt-8">
        <button
          type="button"
          onClick={() => setToolsOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Program delivery tools
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
            {staffId ? (
              <CohortOnboardingControls
                staffId={staffId}
                interns={interns.map((i) => ({ id: i.id, name: i.name }))}
                canAssignSquads
                onSquadChanged={onSquadChanged}
              />
            ) : (
              <section className="spike-card p-4 text-sm text-amber-800">
                Sign in with a staff account to manage cohort onboarding.
              </section>
            )}
            <Day1CohortOutputsPanel
              interns={interns.map((i) => ({ id: i.id, name: i.name, squad: i.squad }))}
              viewerRole="faculty"
            />
            <FacultyCohortSyncPanel interns={interns.map((i) => ({ id: i.id, name: i.name }))} />
            <FacultyWeek1ProgressPanel interns={interns} />
            <FacultyDashboardPanels interns={interns} />
            <FacultyDay1Panel interns={interns.map((i) => ({ id: i.id, name: i.name }))} />
            <div className="flex flex-wrap gap-2">
              <Link to={ROUTES.adminContentStudio} className="spike-btn-secondary text-sm">
                Content Studio
              </Link>
              <Link to={stageGateHref} className="spike-btn-secondary text-sm">
                Stage gate ceremony
              </Link>
              <Link to={`${ROUTES.programCoachHome}/advisory`} className="spike-btn-secondary text-sm">
                Traction &amp; hours
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
