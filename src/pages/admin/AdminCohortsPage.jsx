import { Link } from 'react-router-dom';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { CohortOnboardingControls } from '../../components/faculty/CohortOnboardingControls.jsx';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ staffId: string, interns?: Array<{ id: string, name: string }> }} props
 */
export function AdminCohortsPage({ staffId, interns = [] }) {
  return (
    <PageContainer wide>
      <PageTitle subtitle="Manage founding cohort suggestions, voting, reveal, and squad assignment.">
        Cohort management
      </PageTitle>

      <CohortOnboardingControls staffId={staffId} interns={interns} canAssignSquads />

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={ROUTES.adminSquadThemes} className="spike-btn-secondary">
          Squad themes
        </Link>
        <Link to={ROUTES.adminSquads} className="spike-btn-secondary">
          Squad assignment
        </Link>
        <Link to={ROUTES.admin} className="text-sm font-semibold text-spike hover:underline">
          ← Admin home
        </Link>
      </div>
    </PageContainer>
  );
}
