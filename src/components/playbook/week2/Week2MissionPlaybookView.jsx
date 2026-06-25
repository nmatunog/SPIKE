import { useState, useMemo } from 'react';
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
import { ProfessionalReadinessMission } from '../../customerDiscovery/ProfessionalReadinessMission.jsx';
import { FecValidationStudio } from '../../customerDiscovery/fecValidation/FecValidationStudio.jsx';
import { MarketValidationPitchView } from '../../customerDiscovery/fecValidation/MarketValidationPitchView.jsx';
import { Week2WrapUpTask } from '../../customerDiscovery/Week2WrapUpTask.jsx';
import { Week2EmpathyLabTask } from '../../customerDiscovery/Week2EmpathyLabTask.jsx';
import {
  playbookWeek2MissionHref,
  getActiveWeek2Task,
  week2OverallProgressPct,
} from '../../../lib/customerDiscovery/week2MissionService.js';
import { getWeek2PhaseForDay } from '../../../lib/customerDiscovery/week2JourneyConstants.js';
import { getParticipantSquad } from '../../../lib/cohortFormationService.js';
import { Week2PrepareReviseNav } from '../../customerDiscovery/Week2PrepareReviseNav.jsx';
import { SquadDataAdoptPrompt } from '../../customerDiscovery/SquadDataAdoptPrompt.jsx';
import { PlaybookDayClosingReflectionBlock } from '../PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../PlaybookReflectionNudge.jsx';

/**
 * Mission-first Week 2 SPIKE Studio — embedded in Playbook.
 * @param {{
 *   participantId: string,
 *   squadName?: string,
 *   missionSlug?: string,
 *   playbookDay?: number,
 *   calendarDay?: number,
 *   programWeek?: number,
 *   focusReflection?: boolean,
 *   pendingReflection?: { week: number, day: number, title: string, label: string } | null,
 *   onOpenCurriculum?: () => void,
 *   onProgress?: () => void,
 *   onMissionNavigate?: (slug: string) => void,
 *   interns?: Array<{ id: string, name: string }>,
 * }} props
 */
export function Week2MissionPlaybookView({
  participantId,
  squadName = '',
  missionSlug = '',
  playbookDay = 1,
  calendarDay = 5,
  programWeek = 2,
  focusReflection = false,
  pendingReflection = null,
  onOpenCurriculum,
  onProgress,
  onMissionNavigate,
  interns = [],
}) {
  const [, setTick] = useState(0);
  const refresh = () => {
    setTick((n) => n + 1);
    onProgress?.();
  };

  const day = Math.max(1, Math.min(5, playbookDay));

  const memberNames = useMemo(() => {
    const squad = getParticipantSquad(participantId);
    const ids = (squad?.members ?? []).map((m) => m.participantId).filter(Boolean);
    const nameById = Object.fromEntries(interns.map((i) => [i.id, i.name]));
    return Object.fromEntries(ids.map((id) => [id, nameById[id] || `Member ${String(id).slice(0, 6)}`]));
  }, [participantId, interns]);

  const slug = missionSlug?.trim()
    ? missionSlug.trim()
    : getActiveWeek2Task(participantId, day).slug;

  const progressPct = week2OverallProgressPct(participantId);
  const phase = getWeek2PhaseForDay(day);

  function goToMission(nextSlug, nextDay = day) {
    if (onMissionNavigate) {
      onMissionNavigate(nextSlug, nextDay);
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.assign(playbookWeek2MissionHref(nextSlug, { day: nextDay }));
    }
  }

  function renderTask() {
    if (slug.startsWith('interview-')) {
      const idx = Number(slug.replace('interview-', '')) - 1;
      return <InterviewEncodeTask key={slug} participantId={participantId} interviewIndex={idx} onSaved={refresh} />;
    }
    switch (slug) {
      case 'assumptions':
        return <AssumptionsTask key="assumptions" participantId={participantId} onSaved={refresh} />;
      case 'guide':
        return (
          <InterviewGuideTask
            key="guide"
            participantId={participantId}
            onSaved={refresh}
            missionContext="playbook"
          />
        );
      case 'research-plan':
        return (
          <FieldResearchPlanTask
            key="research-plan"
            participantId={participantId}
            squadName={squadName}
            onSaved={refresh}
          />
        );
      case 'squad-align':
        return (
          <SquadAlignmentTask
            key="squad-align"
            participantId={participantId}
            onComplete={refresh}
            missionContext="playbook"
          />
        );
      case 'exchange':
        return <ExchangeReflectionTask key="exchange" participantId={participantId} onSaved={refresh} />;
      case 'readiness':
      case 'readiness-reflect':
      case 'readiness-mission':
        return (
          <ProfessionalReadinessMission
            key="readiness-mission"
            participantId={participantId}
            squadName={squadName}
            onSaved={refresh}
            onContinueThursday={() => goToMission('fec-studio', 4)}
          />
        );
      case 'fec-lab':
      case 'fec-studio':
      case 'fec-studio-1':
      case 'fec-studio-2':
      case 'fec-studio-3':
      case 'fec-step-1':
      case 'fec-step-2':
      case 'fec-step-3':
      case 'fec-step-4':
      case 'fec-step-5':
      case 'fec-step-6':
        return (
          <FecValidationStudio
            participantId={participantId}
            squadName={squadName}
            stepSlug={slug}
            onSaved={refresh}
            memberNames={memberNames}
            onNavigate={(nextSlug, nextDay = day) => goToMission(nextSlug, nextDay)}
          />
        );
      case 'market-validation-pitch':
      case 'validation-pitch':
        return <MarketValidationPitchView participantId={participantId} onSaved={refresh} />;
      case 'empathy-lab':
      case 'empathy-map':
        return <Week2EmpathyLabTask key="empathy-lab" participantId={participantId} onSaved={refresh} />;
      case 'week-wrap-up':
        return <Week2WrapUpTask participantId={participantId} onSaved={refresh} />;
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
      {pendingReflection ? (
        <PlaybookReflectionNudge
          week={pendingReflection.week}
          day={pendingReflection.day}
          title={pendingReflection.title}
          label={pendingReflection.label}
        />
      ) : null}

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

      <SquadDataAdoptPrompt
        participantId={participantId}
        memberNames={memberNames}
        onAdopted={refresh}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(180px,220px)_1fr]">
        <aside className="space-y-6">
          <Week2JourneyNav
            participantId={participantId}
            calendarDay={calendarDay}
            activeDay={day}
            activeMissionSlug={slug}
            onNavigate={(nextSlug, nextDay) => goToMission(nextSlug, nextDay)}
            playbookMode
          />
          {day > 1 ? (
            <Week2PrepareReviseNav
              activeSlug={slug}
              onNavigate={(nextSlug, nextDay) => goToMission(nextSlug, nextDay)}
            />
          ) : null}
        </aside>

        <StudioShell
          variant="playbook"
          squadName={squadName}
          hero={<VentureStatusHero participantId={participantId} />}
          sidebar={
            <MissionTrackNav
              participantId={participantId}
              activeSlug={slug}
              context="playbook"
              playbookDay={day}
              onNavigate={(nextSlug, nextDay) => goToMission(nextSlug, nextDay ?? day)}
            />
          }
        >
          <DreamRibbon participantId={participantId} squadName={squadName} />
          {renderTask()}
        </StudioShell>
      </div>

      <PlaybookDayClosingReflectionBlock
        week={programWeek}
        day={day}
        participantId={participantId}
        focusReflection={focusReflection}
        onCompleted={refresh}
      />

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
