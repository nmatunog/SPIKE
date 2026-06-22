import { Sparkles, Users } from 'lucide-react';
import { SquadXpSummaryCard } from '../staff/SquadXpDashboard.jsx';
import {
  loadSquadMemberDesignInputs,
  suggestSquadConsolidation,
} from '../../lib/ventureDesignStudioService.js';

/**
 * Squad member inputs + coach/mentor consolidation controls.
 * @param {{
 *   memberIds: string[],
 *   nameById?: Record<string, string>,
 *   consolidated: import('../../lib/ventureDesignStudioService.js').VentureDesignIndividualDraft,
 *   coachSummary: string,
 *   coachFocus: string,
 *   mentorRating: number | null,
 *   mentorNotes: string,
 *   coachMode: boolean,
 *   squadName?: string,
 *   week?: number,
 *   onApplySuggestion: (patch: Partial<import('../../lib/ventureDesignStudioService.js').VentureDesignIndividualDraft>) => void,
 *   onCoachSummaryChange: (value: string) => void,
 *   onCoachFocusChange: (value: string) => void,
 *   onMentorRatingChange: (value: number | null) => void,
 *   onMentorNotesChange: (value: string) => void,
 * }} props
 */
export function VentureDesignSquadPanel({
  memberIds,
  nameById = {},
  consolidated,
  coachSummary,
  coachFocus,
  mentorRating,
  mentorNotes,
  coachMode,
  squadName = '',
  week,
  onApplySuggestion,
  onCoachSummaryChange,
  onCoachFocusChange,
  onMentorRatingChange,
  onMentorNotesChange,
}) {
  const members = loadSquadMemberDesignInputs(memberIds, nameById);

  function handleSuggest() {
    const suggestion = suggestSquadConsolidation(members);
    onApplySuggestion(suggestion.consolidatedPatch);
    onCoachSummaryChange(suggestion.coachSummary);
    onCoachFocusChange(suggestion.coachFocus);
  }

  return (
    <div className="space-y-4">
      {squadName && memberIds.length ? (
        <SquadXpSummaryCard
          squadName={squadName}
          memberIds={memberIds}
          week={week}
          compact
        />
      ) : null}
      <div className="rounded-2xl border border-stone-700 bg-stone-800 p-5 text-white shadow-lg">
        <h4 className="mb-4 flex items-center gap-2 border-b border-stone-700 pb-3 text-xs font-bold uppercase tracking-widest text-yellow-500">
          <Users size={16} />
          Squad inputs
        </h4>
        <p className="mb-4 text-xs text-stone-400">
          Each intern drafts individually. Your squad consolidates into one central venture idea for the FEC.
        </p>
        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {members.length ? (
            members.map((member) => (
              <div
                key={member.participantId}
                className="rounded-xl border border-stone-700 bg-stone-900 p-3 text-sm"
              >
                <p className="font-bold text-yellow-400">{member.name}</p>
                <p className="mt-1 text-stone-300">
                  <span className="text-stone-500">Segment:</span>{' '}
                  {member.individual.step1.customer || member.individual.step3.whoServe || '—'}
                </p>
                <p className="text-stone-400 text-xs mt-1 line-clamp-2">
                  {member.individual.step3.transformation || member.individual.step1.opportunity || 'No UVP draft yet'}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500">Squad members will appear when squad formation is complete.</p>
          )}
        </div>
      </div>

      {coachMode ? (
        <div className="rounded-2xl border border-spike/30 bg-spike-muted/20 p-5">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-spike">
            <Sparkles size={16} />
            Coach consolidation
          </h4>
          <button
            type="button"
            onClick={handleSuggest}
            className="mb-4 w-full rounded-xl bg-spike px-4 py-2.5 text-sm font-bold text-white hover:bg-spike-light"
          >
            Suggest squad synthesis from member inputs
          </button>
          <label className="block text-2xs font-bold uppercase tracking-widest text-stone-500">
            Main idea focus
          </label>
          <textarea
            rows={2}
            value={coachFocus}
            onChange={(e) => onCoachFocusChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm"
            placeholder="What should the squad center on?"
          />
          <label className="mt-3 block text-2xs font-bold uppercase tracking-widest text-stone-500">
            Combined venture concept
          </label>
          <textarea
            rows={3}
            value={coachSummary}
            onChange={(e) => onCoachSummaryChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm"
            placeholder="Stronger combined UVP for the squad…"
          />
          <label className="mt-3 block text-2xs font-bold uppercase tracking-widest text-stone-500">
            Mentor rating (1–5)
          </label>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onMentorRatingChange(mentorRating === n ? null : n)}
                className={`h-9 w-9 rounded-lg border text-sm font-bold ${
                  mentorRating === n
                    ? 'border-spike bg-spike text-white'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={mentorNotes}
            onChange={(e) => onMentorNotesChange(e.target.value)}
            className="mt-3 w-full rounded-xl border border-stone-200 bg-white p-3 text-sm"
            placeholder="Coaching notes for the squad…"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
          <p className="font-semibold text-stone-900">Squad consolidated draft</p>
          <p className="mt-2 text-xs text-stone-500">
            {coachFocus || 'Your mentor will help consolidate member ideas into one squad venture concept.'}
          </p>
          {coachSummary ? (
            <p className="mt-3 rounded-xl bg-stone-50 p-3 text-sm font-medium text-stone-800">{coachSummary}</p>
          ) : null}
          {consolidated.step3.synthesisA ? (
            <p className="mt-2 text-xs text-stone-500">
              Squad UVP parts: {consolidated.step3.synthesisA} · {consolidated.step3.synthesisB} ·{' '}
              {consolidated.step3.synthesisC}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
