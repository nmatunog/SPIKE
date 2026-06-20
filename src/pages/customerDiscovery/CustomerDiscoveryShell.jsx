import { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { StudioShell } from '../../components/customerDiscovery/StudioShell.jsx';
import { MissionTrackNav } from '../../components/customerDiscovery/MissionTrackNav.jsx';
import { VentureStatusHero } from '../../components/customerDiscovery/VentureStatusHero.jsx';
import { DreamRibbon } from '../../components/customerDiscovery/DreamRibbon.jsx';
import { MissionBriefTask } from '../../components/customerDiscovery/MissionBriefTask.jsx';
import { InterviewGuideTask } from '../../components/customerDiscovery/InterviewGuideTask.jsx';
import { ThinkingShiftPrompt } from '../../components/customerDiscovery/ThinkingShiftPrompt.jsx';
import { getActiveWeek2Task } from '../../lib/customerDiscovery/week2MissionService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * Week 2 Customer Discovery Studio — mission track shell (Phase A–B).
 * @param {{ user: { id: string, internProgress?: { squad?: string | null } | null } }} props
 */
export function CustomerDiscoveryShell({ user }) {
  const participantId = user.id;
  const squadName = user.internProgress?.squad ?? '';
  const location = useLocation();
  const [, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  const taskSlug = useMemo(() => {
    const prefix = `${ROUTES.ventureBlueprint}/customer-discovery/`;
    if (location.pathname.startsWith(prefix)) {
      return location.pathname.slice(prefix.length).split('/').filter(Boolean)[0] ?? '';
    }
    return '';
  }, [location.pathname]);

  const activeTask = getActiveWeek2Task(participantId);
  const slug = taskSlug || activeTask.slug;

  if (location.pathname === `${ROUTES.ventureBlueprint}/customer-discovery`) {
    return <Navigate to={`${ROUTES.ventureBlueprint}/customer-discovery/${activeTask.slug}`} replace />;
  }

  function renderTask() {
    switch (slug) {
      case 'guide':
        return <InterviewGuideTask participantId={participantId} onSaved={refresh} />;
      case 'thinking':
        return <ThinkingShiftPrompt participantId={participantId} taskId="thinking" onSaved={refresh} />;
      case 'mission':
      default:
        return <MissionBriefTask participantId={participantId} squadName={squadName} onComplete={refresh} />;
    }
  }

  return (
    <StudioShell
      squadName={squadName}
      hero={<VentureStatusHero participantId={participantId} />}
      sidebar={<MissionTrackNav participantId={participantId} />}
    >
      <DreamRibbon participantId={participantId} squadName={squadName} />
      {renderTask()}
    </StudioShell>
  );
}
