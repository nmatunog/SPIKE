import { Star } from 'lucide-react';
import { VentureDesignSquadPanel } from '../ventureDesign/VentureDesignSquadPanel.jsx';
import {
  loadSquadDesignRecord,
  loadVentureDesignRecord,
  resolveSquadContext,
  saveSquadDesignRecord,
  ventureDesignProgressPercent,
} from '../../lib/ventureDesignStudioService.js';

/**
 * Mentor view — venture design progress, squad consolidation, rating.
 * @param {{ participantId: string, participantName?: string, mentorId?: string }} props
 */
export function VentureDesignMentorReview({ participantId, participantName = 'Intern', mentorId = 'mentor' }) {
  const record = loadVentureDesignRecord(participantId);
  const pct = ventureDesignProgressPercent(record);
  const squadCtx = resolveSquadContext(participantId);
  const squadRecord = loadSquadDesignRecord(squadCtx.squadId);

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Venture Design Studio</h3>
        <span className="rounded-full bg-spike-muted px-2.5 py-1 text-xs font-bold text-spike">{pct}%</span>
      </div>

      <p className="text-sm text-slate-600">
        {participantName}&apos;s individual draft feeds squad consolidation for the FEC Unified Venture Proposition.
      </p>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-2xs font-bold uppercase text-slate-500">Individual UVP</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {record.individual.step3.synthesisA
              ? `We help ${record.individual.step3.synthesisA}…`
              : 'Not drafted yet'}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <dt className="text-2xs font-bold uppercase text-slate-500">Squad synthesis</dt>
          <dd className="mt-1 font-medium text-slate-800">
            {squadRecord.coachSummary || 'Use consolidation below'}
          </dd>
        </div>
      </dl>

      {squadRecord.mentorRating ? (
        <p className="flex items-center gap-1 text-sm text-amber-800">
          <Star size={14} className="fill-amber-500 text-amber-500" />
          Your rating: {squadRecord.mentorRating}/5
        </p>
      ) : null}

      {squadCtx.squadId ? (
        <VentureDesignSquadPanel
          memberIds={squadCtx.memberIds}
          nameById={{ [participantId]: participantName }}
          consolidated={squadRecord.consolidated}
          coachSummary={squadRecord.coachSummary}
          coachFocus={squadRecord.coachFocus}
          mentorRating={squadRecord.mentorRating}
          mentorNotes={squadRecord.mentorNotes}
          coachMode
          onApplySuggestion={(patch) => {
            saveSquadDesignRecord(
              squadCtx.squadId,
              {
                consolidated: {
                  ...squadRecord.consolidated,
                  ...patch,
                  step1: { ...squadRecord.consolidated.step1, ...(patch.step1 ?? {}) },
                  step3: { ...squadRecord.consolidated.step3, ...(patch.step3 ?? {}) },
                },
              },
              mentorId,
            );
          }}
          onCoachSummaryChange={(v) => saveSquadDesignRecord(squadCtx.squadId, { coachSummary: v }, mentorId)}
          onCoachFocusChange={(v) => saveSquadDesignRecord(squadCtx.squadId, { coachFocus: v }, mentorId)}
          onMentorRatingChange={(v) => saveSquadDesignRecord(squadCtx.squadId, { mentorRating: v }, mentorId)}
          onMentorNotesChange={(v) => saveSquadDesignRecord(squadCtx.squadId, { mentorNotes: v }, mentorId)}
        />
      ) : null}
    </div>
  );
}
