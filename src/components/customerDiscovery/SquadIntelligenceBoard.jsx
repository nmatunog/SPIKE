import { useState } from 'react';
import { getSquadIntelligenceBoard, markSynthesisReviewed, saveSquadDiscussionNotes } from '../../lib/customerDiscovery/week2DiscoveryService.js';
import { MIN_ENCODED_INTERVIEWS } from '../../lib/customerDiscovery/week2Constants.js';

/**
 * Thursday — Squad Intelligence Board.
 * @param {{ participantId: string, onSaved?: () => void, mode?: 'synthesis' | 'board' }} props
 */
export function SquadIntelligenceBoard({ participantId, onSaved, mode = 'board' }) {
  const board = getSquadIntelligenceBoard(participantId);
  const [notes, setNotes] = useState(board.discussionNotes ?? '');

  if (mode === 'synthesis') {
    return (
      <div className="space-y-6">
        <section className="spike-surface space-y-2">
          <p className="spike-label">AI insight review</p>
          <h2 className="text-xl font-bold text-slate-900">Review extracted patterns</h2>
          <p className="text-sm text-slate-600">
            {board.interviewCount} interviews encoded · minimum {MIN_ENCODED_INTERVIEWS} required
          </p>
        </section>
        <IntelligenceGrid board={board} />
        <button
          type="button"
          disabled={board.interviewCount < MIN_ENCODED_INTERVIEWS}
          onClick={() => {
            markSynthesisReviewed(participantId);
            onSaved?.();
          }}
          className="spike-btn-primary disabled:opacity-50"
        >
          Insights reviewed — continue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Squad Intelligence Board</p>
        <h2 className="text-xl font-bold text-slate-900">Auto-generated from your interviews</h2>
      </section>
      <IntelligenceGrid board={board} />
      <label className="spike-surface block space-y-2">
        <span className="text-xs font-bold uppercase text-slate-400">Squad discussion notes</span>
        <textarea
          value={notes}
          rows={4}
          onChange={(e) => {
            setNotes(e.target.value);
            saveSquadDiscussionNotes(participantId, e.target.value);
            onSaved?.();
          }}
          placeholder="Collaborative synthesis — what patterns does your squad agree on?"
          className="w-full border-0 bg-transparent text-sm focus:outline-none"
        />
      </label>
    </div>
  );
}

/** @param {{ board: ReturnType<typeof getSquadIntelligenceBoard> }} props */
function IntelligenceGrid({ board }) {
  const sections = [
    { title: 'Most common goals', items: board.mostCommonGoals },
    { title: 'Most common challenges', items: board.mostCommonChallenges },
    { title: 'Customer quotes', items: board.mostCommonQuotes },
    { title: 'Protection gaps / risks', items: board.mostCommonRisks },
    { title: 'Emerging opportunities', items: board.emergingOpportunities },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sections.map((sec) => (
        <div key={sec.title} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase text-slate-400">{sec.title}</p>
          {sec.items?.length ? (
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {sec.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-spike">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Encode more interviews to populate.</p>
          )}
        </div>
      ))}
    </div>
  );
}
