import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import {
  PortfolioCanvasSection,
  PortfolioCareerSection,
  PortfolioCertificationsSection,
  PortfolioDreamBoardSection,
  PortfolioExportSection,
  PortfolioIdentitySection,
  PortfolioMilestonesSection,
  PortfolioOverviewSection,
  PortfolioPresentationsSection,
  PortfolioResearchSection,
} from '../components/venturePortfolio/PortfolioSections.jsx';
import {
  generateVenturePortfolio,
  PORTFOLIO_NAV_SECTIONS,
} from '../services/portfolioGenerator.js';
import { ROUTES, portfolioSectionFromPath } from '../routes/paths.js';

/**
 * @param {{
 *   user: { id: string, name?: string, email?: string, internProgress?: object | null },
 *   section?: string,
 * }} props
 */
export function MyVenturePortfolioShell({ user, section = 'overview' }) {
  const participantName = user.name || user.email || 'Participant';
  const portfolio = generateVenturePortfolio(user.id, {
    participantName,
    internProgress: user.internProgress,
  });

  const activeSection = PORTFOLIO_NAV_SECTIONS.some((item) => item.id === section) ? section : 'overview';

  return (
    <PageContainer presentation wide>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={ROUTES.ventureBlueprint}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-spike"
        >
          <ArrowLeft size={16} /> Blueprint
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Briefcase size={16} className="text-spike" />
          <span className="font-semibold text-slate-800">My Venture Portfolio™</span>
          <span>·</span>
          <span>{portfolio.cover.portfolioCompletion}% complete</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(200px,240px)_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="spike-card space-y-1 p-2" aria-label="Portfolio sections">
            {PORTFOLIO_NAV_SECTIONS.map((item) => (
              <Link
                key={item.id}
                to={`${ROUTES.myVenturePortfolio}/${item.id}`}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeSection === item.id
                    ? 'bg-spike text-white shadow-sm'
                    : 'text-slate-700 hover:bg-spike-muted hover:text-spike'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{renderSection(activeSection, portfolio, user.id, participantName)}</main>
      </div>
    </PageContainer>
  );
}

/** @param {string} sectionId @param {ReturnType<typeof generateVenturePortfolio>} portfolio @param {string} participantId @param {string} participantName */
function renderSection(sectionId, portfolio, participantId, participantName) {
  switch (sectionId) {
    case 'identity':
      return <PortfolioIdentitySection portfolio={portfolio} />;
    case 'dream-board':
      return <PortfolioDreamBoardSection portfolio={portfolio} />;
    case 'career':
      return <PortfolioCareerSection portfolio={portfolio} />;
    case 'canvas':
      return <PortfolioCanvasSection portfolio={portfolio} />;
    case 'research':
      return <PortfolioResearchSection portfolio={portfolio} />;
    case 'milestones':
      return <PortfolioMilestonesSection portfolio={portfolio} />;
    case 'presentations':
      return <PortfolioPresentationsSection portfolio={portfolio} />;
    case 'certifications':
      return <PortfolioCertificationsSection portfolio={portfolio} />;
    case 'export':
      return (
        <PortfolioExportSection
          portfolio={portfolio}
          participantId={participantId}
          participantName={participantName}
        />
      );
    case 'overview':
    default:
      return <PortfolioOverviewSection portfolio={portfolio} />;
  }
}

/**
 * Route wrapper — `/my-venture-portfolio/:section?`
 * SpikeMasterPortal uses a catch-all route, so section is parsed from pathname (not useParams).
 * @param {{ user: { id: string, name?: string, email?: string, internProgress?: object | null } }} props
 */
export function MyVenturePortfolioRoute({ user }) {
  const { pathname } = useLocation();
  const section = portfolioSectionFromPath(
    pathname,
    PORTFOLIO_NAV_SECTIONS.map((item) => item.id),
  );
  if (!user?.internProgress) {
    return <Navigate to={ROUTES.home} replace />;
  }
  return <MyVenturePortfolioShell user={user} section={section} />;
}
