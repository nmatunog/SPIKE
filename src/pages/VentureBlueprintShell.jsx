import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { BlueprintStateHeader } from '../components/blueprint/BlueprintStateHeader.jsx';
import { BlueprintModuleNav } from '../components/blueprint/BlueprintModuleNav.jsx';
import { CareerTrackPicker } from '../components/blueprint/CareerTrackPicker.jsx';
import { buildParticipantState } from '../lib/participantState.js';
import { getBlueprintModule } from '../lib/blueprintModules.js';
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
import { MilestonesModule } from '../components/blueprint/modules/MilestonesModule.jsx';
import { VentureBoardModule } from '../components/blueprint/modules/VentureBoardModule.jsx';

/**
 * @param {{ user: { id: string, internProgress?: object | null }, onLogTraction?: () => void, onProgressRefresh?: (progress: object) => void }} props
 */
export function VentureBlueprintShell({ user, onLogTraction, onProgressRefresh }) {
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

  const moduleSlug = useMemo(() => {
    const prefix = `${ROUTES.ventureBlueprint}/`;
    if (location.pathname.startsWith(prefix)) {
      return location.pathname.slice(prefix.length).split('/')[0] || 'overview';
    }
    return 'overview';
  }, [location.pathname]);

  const activeModule = getBlueprintModule(moduleSlug) ?? getBlueprintModule('overview');
  const showTrackPicker = needsCareerTrackSelection(user.id, progress);

  function handleTrackComplete(nextProgress) {
    setProgress(nextProgress);
    onProgressRefresh?.(nextProgress);
  }

  function renderModulePanel() {
    switch (moduleSlug) {
      case 'vision':
        return <VisionPurposePanel participantId={user.id} />;
      case 'canvas':
        return <CanvasEditorModule participantId={user.id} />;
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

  if (!activeModule?.tracks.includes(state.career_track)) {
    return (
      <PageContainer>
        <BlueprintStateHeader state={state} participantId={user.id} />
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This Blueprint module is not available on your current career track. Open Overview or
          Career Accelerator.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {showTrackPicker ? (
        <CareerTrackPicker userId={user.id} onComplete={handleTrackComplete} />
      ) : null}

      <BlueprintStateHeader state={state} participantId={user.id} />

      <div className="mb-4 lg:hidden">
        <BlueprintModuleNav careerTrack={state.career_track} variant="mobile" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,260px)_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <BlueprintModuleNav careerTrack={state.career_track} variant="sidebar" />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{activeModule?.label}</h3>
            <p className="mt-1 text-sm text-gray-600">{activeModule?.description}</p>
          </header>
          {renderModulePanel()}
        </div>
      </div>
    </PageContainer>
  );
}
