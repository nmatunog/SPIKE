import { BookOpen } from 'lucide-react';
import { Week3Day5FecPitchPanel } from './Week3Day5FecPitchPanel.jsx';
import { PlaybookDayClosingReflectionBlock } from '../PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../PlaybookReflectionNudge.jsx';
import { ParticipantSquadXpCard } from '../../staff/SquadXpDashboard.jsx';

/**
 * Week 3 Day 5 mission-first Playbook — FEC pitch prep for boxes 4–7.
 */
export function Week3Day5MissionPlaybookView({
  participantId,
  programWeek = 3,
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

      <section className="overflow-hidden rounded-3xl border border-spike/20 bg-gradient-to-br from-slate-900 via-slate-900 to-spike-dark p-5 text-white shadow-card sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike-light/90">Day 15</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">My Financial Advisory Venture Pitch</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Refine FEC boxes 4–7 into short, pitch-ready language. Problem, experience, strategy, growth,
          and platform — an entrepreneur&apos;s pitch, not a product deck.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-card sm:p-6">
        {participantId ? (
          <Week3Day5FecPitchPanel
            participantId={participantId}
            readOnly={staffPreview}
            onSaved={onProgress}
          />
        ) : (
          <Week3Day5FecPitchPanel participantId="" readOnly />
        )}
      </section>

      {onOpenCurriculum ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">Coach slides, pitch rubric, and gate checklist for today.</p>
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
            week={3}
            day={5}
            participantId={participantId}
            onCompleted={onProgress}
            focusReflection={Boolean(pendingReflection) || focusReflection}
          />
        </div>
      ) : null}
    </div>
  );
}
