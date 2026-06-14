import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Layers, Sparkles } from 'lucide-react';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { RoleDashboardCards } from '../../components/dashboard/RoleDashboardCards.jsx';
import { FacultyDay1Panel } from '../../components/day1/FacultyDay1Panel.jsx';
import { FacultyDashboardPanels } from '../../components/faculty/FacultyDashboardPanels.jsx';
import { FacultyWeek1ProgressPanel } from '../../components/faculty/FacultyWeek1ProgressPanel.jsx';
import { FrameworkMetric } from '../../components/framework/FrameworkSections.jsx';
import { ROUTES } from '../../routes/paths.js';
import { countSubmittedSurveys } from '../../lib/surveyService.js';
import { deriveFacultyDashboardMetrics } from '../../lib/sprint01Metrics.js';
import { FACULTY_PHILOSOPHY } from '../../lib/facultyWeek1Constants.js';
import { DailyActivationCodeCard } from '../../components/dashboard/DailyActivationCodeCard.jsx';
import { BrandLexiconDashboardCard } from '../../components/resources/BrandLexiconDashboardCard.jsx';

/**
 * @param {{
 *   interns: Array<object>,
 *   internSummary: object,
 *   pendingLogs: Array<object>,
 * }} props
 */
export function FacultyHomePage({ interns, internSummary, pendingLogs = [] }) {
  const licensedCount = interns.filter((i) => i.licensed).length;
  const metrics = deriveFacultyDashboardMetrics(internSummary, {
    pendingLogs: pendingLogs.length,
    licensedCount,
  });
  const surveyComplete = interns.filter((i) => countSubmittedSurveys(i.id) > 0).length;
  const surveyPct = internSummary.n ? Math.round((surveyComplete / internSummary.n) * 100) : 0;

  return (
    <PageContainer>
      <PageTitle subtitle="Learning Experience Leader — teach, facilitate, assess, and standardize curriculum delivery.">
        Program Coach Operating Framework
      </PageTitle>

      <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-950">
        {FACULTY_PHILOSOPHY}
      </div>

      <BrandLexiconDashboardCard />

      <DailyActivationCodeCard className="mt-4" />

      <RoleDashboardCards
        role="faculty"
        user={null}
        interns={interns}
        internSummary={internSummary}
        pendingLogs={pendingLogs.length}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FrameworkMetric label="Cohort completion" value={`${metrics.cohortProgress}%`} sub="avg hours progress" />
        <FrameworkMetric label="Day completion" value="Week 1" sub="5-day framework active" accent="text-indigo-700" />
        <FrameworkMetric label="Survey completion" value={`${surveyPct}%`} sub="submitted surveys" accent="text-emerald-700" />
        <FrameworkMetric label="Licensed" value={`${metrics.assessmentPassRate}%`} sub="licensing rate" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={ROUTES.programCoachPlaybook} className="spike-btn-primary inline-flex items-center gap-2">
          <GraduationCap size={18} /> Program Coach Playbook
        </Link>
        <Link to={`${ROUTES.programCoachHome}/advisory`} className="spike-btn-secondary inline-flex items-center gap-2">
          Traction & hours
        </Link>
        <Link to={ROUTES.adminProgramCoachPlaybook} className="spike-btn-secondary inline-flex items-center gap-2">
          <Layers size={18} /> Manage templates
        </Link>
        <Link to={ROUTES.adminContentStudio} className="spike-btn-secondary inline-flex items-center gap-2">
          <BookOpen size={18} /> Content Studio
        </Link>
        <Link to={ROUTES.playbook} className="spike-btn-secondary inline-flex items-center gap-2">
          <Sparkles size={18} /> Deliver Playbook
        </Link>
      </div>

      <div className="mt-6 space-y-6">
        <FacultyWeek1ProgressPanel interns={interns} />
        <FacultyDashboardPanels interns={interns} />
        <FacultyDay1Panel interns={interns.map((i) => ({ id: i.id, name: i.name }))} />
      </div>
    </PageContainer>
  );
}
