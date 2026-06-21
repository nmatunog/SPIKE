import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { StudioShell } from '../../customerDiscovery/StudioShell.jsx';
import { MissionTrackNav } from '../../customerDiscovery/MissionTrackNav.jsx';
import { VentureStatusHero } from '../../customerDiscovery/VentureStatusHero.jsx';
import { DreamRibbon } from '../../customerDiscovery/DreamRibbon.jsx';
import { MissionBriefTask } from '../../customerDiscovery/MissionBriefTask.jsx';
import { InterviewGuideTask } from '../../customerDiscovery/InterviewGuideTask.jsx';
import { ThinkingShiftPrompt } from '../../customerDiscovery/ThinkingShiftPrompt.jsx';
import {
  deriveWeek2MissionTrack,
  getActiveWeek2Task,
  week2MissionProgressPct,
} from '../../../lib/customerDiscovery/week2MissionService.js';

/**
 * Mission-first Week 2 Playbook — squad mission track embedded in Playbook (not Venture Blueprint).
 * @param {{
 *   participantId: string,
 *   squadName?: string,
 *   missionSlug?: string,
 *   onOpenCurriculum?: () => void,
 *   onProgress?: () => void,
 * }} props
 */
export function Week2MissionPlaybookView({
  participantId,
  squadName = '',
  missionSlug = 'mission',
  onOpenCurriculum,
  onProgress,
}) {
  const [, setTick] = useState(0);
  const refresh = () => {
    setTick((n) => n + 1);
    onProgress?.();
  };

  const slug = useMemo(() => {
    const track = deriveWeek2MissionTrack(participantId, 'playbook');
    if (track.some((t) => t.slug === missionSlug)) return missionSlug;
    return getActiveWeek2Task(participantId).slug;
  }, [participantId, missionSlug]);

  const progressPct = week2MissionProgressPct(participantId);

  function renderTask() {
    switch (slug) {
      case 'guide':
        return (
          <InterviewGuideTask
            participantId={participantId}
            onSaved={refresh}
            missionContext="playbook"
          />
        );
      case 'thinking':
        return (
          <ThinkingShiftPrompt
            participantId={participantId}
            taskId="thinking"
            onSaved={refresh}
          />
        );
      case 'mission':
      default:
        return (
          <MissionBriefTask
            participantId={participantId}
            squadName={squadName}
            onComplete={refresh}
            missionContext="playbook"
          />
        );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-venture-activate/20 bg-venture-activate/5 px-4 py-3">
        <p className="flex items-center gap-2 text-sm text-slate-700">
          <Sparkles size={16} className="shrink-0 text-venture-activate" aria-hidden />
          <span>
            <span className="font-semibold text-slate-900">Mission-first</span>
            {' · '}
            One step at a time. AI synthesizes your observations into portfolio evidence.
          </span>
        </p>
        <p className="text-xs font-bold tabular-nums text-spike">{progressPct}% complete</p>
      </div>

      <StudioShell
        variant="playbook"
        squadName={squadName}
        hero={<VentureStatusHero participantId={participantId} />}
        sidebar={
          <MissionTrackNav participantId={participantId} activeSlug={slug} context="playbook" />
        }
      >
        <DreamRibbon participantId={participantId} squadName={squadName} />
        {renderTask()}
      </StudioShell>

      {onOpenCurriculum ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Progressive unlock</p>
          <p className="mt-1 text-sm text-slate-600">
            Coach slides and session notes unlock when you need them — not before your mission.
          </p>
          <button
            type="button"
            onClick={onOpenCurriculum}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-spike hover:underline"
          >
            <BookOpen size={16} aria-hidden />
            Open coach session notes
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
