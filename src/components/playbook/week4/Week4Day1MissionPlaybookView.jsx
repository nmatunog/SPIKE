import { BookOpen } from 'lucide-react';
import { Week4Day1PlaybookHero } from './Week4Day1PlaybookHero.jsx';
import { Week4Day1MissionFlow } from './Week4Day1MissionFlow.jsx';
import { PlaybookDayClosingReflectionBlock } from '../PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../PlaybookReflectionNudge.jsx';
import { ParticipantSquadXpCard } from '../../staff/SquadXpDashboard.jsx';

/**
 * Week 4 Day 1 mission-first Playbook — Platform Integration workshop flow.
 */
export function Week4Day1MissionPlaybookView({
  participantId,
  programWeek = 4,
  focusReflection = false,
  pendingReflection = null,
  onOpenCurriculum,
  onProgress,
  staffPreview = false,
}) {
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

      <Week4Day1PlaybookHero allowDownload={staffPreview} />

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-card sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Your mission</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Blueprint Integration & FEC Finalization
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Strengthen and complete your Venture Blueprint and FEC — you are not building a new venture.
            Encode only finalized answers; brainstorm offline or with your mentor.
          </p>
        </div>
        <Week4Day1MissionFlow
          participantId={participantId}
          readOnly={staffPreview}
          onProgress={onProgress}
        />
      </section>

      {onOpenCurriculum ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">Coach slides, activities, and facilitator notes for today.</p>
          <button
            type="button"
            onClick={onOpenCurriculum}
            className="inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
          >
            <BookOpen size={16} aria-hidden />
            Open curriculum
          </button>
        </div>
      ) : null}

      {!staffPreview ? (
        <div id="playbook-day-reflection" className="scroll-mt-24">
          <PlaybookDayClosingReflectionBlock
            week={4}
            day={1}
            participantId={participantId}
            onCompleted={onProgress}
            focusReflection={Boolean(pendingReflection) || focusReflection}
          />
        </div>
      ) : null}
    </div>
  );
}
