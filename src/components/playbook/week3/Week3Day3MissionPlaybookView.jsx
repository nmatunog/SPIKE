import { useMemo } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Week3Day3PlaybookHero } from './Week3Day3PlaybookHero.jsx';
import { Week3Day3PortfolioMission } from './Week3Day3PortfolioMission.jsx';
import { FecValidationStudio } from '../../customerDiscovery/fecValidation/FecValidationStudio.jsx';
import { PlaybookDayClosingReflectionBlock } from '../PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../PlaybookReflectionNudge.jsx';
import { ParticipantSquadXpCard } from '../../staff/SquadXpDashboard.jsx';
import { getParticipantSquad } from '../../../lib/cohortFormationService.js';
import { isWeek3Day3FecEditSlug } from '../../../lib/week3Day3PortfolioService.js';
import { FEC_VALIDATION_STEPS } from '../../../lib/customerDiscovery/week2FecValidationConstants.js';

/**
 * Week 3 Day 3 mission-first Playbook — Business Engine hero, FNA role play, FEC Box 4/5 portfolio.
 * @param {{
 *   participantId: string,
 *   squadName?: string,
 *   missionSlug?: string,
 *   programWeek?: number,
 *   focusReflection?: boolean,
 *   pendingReflection?: { week: number, day: number, title: string, label: string } | null,
 *   bundle: import('../../../lib/contentLoader.js').DayContentBundle,
 *   onOpenCurriculum?: () => void,
 *   onProgress?: () => void,
 *   onMissionNavigate?: (slug: string) => void,
 *   interns?: Array<{ id: string, name: string }>,
 *   staffPreview?: boolean,
 * }} props
 */
export function Week3Day3MissionPlaybookView({
  participantId,
  squadName = '',
  missionSlug = '',
  programWeek = 3,
  focusReflection = false,
  pendingReflection = null,
  bundle,
  onOpenCurriculum,
  onProgress,
  onMissionNavigate,
  interns = [],
  staffPreview = false,
}) {
  const editingFec = isWeek3Day3FecEditSlug(missionSlug);
  const fecStep = FEC_VALIDATION_STEPS.find((step) => step.slug === missionSlug);

  const memberNames = useMemo(() => {
    const squad = getParticipantSquad(participantId);
    const ids = (squad?.members ?? []).map((m) => m.participantId).filter(Boolean);
    const nameById = Object.fromEntries(interns.map((i) => [i.id, i.name]));
    return Object.fromEntries(ids.map((id) => [id, nameById[id] || `Member ${String(id).slice(0, 6)}`]));
  }, [participantId, interns]);

  function goToMission(slug = '') {
    onMissionNavigate?.(slug);
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

      {!staffPreview && participantId ? (
        <ParticipantSquadXpCard participantId={participantId} week={programWeek} compact />
      ) : null}

      <Week3Day3PlaybookHero />

      {editingFec && fecStep ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => goToMission('')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Day 3 portfolio mission
          </button>
          <FecValidationStudio
            participantId={participantId}
            squadName={squadName}
            stepSlug={missionSlug}
            onSaved={onProgress}
            memberNames={memberNames}
            onNavigate={(nextSlug) => goToMission(nextSlug)}
          />
        </div>
      ) : (
        <Week3Day3PortfolioMission
          participantId={participantId}
          onSaved={onProgress}
          onEditFecBox={(slug) => goToMission(slug)}
          staffPreview={staffPreview}
        />
      )}

      {onOpenCurriculum ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">Coach slides, activities, and facilitator notes for today.</p>
          <button
            type="button"
            onClick={onOpenCurriculum}
            className="inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
          >
            <BookOpen size={16} aria-hidden />
            Open curriculum view
          </button>
        </div>
      ) : null}

      {!staffPreview ? (
        <div id="playbook-day-reflection" className="scroll-mt-24">
          <PlaybookDayClosingReflectionBlock
            bundle={bundle}
            participantId={participantId}
            onCompleted={onProgress}
            highlightPending={Boolean(pendingReflection) || focusReflection}
          />
        </div>
      ) : null}
    </div>
  );
}
