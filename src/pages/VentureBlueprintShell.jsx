import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { BlueprintStateHeader } from '../components/blueprint/BlueprintStateHeader.jsx';
import { BlueprintModuleNav } from '../components/blueprint/BlueprintModuleNav.jsx';
import { buildParticipantState } from '../lib/participantState.js';
import { getBlueprintModule } from '../lib/blueprintModules.js';
import { ROUTES } from '../routes/paths.js';
import {
  BlueprintOverviewPanel,
  CareerAcceleratorPanel,
  ClientGrowthPanel,
  ExportCenterPanel,
  FinancialCanvasPanel,
  LeadershipPanel,
  RecruitmentPanel,
  SpecialistBlueprintPanel,
  VentureBoardPanel,
  VisionPurposePanel,
} from '../components/blueprint/modules/BlueprintModulePanels.jsx';

/**
 * @param {{ user: { id: string, internProgress?: object | null }, onLogTraction?: () => void }} props
 */
export function VentureBlueprintShell({ user, onLogTraction }) {
  const location = useLocation();
  const state = useMemo(
    () => buildParticipantState(user.id, user.internProgress),
    [user.id, user.internProgress],
  );

  const moduleSlug = useMemo(() => {
    const prefix = `${ROUTES.ventureBlueprint}/`;
    if (location.pathname.startsWith(prefix)) {
      return location.pathname.slice(prefix.length).split('/')[0] || 'overview';
    }
    return 'overview';
  }, [location.pathname]);

  const activeModule = getBlueprintModule(moduleSlug) ?? getBlueprintModule('overview');

  function renderModulePanel() {
    switch (moduleSlug) {
      case 'vision':
        return <VisionPurposePanel />;
      case 'canvas':
        return <FinancialCanvasPanel />;
      case 'client-growth':
        return <ClientGrowthPanel state={state} />;
      case 'recruitment':
        return <RecruitmentPanel />;
      case 'leadership':
        return <LeadershipPanel />;
      case 'career':
        return <CareerAcceleratorPanel state={state} />;
      case 'specialist':
        return <SpecialistBlueprintPanel />;
      case 'venture-board':
        return <VentureBoardPanel state={state} />;
      case 'export':
        return <ExportCenterPanel />;
      case 'overview':
      default:
        return <BlueprintOverviewPanel state={state} onLogTraction={onLogTraction} />;
    }
  }

  if (!activeModule?.tracks.includes(state.career_track)) {
    return (
      <PageContainer>
        <BlueprintStateHeader state={state} />
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This Blueprint module is not available on your current career track. Open Overview or
          Career Accelerator.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BlueprintStateHeader state={state} />

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
