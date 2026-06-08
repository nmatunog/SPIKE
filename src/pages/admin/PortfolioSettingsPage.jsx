import { Link } from 'react-router-dom';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { ROUTES } from '../../routes/paths.js';

/** Admin — portfolio eligibility & showcase defaults (Sprint 06C scaffold). */
export function PortfolioSettingsPage() {
  return (
    <PageContainer>
      <PageTitle>Portfolio Settings</PageTitle>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Configure which Content Studio activities are portfolio-eligible and default privacy for intern showcases.
        Full CMS wiring ships with Content Studio portfolio flags.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section className="spike-card space-y-3">
          <h3 className="font-semibold text-slate-900">Portfolio-eligible content</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex justify-between gap-4">
              <span>Day 1 Dream Board</span>
              <span className="font-semibold text-emerald-700">Eligible</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Customer Persona worksheets</span>
              <span className="font-semibold text-emerald-700">Eligible</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Knowledge quizzes</span>
              <span className="font-semibold text-slate-400">Not eligible</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>AI Venture Coach statements</span>
              <span className="font-semibold text-emerald-700">Eligible</span>
            </li>
          </ul>
          <Link to={ROUTES.adminContentStudio} className="text-sm font-semibold text-spike hover:underline">
            Manage in Content Studio →
          </Link>
        </section>

        <section className="spike-card space-y-3">
          <h3 className="font-semibold text-slate-900">Default showcase privacy</h3>
          <p className="text-sm text-slate-600">
            New intern portfolios default to <strong>Private</strong>. Interns can enable share links from Portfolio
            Export after coach completion.
          </p>
          <p className="text-sm text-slate-600">
            Public portfolios expose cover, identity, dream board, executive canvas summary, and badges — never internal
            evaluations or mentor notes.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
