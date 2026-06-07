import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { BlueprintStateHeader } from '../components/blueprint/BlueprintStateHeader.jsx';
import { BlueprintModuleNav } from '../components/blueprint/BlueprintModuleNav.jsx';
import { CareerTrackPicker } from '../components/blueprint/CareerTrackPicker.jsx';
import { buildParticipantState } from '../lib/participantState.js';
import { getBlueprintModule, isSharedBlueprintModule } from '../lib/blueprintModules.js';
import { ROUTES } from '../routes/paths.js';
import { hydrateVentureBlueprint } from '../lib/ventureBlueprintSync.js';
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
import { MilestonesModule } from '../components/blueprint/modules/MilestonesModule.jsx';
import { VentureBoardModule } from '../components/blueprint/modules/VentureBoardModule.jsx';
import { Day1BuildersShell } from '../components/day1/Day1BuildersShell.jsx';
import { VentureCoachShell } from '../components/ventureCoach/VentureCoachShell.jsx';

/**
 * @param {{ user: { id: string, internProgress?: object | null }, onLogTraction?: () => void, onProgressRefresh?: (progress: object) => void }} props
 */
export function VentureBlueprintShell({ user, onLogTraction, onProgressRefresh }) {
  const participantName = user.name || user.email || 'Participant';
  const location = useLocation();
  const [, setHydrateGeneration] = useState(0);
  const [progress, setProgress] = useState(user.internProgress);

  useEffect(() => {
    setProgress(user.internProgress);
  }, [user.internProgress]);

  useEffect(() => {
    let cancelled = false;
    void hydrateVentureBlueprint(user.id).then(() => {
      if (!cancelled) setHydrateGeneration((g) => g + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

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
  const isDay1Builders = moduleSlug === 'day-1-builders';
  const isCoach = moduleSlug === 'coach';

  const activeModule = getBlueprintModule(moduleSlug) ?? getBlueprintModule('overview');
  const showTrackPicker = needsCareerTrackSelection(user.id, progress);
  const isOverview = moduleSlug === 'overview';
  const headerVariant = isOverview ? 'full' : 'compact';

  function handleTrackComplete(nextProgress) {
    setProgress(nextProgress);
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
        return <CanvasEditorModule participantId={user.id} state={state} />;
      case 'market-intelligence':
        return <MarketIntelligencePanel participantId={user.id} />;
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
        return <VentureCoachShell participantId={user.id} section={coachSection} />;
      case 'day-1-builders':
        return (
          <Day1BuildersShell
            participantId={user.id}
            participantName={participantName}
            squadName={progress?.squad ?? user.internProgress?.squad}
          />
        );
      case 'overview':
      default:
        return (
          <BlueprintOverviewPanel
            state={state}
            participantId={user.id}
            onLogTraction={onLogTraction}
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
          Track-specific modules unlock after Week 1. For now, use Foundation and Growth sections in
          the menu.
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
    <PageContainer presentation={isExecutiveSummary || isDay1Builders || isCoach} wide={isExecutiveSummary || isDay1Builders || isCoach}>
      {showTrackPicker ? (
        <CareerTrackPicker
          userId={user.id}
          internProgress={progress}
          onComplete={handleTrackComplete}
        />
      ) : null}

      <BlueprintStateHeader
        state={state}
        participantId={user.id}
        variant={headerVariant}
      />

      {!isDay1Builders && !isExecutiveSummary && !isCoach ? (
      <div className="mb-4 space-y-3 lg:hidden">
        <BlueprintModuleNav
          careerTrack={state.career_track}
          activeSlug={moduleSlug}
          variant="select"
        />
      </div>
      ) : null}

      <div
        className={
          isDay1Builders || isExecutiveSummary || isCoach
            ? 'min-w-0'
            : 'grid grid-cols-1 gap-6 lg:grid-cols-[minmax(200px,240px)_1fr] xl:grid-cols-[minmax(220px,260px)_1fr] 2xl:grid-cols-[minmax(260px,300px)_1fr] 2xl:gap-8'
        }
      >
        {!isDay1Builders && !isExecutiveSummary && !isCoach ? (
        <aside className="hidden lg:block">
          <div className="sticky top-[4.5rem] rounded-2xl border border-slate-200/80 bg-white p-3 shadow-card lg:top-24 xl:p-4 2xl:top-28">
            <BlueprintModuleNav careerTrack={state.career_track} activeSlug={moduleSlug} />
          </div>
        </aside>
        ) : null}

        <div className="min-w-0">
          {!isOverview && !isExecutiveSummary && !isDay1Builders && !isCoach ? (
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
