import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { useInternWorkHydration } from '../hooks/useInternWorkHydration.js';
import { PortfolioDeliverablesSection } from '../components/venturePortfolio/PortfolioDeliverablesSection.jsx';
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
import { PortfolioPresentationView } from '../components/venturePortfolio/PortfolioPresentationView.jsx';
import { PortfolioStageGateCertificates } from '../components/stageGate/PortfolioStageGateCertificates.jsx';
import { StageGatePortfolioCelebration } from '../components/stageGate/StageGatePortfolioCelebration.jsx';
import {
  ensurePitchCertificatesFromPortfolio,
} from '../lib/stageGateService.js';
import { readPendingPortfolioCelebration } from '../lib/stageGatePortfolioCelebration.js';
import {
  generateVenturePortfolio,
} from '../services/portfolioGenerator.js';
import {
  ROUTES,
  defaultRouteForRole,
  parseStageGateCertificatePath,
  portfolioTabFromPath,
  PORTFOLIO_TABS,
} from '../routes/paths.js';
import { StageGateCertificatePage } from './stageGate/StageGateCertificatePage.jsx';
import { InternWorkHydrationAlert } from '../components/intern/InternWorkHydrationAlert.jsx';
import { isSuperuserInternPreviewUser } from '../lib/superuserInternPreview.js';

/**
 * @param {{
 *   user: { id: string, name?: string, email?: string, internProgress?: object | null },
 *   section?: string,
 * }} props
 */
export function MyVenturePortfolioShell({ user, section = 'overview' }) {
  const participantName = user.name || user.email || 'Participant';
  const { version: hydrateVersion, ready: hydrateReady, error: hydrateError } = useInternWorkHydration(user.id);
  const portfolio = generateVenturePortfolio(user.id, {
    participantName,
    internProgress: user.internProgress,
  });

  const activeTab = portfolioTabFromPath(
    section === 'present' ? `${ROUTES.myVenturePortfolio}/present` : `${ROUTES.myVenturePortfolio}/${section}`,
  );
  const activeSection = section === 'present' ? 'present' : section;

  if (section === 'present') {
    return <PortfolioPresentationView portfolio={portfolio} />;
  }

  return (
    <PageContainer presentation wide>
      {isSuperuserInternPreviewUser(user) ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Sample intern portfolio</p>
          <p className="mt-1 text-amber-900/90">
            Mock data for superuser preview — Alex Rivera, Segment 2, 248 hours, Squad Catalyst.
          </p>
        </div>
      ) : null}
      <InternWorkHydrationAlert ready={hydrateReady} error={hydrateError} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={ROUTES.ventureBlueprint}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-spike"
        >
          <ArrowLeft size={16} /> Build
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
            {PORTFOLIO_TABS.map((tab) => (
              <Link
                key={tab.id}
                to={`${ROUTES.myVenturePortfolio}/${tab.id}`}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  activeTab === tab.id && section !== 'present'
                    ? 'bg-spike text-white shadow-sm'
                    : 'text-slate-700 hover:bg-spike-muted hover:text-spike'
                }`}
                aria-current={activeTab === tab.id && section !== 'present' ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0" key={hydrateVersion}>
          {renderTab(activeTab, activeSection, portfolio, user.id, participantName)}
        </main>
      </div>
    </PageContainer>
  );
}

/** @param {string} tabId @param {string} sectionId @param {ReturnType<typeof generateVenturePortfolio>} portfolio @param {string} participantId @param {string} participantName */
function renderTab(tabId, sectionId, portfolio, participantId, participantName) {
  if (sectionId === 'present') {
    return <PortfolioPresentationView portfolio={portfolio} />;
  }

  const tab = PORTFOLIO_TABS.find((item) => item.id === tabId) ?? PORTFOLIO_TABS[0];

  switch (tab.id) {
    case 'identity':
      return (
        <div className="space-y-8">
          <PortfolioIdentitySection portfolio={portfolio} />
          <PortfolioDreamBoardSection portfolio={portfolio} />
          <PortfolioCareerSection portfolio={portfolio} />
        </div>
      );
    case 'work':
      return (
        <div className="space-y-8">
          <PortfolioCanvasSection portfolio={portfolio} />
          <PortfolioResearchSection portfolio={portfolio} />
          <PortfolioDeliverablesSection participantId={participantId} />
        </div>
      );
    case 'share':
      return (
        <div className="space-y-8">
          <PortfolioPresentationsSection portfolio={portfolio} participantId={participantId} />
          <PortfolioCertificationsSection portfolio={portfolio} />
          <PortfolioStageGateCertificates
            participantId={participantId}
            participantName={participantName}
          />
          <PortfolioMilestonesSection portfolio={portfolio} />
          <PortfolioExportSection
            portfolio={portfolio}
            participantId={participantId}
            participantName={participantName}
          />
        </div>
      );
    case 'overview':
    default:
      return (
        <PortfolioOverviewSection
          portfolio={portfolio}
          participantId={participantId}
          participantName={participantName}
        />
      );
  }
}

/**
 * Route wrapper — `/my-venture-portfolio/:section?`
 * SpikeMasterPortal uses a catch-all route, so section is parsed from pathname (not useParams).
 * @param {{ user: { id: string, name?: string, email?: string, internProgress?: object | null } }} props
 */
export function MyVenturePortfolioRoute({ user }) {
  const { pathname } = useLocation();
  const certWeek = parseStageGateCertificatePath(pathname);
  const [celebration, setCelebration] = useState(() => readPendingPortfolioCelebration(user.id));

  useEffect(() => {
    let cancelled = false;

    function syncCelebration() {
      const pending = readPendingPortfolioCelebration(user.id);
      if (!cancelled) setCelebration(pending);
    }

    void ensurePitchCertificatesFromPortfolio(user.id).then(syncCelebration);
    syncCelebration();

    function onCertificateIssued(event) {
      const detail = /** @type {CustomEvent<{ participantId?: string }>} */ (event).detail;
      if (detail?.participantId && detail.participantId !== user.id) return;
      syncCelebration();
    }

    window.addEventListener('spike-stage-gate-certificate-issued', onCertificateIssued);
    return () => {
      cancelled = true;
      window.removeEventListener('spike-stage-gate-certificate-issued', onCertificateIssued);
    };
  }, [user.id]);

  if (celebration && !certWeek) {
    return (
      <StageGatePortfolioCelebration
        participantId={user.id}
        closingWeek={celebration.closingWeek}
      />
    );
  }

  if (certWeek) {
    return <StageGateCertificatePage user={user} closingWeek={certWeek} />;
  }
  if (pathname.endsWith('/present')) {
    return <MyVenturePortfolioShell user={user} section="present" />;
  }
  if (pathname === ROUTES.myVenturePortfolio) {
    if (!user?.internProgress) {
      return <Navigate to={defaultRouteForRole('intern')} replace />;
    }
    return <MyVenturePortfolioShell user={user} section="overview" />;
  }
  const slug = pathname.slice(`${ROUTES.myVenturePortfolio}/`.length).split('/').filter(Boolean)[0] ?? 'overview';
  const tab = portfolioTabFromPath(pathname);
  const legacySectionIds = [
    'identity',
    'dream-board',
    'career',
    'canvas',
    'research',
    'deliverables',
    'milestones',
    'presentations',
    'certifications',
    'export',
  ];
  if (legacySectionIds.includes(slug) && slug !== tab) {
    return <Navigate to={`${ROUTES.myVenturePortfolio}/${tab}`} replace />;
  }
  const section = PORTFOLIO_TABS.some((item) => item.id === slug) ? slug : tab;
  if (!user?.internProgress) {
    return <Navigate to={defaultRouteForRole('intern')} replace />;
  }
  return <MyVenturePortfolioShell user={user} section={section} />;
}
