import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { StudioShell } from '../../customerDiscovery/StudioShell.jsx';
import { MissionTrackNav } from '../../customerDiscovery/MissionTrackNav.jsx';
import { Week2JourneyNav } from '../../customerDiscovery/Week2JourneyNav.jsx';
import { VentureStatusHero } from '../../customerDiscovery/VentureStatusHero.jsx';
import { DreamRibbon } from '../../customerDiscovery/DreamRibbon.jsx';
import { MissionBriefTask } from '../../customerDiscovery/MissionBriefTask.jsx';
import { AssumptionsTask } from '../../customerDiscovery/AssumptionsTask.jsx';
import { InterviewGuideTask } from '../../customerDiscovery/InterviewGuideTask.jsx';
import { FieldResearchPlanTask } from '../../customerDiscovery/FieldResearchPlanTask.jsx';
import { SquadAlignmentTask } from '../../customerDiscovery/SquadAlignmentTask.jsx';
import { InterviewEncodeTask } from '../../customerDiscovery/InterviewEncodeTask.jsx';
import { ExchangeReflectionTask } from '../../customerDiscovery/ExchangeReflectionTask.jsx';
import { ProfessionalReadinessTask } from '../../customerDiscovery/ProfessionalReadinessTask.jsx';
import { FecValidationLab } from '../../customerDiscovery/fecValidation/FecValidationLab.jsx';
import { MarketValidationPitchView } from '../../customerDiscovery/fecValidation/MarketValidationPitchView.jsx';
import { playbookWeek2MissionHref, deriveWeek2MissionTrack, getActiveWeek2Task, week2OverallProgressPct } from '../../../lib/customerDiscovery/week2MissionService.js';
import { getWeek2PhaseForDay } from '../../../lib/customerDiscovery/week2JourneyConstants.js';

/**
 * Mission-first Week 2 SPIKE Studio — embedded in Playbook.
 * @param {{
 *   participantId: string,
 *   squadName?: string,
 *   missionSlug?: string,
 *   playbookDay?: number,
 *   calendarDay?: number,
 *   onOpenCurriculum?: () => void,
 *   onProgress?: () => void,
 *   onMissionNavigate?: (slug: string) => void,
 * }} props
 */
export function Week2MissionPlaybookView({
  participantId,
  squadName = '',
  missionSlug = 'mission',
  playbookDay = 1,
  calendarDay = 5,
  onOpenCurriculum,
  onProgress,
  onMissionNavigate,
}) {
  const [, setTick] = useState(0);
  const refresh = () => {
    setTick((n) => n + 1);
    onProgress?.();
  };

  const day = Math.max(1, Math.min(5, playbookDay));

  const slug = useMemo(() => {
    const track = deriveWeek2MissionTrack(participantId, 'playbook', day);
    if (track.some((t) => t.slug === missionSlug && !t.locked)) return missionSlug;
    return getActiveWeek2Task(participantId, day).slug;
  }, [participantId, missionSlug, day]);

  const progressPct = week2OverallProgressPct(participantId);
  const phase = getWeek2PhaseForDay(day);

  function goToMission(slug) {
    if (onMissionNavigate) onMissionNavigate(slug);
    else if (typeof window !== 'undefined') {
      window.location.assign(playbookWeek2MissionHref(slug, { day }));
    }
  }

  function renderTask() {
    if (slug.startsWith('interview-')) {
      const idx = Number(slug.replace('interview-', '')) - 1;
      return <InterviewEncodeTask participantId={participantId} interviewIndex={idx} onSaved={refresh} />;
    }
    switch (slug) {
      case 'assumptions':
        return <AssumptionsTask participantId={participantId} onSaved={refresh} />;
      case 'guide':
        return <InterviewGuideTask participantId={participantId} onSaved={refresh} missionContext="playbook" />;
      case 'research-plan':
        return <FieldResearchPlanTask participantId={participantId} squadName={squadName} onSaved={refresh} />;
      case 'squad-align':
        return <SquadAlignmentTask participantId={participantId} onComplete={refresh} missionContext="playbook" />;
      case 'exchange':
        return <ExchangeReflectionTask participantId={participantId} onSaved={refresh} />;
      case 'readiness':
        return <ProfessionalReadinessTask participantId={participantId} onSaved={refresh} mode="mission" />;
      case 'readiness-reflect':
        return <ProfessionalReadinessTask participantId={participantId} onSaved={refresh} mode="reflect" />;
      case 'fec-lab':
      case 'fec-step-1':
      case 'fec-step-2':
      case 'fec-step-3':
      case 'fec-step-4':
      case 'fec-step-5':
      case 'fec-step-6':
        return (
          <FecValidationLab
            participantId={participantId}
            squadName={squadName}
            stepSlug={slug}
            onSaved={refresh}
            onNavigate={(nextSlug) => goToMission(nextSlug)}
          />
        );
      case 'market-validation-pitch':
      case 'validation-pitch':
        return <MarketValidationPitchView participantId={participantId} onSaved={refresh} />;
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
            <span className="font-semibold text-slate-900">{phase.label}</span>
            {' · '}
            {phase.theme}
          </span>
        </p>
        <p className="text-xs font-bold tabular-nums text-spike">{progressPct}% week complete</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(180px,220px)_1fr]">
        <aside className="space-y-6">
          <Week2JourneyNav participantId={participantId} calendarDay={calendarDay} activeDay={day} />
        </aside>

        <StudioShell
          variant="playbook"
          squadName={squadName}
          hero={<VentureStatusHero participantId={participantId} />}
          sidebar={
            <MissionTrackNav participantId={participantId} activeSlug={slug} context="playbook" playbookDay={day} />
          }
        >
          <DreamRibbon participantId={participantId} squadName={squadName} />
          {renderTask()}
        </StudioShell>
      </div>

      {onOpenCurriculum ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Coach view</p>
          <p className="mt-1 text-sm text-slate-600">
            Deck slides and session notes for today&apos;s facilitation.
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
