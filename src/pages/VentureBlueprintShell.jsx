import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { InternWorkHydrationAlert } from '../components/intern/InternWorkHydrationAlert.jsx';
import { BlueprintStateHeader } from '../components/blueprint/BlueprintStateHeader.jsx';
import { BlueprintModuleNav } from '../components/blueprint/BlueprintModuleNav.jsx';
import { CareerTrackPicker } from '../components/blueprint/CareerTrackPicker.jsx';
import { buildParticipantState } from '../lib/participantState.js';
import { getBlueprintModule, isSharedBlueprintModule } from '../lib/blueprintModules.js';
import { ROUTES, BLUEPRINT_LINKS } from '../routes/paths.js';
import { useInternWorkHydration } from '../hooks/useInternWorkHydration.js';
import { needsCareerTrackSelection } from '../lib/careerTrackService.js';
import {
  BlueprintOverviewPanel,
  CareerAcceleratorPanel,
  ClientGrowthPanel,
  ExportCenterPanel,
  LeadershipPanel,
  MarketIntelligencePanel,
  RecruitmentPanel,
  SpecialistBlueprintPanel,
  VisionPurposePanel,
} from '../components/blueprint/modules/BlueprintModulePanels.jsx';
import { CanvasEditorModule } from '../components/blueprint/modules/CanvasEditorModule.jsx';
import { ExecutiveCanvasSummary } from '../components/blueprint/modules/ExecutiveCanvasSummary.jsx';
import { VentureDesignStudio } from './VentureDesignStudio.jsx';
import { MilestonesModule } from '../components/blueprint/modules/MilestonesModule.jsx';
import { VentureBoardModule } from '../components/blueprint/modules/VentureBoardModule.jsx';
import { BlueprintJourneyNav } from '../components/blueprint/BlueprintJourneyNav.jsx';
import { Day1BuildersShell } from '../components/day1/Day1BuildersShell.jsx';
import { VentureCoachShell } from '../components/ventureCoach/VentureCoachShell.jsx';
import { isWeek1BuildSimplifiedMode } from '../lib/programContext.js';
import { CustomerDiscoveryShell } from './customerDiscovery/CustomerDiscoveryShell.jsx';

/**
 * @param {{ user: { id: string, internProgress?: object | null }, viewerRole?: string, onLogTraction?: () => void, onProgressRefresh?: (progress: object) => void }} props
 */
export function VentureBlueprintShell({ user, viewerRole = 'intern', onProgressRefresh }) {
  const participantName = user.name || user.email || 'Participant';
  const location = useLocation();
  const { version: hydrateVersion, ready: hydrateReady, error: hydrateError } = useInternWorkHydration(user.id);
  const [progress, setProgress] = useState(user.internProgress);

  useEffect(() => {
    setProgress(user.internProgress);
  }, [user.internProgress]);

  const state = buildParticipantState(user.id, progress);

  const { moduleSlug, canvasSubRoute, coachSection } = useMemo(() => {
    const prefix = `${ROUTES.ventureBlueprint}/`;
    if (location.pathname.startsWith(prefix)) {
      const rest = location.pathname.slice(prefix.length);
      const segments = rest.split('/').filter(Boolean);
      return {
        moduleSlug: segments[0] || 'overview',
        canvasSubRoute: segments[0] === 'canvas' ? segments.slice(1).join('/') : '',
        coachSection: segments[0] === 'coach' ? (segments[1] ?? '') : '',
      };
    }
    return { moduleSlug: 'overview', canvasSubRoute: '', coachSection: '' };
  }, [location.pathname]);

  const isExecutiveSummary = moduleSlug === 'canvas' && canvasSubRoute === 'summary';
  const isCanvasStudio = moduleSlug === 'canvas' && !canvasSubRoute;
  const isCanvasWorkshop = moduleSlug === 'canvas' && canvasSubRoute === 'edit';
  const isDay1Builders = moduleSlug === 'day-1-builders';
  const isCoach = moduleSlug === 'coach';
  const isPortfolio = moduleSlug === 'portfolio';
  const isCustomerDiscovery = moduleSlug === 'customer-discovery';

  const activeModule = getBlueprintModule(moduleSlug) ?? getBlueprintModule('overview');
  const showTrackPicker =
    needsCareerTrackSelection(user.id, progress)
    && !isCustomerDiscovery
    && moduleSlug !== 'overview';
  const isOverview = moduleSlug === 'overview';
  const week1Simplified = isWeek1BuildSimplifiedMode(progress);
  const headerVariant = isOverview || isCustomerDiscovery ? 'none' : 'compact';
  const showJourneyNav = week1Simplified && (isOverview || isDay1Builders || isCoach);
  const showFullModuleNav = !week1Simplified && !isDay1Builders && !isExecutiveSummary && !isCoach && !isPortfolio && !isCanvasStudio && !isCustomerDiscovery;

  function handleTrackComplete(nextProgress) {
    setProgress(nextProgress ?? null);
    onProgressRefresh?.(nextProgress);
  }

  function renderModulePanel() {
    switch (moduleSlug) {
      case 'vision':
        return <VisionPurposePanel participantId={user.id} />;
      case 'canvas':
        if (canvasSubRoute === 'summary') {
          return (
            <ExecutiveCanvasSummary
              participantId={user.id}
              participantName={participantName}
              state={state}
            />
          );
        }
        if (canvasSubRoute === 'edit') {
          return <CanvasEditorModule participantId={user.id} state={state} />;
        }
        return (
          <VentureDesignStudio
            participantId={user.id}
            participantName={participantName}
            squadNameFallback={progress?.squad ?? user.internProgress?.squad ?? ''}
            careerTrack={state.career_track}
            viewerRole={viewerRole}
          />
        );
      case 'market-intelligence':
        return <Navigate to={BLUEPRINT_LINKS.customerDiscovery} replace />;
      case 'customer-discovery':
        return <CustomerDiscoveryShell user={user} />;
      case 'milestones':
        return <MilestonesModule state={state} />;
      case 'client-growth':
        return <ClientGrowthPanel state={state} participantId={user.id} />;
      case 'recruitment':
        return <RecruitmentPanel participantId={user.id} />;
      case 'leadership':
        return <LeadershipPanel participantId={user.id} />;
      case 'career':
        return <CareerAcceleratorPanel state={state} />;
      case 'specialist':
        return <SpecialistBlueprintPanel participantId={user.id} />;
      case 'venture-board':
        return <VentureBoardModule state={state} participantId={user.id} />;
      case 'export':
        return <ExportCenterPanel />;
      case 'coach':
        if (coachSection === 'purpose') {
          return <Navigate to={`${ROUTES.ventureBlueprint}/coach/impact`} replace />;
        }
        return <VentureCoachShell participantId={user.id} section={coachSection} />;
      case 'portfolio':
        return <Navigate to={ROUTES.myVenturePortfolio} replace />;
      case 'day-1-builders':
        return (
          <Day1BuildersShell
            key={hydrateVersion}
            participantId={user.id}
            participantName={participantName}
            squadName={progress?.squad ?? user.internProgress?.squad}
          />
        );
      case 'overview':
      default:
        return (
          <BlueprintOverviewPanel
            key={hydrateVersion}
            state={state}
            participantId={user.id}
            squadNameFallback={progress?.squad ?? user.internProgress?.squad ?? ''}
          />
        );
    }
  }

  if (
    activeModule
    && !state.career_track_selected
    && !isSharedBlueprintModule(activeModule)
  ) {
    return (
      <PageContainer>
        <BlueprintStateHeader state={state} participantId={user.id} variant="compact" />
        <p className="spike-card text-sm text-sky-900">
          Track-specific modules unlock when you choose your ACS track in Week 3. For now, use
          Foundation, Growth, and Customer Discovery in the menu.
        </p>
      </PageContainer>
    );
  }

  if (
    state.career_track_selected
    && activeModule
    && !activeModule.tracks.includes(state.career_track)
  ) {
    return (
      <PageContainer>
        <BlueprintStateHeader state={state} participantId={user.id} variant="compact" />
        <p className="spike-card text-sm text-amber-900">
          This module is not on your career track. Open Overview or Career Accelerator instead.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      presentation={isExecutiveSummary || isCanvasWorkshop || isCanvasStudio || isDay1Builders || isCoach || isPortfolio || isOverview}
      wide={isExecutiveSummary || isCanvasWorkshop || isCanvasStudio || isDay1Builders || isCoach || isPortfolio || isOverview}
    >
      {showTrackPicker ? (
        <CareerTrackPicker
          userId={user.id}
          internProgress={progress}
          onComplete={handleTrackComplete}
        />
      ) : null}

      {hydrateError || !hydrateReady ? (
        <InternWorkHydrationAlert ready={hydrateReady} error={hydrateError} />
      ) : null}

      {headerVariant !== 'none' ? (
        <BlueprintStateHeader
          state={state}
          participantId={user.id}
          variant={headerVariant}
        />
      ) : null}

      {!isDay1Builders && !isExecutiveSummary && !isCoach && !isPortfolio && !isCanvasStudio ? (
      <div className="mb-4 space-y-3 lg:hidden">
        {showJourneyNav ? (
          <BlueprintJourneyNav participantId={user.id} day={state.day} />
        ) : showFullModuleNav ? (
        <BlueprintModuleNav
          careerTrack={state.career_track}
          activeSlug={moduleSlug}
          variant="select"
        />
        ) : (
          <Link to={ROUTES.ventureBlueprint} className="text-sm font-semibold text-spike hover:underline">
            ← Build home
          </Link>
        )}
      </div>
      ) : null}

      <div
        className={
          isDay1Builders || isExecutiveSummary || isCoach || isPortfolio || isCanvasStudio
            ? 'min-w-0'
            : isOverview
              ? 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(160px,200px)_1fr]'
              : 'grid grid-cols-1 gap-6 lg:grid-cols-[minmax(200px,240px)_1fr] xl:grid-cols-[minmax(220px,260px)_1fr] 2xl:grid-cols-[minmax(260px,300px)_1fr] 2xl:gap-8'
        }
      >
        {!isDay1Builders && !isExecutiveSummary && !isCoach && !isPortfolio && !isCanvasStudio ? (
        <aside className="hidden lg:block">
          {showJourneyNav ? (
            <div className="sticky top-24">
              <BlueprintJourneyNav participantId={user.id} day={state.day} />
            </div>
          ) : showFullModuleNav ? (
          <div className="sticky top-[4.5rem] rounded-2xl border border-slate-200/80 bg-white p-3 shadow-card lg:top-24 xl:p-4 2xl:top-28">
            <BlueprintModuleNav careerTrack={state.career_track} activeSlug={moduleSlug} />
          </div>
          ) : (
            <div className="sticky top-24 space-y-3">
              <Link to={ROUTES.ventureBlueprint} className="text-sm font-semibold text-spike hover:underline">
                ← Build home
              </Link>
            </div>
          )}
        </aside>
        ) : null}

        <div className="min-w-0">
          {!isOverview && !isExecutiveSummary && !isDay1Builders && !isCoach && !isPortfolio && !isCanvasStudio ? (
            <header className="mb-4 lg:mb-5">
              <h3 className="text-lg font-semibold text-slate-900 lg:text-xl 2xl:text-2xl">{activeModule?.label}</h3>
              <p className="mt-1 text-sm text-slate-600 lg:text-base 2xl:text-lg">{activeModule?.description}</p>
            </header>
          ) : null}
          {renderModulePanel()}
        </div>
      </div>
    </PageContainer>
  );
}
