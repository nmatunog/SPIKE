import { useState } from 'react';
import { BarChart, BookOpen, Settings, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { ROUTES } from '../routes/paths.js';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'cohorts', label: 'Cohorts', icon: Users },
  { id: 'content', label: 'Content', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'reports', label: 'Reports', icon: BarChart },
];

function PlaceholderPanel({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  );
}

export function AdminPage({ usersPanel, settingsPanel, passwordHelpPanel }) {
  const [tab, setTab] = useState('users');

  return (
    <PageContainer>
      <div className="mb-6">
        <PageTitle>Admin</PageTitle>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          User management, cohorts, content, and system settings.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-3 scrollbar-thin">
        {TABS.map((item) => {
          const TabIcon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                tab === item.id ? 'bg-[#8B0000] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TabIcon size={16} /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'users' && (
        <div className="space-y-8">
          {usersPanel}
          {passwordHelpPanel}
        </div>
      )}

      {tab === 'cohorts' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-bold text-gray-900">Cohort & squad formation</h3>
          <p className="mb-4 text-sm text-gray-600">
            Review participant cohort identity suggestions, approve the official cohort, and manage
            squad themes and assignments.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to={ROUTES.adminCohorts} className="spike-btn-primary">
              Open cohort admin
            </Link>
            <Link to={ROUTES.adminSquadThemes} className="spike-btn-secondary">
              Squad themes
            </Link>
            <Link to={ROUTES.adminSquads} className="spike-btn-secondary">
              Assign squads
            </Link>
          </div>
        </div>
      )}

      {tab === 'content' && (
        <PlaceholderPanel
          title="Content"
          description="Playbook CMS and presentation asset management will live here. Curriculum still uses static modules for Sprint 01."
        />
      )}

      {tab === 'settings' && settingsPanel}

      {tab === 'reports' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-bold text-gray-900">Reports</h3>
          <p className="mb-4 text-sm text-gray-600">
            Full intern progress reports with extended Sprint 01 columns are on the Reports module.
          </p>
          <Link
            to={ROUTES.reports}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-[#8B0000] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-900"
          >
            Open progress reports
          </Link>
        </div>
      )}
    </PageContainer>
  );
}
