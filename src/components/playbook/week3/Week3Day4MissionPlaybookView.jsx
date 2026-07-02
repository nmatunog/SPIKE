import { BookOpen } from 'lucide-react';
import { Week3Day4PlaybookHero } from './Week3Day4PlaybookHero.jsx';
import { GrowthEngineWorksheet } from './GrowthEngineWorksheet.jsx';
import { FinancialEngineWorksheet } from './FinancialEngineWorksheet.jsx';
import { PlaybookDayClosingReflectionBlock } from '../PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../PlaybookReflectionNudge.jsx';
import { ParticipantSquadXpCard } from '../../staff/SquadXpDashboard.jsx';

/**
 * Week 3 Day 4 mission-first Playbook — Growth Engine hero + interactive worksheet.
 */
export function Week3Day4MissionPlaybookView({
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

      <Week3Day4PlaybookHero />

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-card sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Workshop</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            SPIKE Growth Engine Worksheet™
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Build capacity, calculate growth targets, update FEC Box 6, and prepare your Venture Pitch.
          </p>
        </div>
        <GrowthEngineWorksheet
          participantId={participantId}
          readOnly={staffPreview}
          onSaved={onProgress}
        />
      </section>

      <section className="rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/40 p-4 shadow-card sm:p-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Workshop</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            SPIKE Financial Engine Worksheet™
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Revenue model, economics, and 3-year scaling from your Growth Engine — synced to FEC Box 8.
          </p>
        </div>
        <FinancialEngineWorksheet
          participantId={participantId}
          readOnly={staffPreview}
          onSaved={onProgress}
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
            week={3}
            day={4}
            participantId={participantId}
            onCompleted={onProgress}
            focusReflection={Boolean(pendingReflection) || focusReflection}
          />
        </div>
      ) : null}
    </div>
  );
}
