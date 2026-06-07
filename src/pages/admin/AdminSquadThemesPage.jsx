import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { getActiveTheme, getSquadThemes, setActiveTheme } from '../../lib/cohortFormationService.js';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/paths.js';

export function AdminSquadThemesPage() {
  const themes = getSquadThemes();
  const active = getActiveTheme();

  return (
    <PageContainer wide>
      <PageTitle subtitle="Choose the squad naming theme for this cohort.">
        Squad theme library
      </PageTitle>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {themes.map((theme) => (
          <section
            key={theme.id}
            className={`spike-card ${active.id === theme.id ? 'ring-2 ring-spike' : ''}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {theme.icon} {theme.name}
              </h3>
              {active.id === theme.id ? (
                <span className="rounded-full bg-spike px-2 py-0.5 text-2xs font-bold text-white">
                  Active
                </span>
              ) : null}
            </div>
            <p className="mb-4 text-sm text-slate-600">{theme.description}</p>
            <div className="flex flex-wrap gap-2">
              {theme.items.map((item) => (
                <span
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold"
                >
                  {item.icon} {item.name}
                </span>
              ))}
            </div>
            {active.id !== theme.id ? (
              <button
                type="button"
                onClick={() => setActiveTheme(theme.id)}
                className="mt-4 spike-btn-secondary text-sm"
              >
                Set as cohort theme
              </button>
            ) : null}
          </section>
        ))}
      </div>

      <Link to={ROUTES.adminCohorts} className="mt-6 inline-flex text-sm font-semibold text-spike hover:underline">
        ← Cohort admin
      </Link>
    </PageContainer>
  );
}
