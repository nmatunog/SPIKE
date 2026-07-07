import { BookOpen } from 'lucide-react';
import { Week4Day2PlaybookHero } from './Week4Day2PlaybookHero.jsx';
import { Week4Day2MissionFlow } from './Week4Day2MissionFlow.jsx';
import { PresentationViewer } from '../PresentationViewer.jsx';
import { PlaybookDayClosingReflectionBlock } from '../PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../PlaybookReflectionNudge.jsx';
import { ParticipantSquadXpCard } from '../../staff/SquadXpDashboard.jsx';
import { resolvePresentations } from '../../../lib/contentLoader.js';

/**
 * Week 4 Day 2 mission-first Playbook — Talent Growth Engine workshop flow.
 * @param {{ bundle?: import('../../../lib/contentLoader.js').DayContentBundle }} props
 */
export function Week4Day2MissionPlaybookView({
  bundle,
  participantId,
  programWeek = 4,
  focusReflection = false,
  pendingReflection = null,
  onOpenCurriculum,
  onProgress,
  staffPreview = false,
}) {
  const deck = bundle
    ? resolvePresentations(bundle, ['presentation-w4-d2-deck-01'])[0]
    : null;

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

      <Week4Day2PlaybookHero allowDownload={staffPreview} />

      {deck?.slides?.length ? (
        <section aria-label="Program Coach Deck 01">
          <PresentationViewer
            presentation={deck.presentation}
            slides={deck.slides}
            facultyMode={staffPreview}
          />
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-card sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Your mission</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Talent Growth Engine — 3 steps
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Set your 5× challenge, redesign one Growth Engine stage, and name your leadership multiplier.
            Brainstorm with your squad — encode only your finalized answers here.
          </p>
        </div>
        <Week4Day2MissionFlow
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
            day={2}
            participantId={participantId}
            onCompleted={onProgress}
            focusReflection={Boolean(pendingReflection) || focusReflection}
          />
        </div>
      ) : null}
    </div>
  );
}
