import { BookOpen } from 'lucide-react';
import { Week5PlaybookHero } from './Week5PlaybookHero.jsx';
import { Week5Day2MissionFlow } from './Week5Day2MissionFlow.jsx';
import { PresentationViewer } from '../PresentationViewer.jsx';
import { PlaybookDayClosingReflectionBlock } from '../PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../PlaybookReflectionNudge.jsx';
import { ParticipantSquadXpCard } from '../../staff/SquadXpDashboard.jsx';
import { resolvePresentations } from '../../../lib/contentLoader.js';

/**
 * @param {{ bundle?: import('../../../lib/contentLoader.js').DayContentBundle, participantId: string, programWeek?: number, focusReflection?: boolean, pendingReflection?: object | null, onOpenCurriculum?: () => void, onProgress?: () => void, staffPreview?: boolean }} props
 */
export function Week5Day2MissionPlaybookView({
  bundle,
  participantId,
  programWeek = 5,
  focusReflection = false,
  pendingReflection = null,
  onOpenCurriculum,
  onProgress,
  staffPreview = false,
}) {
  const deck = bundle ? resolvePresentations(bundle, ['presentation-w5-d2-deck-01'])[0] : null;

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
      <Week5PlaybookHero />
      {deck?.slides?.length ? (
        <PresentationViewer presentation={deck.presentation} slides={deck.slides} facultyMode={staffPreview} />
      ) : null}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/60 p-4 shadow-card sm:p-6">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Week 5 · Day 2</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Build the Final Pitch</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Do not present everything you learned. Present the strongest case for why the venture should exist and can succeed.
          </p>
        </div>
        <Week5Day2MissionFlow participantId={participantId} readOnly={staffPreview} onProgress={onProgress} />
      </section>
      {onOpenCurriculum ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">Coach slides, activities, and facilitator notes for today.</p>
          <button type="button" onClick={onOpenCurriculum} className="inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline">
            <BookOpen size={16} aria-hidden />
            Open curriculum
          </button>
        </div>
      ) : null}
      {!staffPreview ? (
        <div id="playbook-day-reflection" className="scroll-mt-24">
          <PlaybookDayClosingReflectionBlock
            week={5}
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
