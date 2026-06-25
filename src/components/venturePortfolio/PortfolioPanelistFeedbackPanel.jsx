import { useEffect, useState } from 'react';
import { MessageSquareQuote } from 'lucide-react';
import {
  loadPanelFeedbackCards,
  syncPitchPanelFeedbackToPortfolio,
} from '../../lib/customerDiscovery/week2PanelFeedbackSync.js';
import { PITCH_PANEL_DIMENSIONS } from '../../lib/staff/pitchPanelConstants.js';
import { getParticipantSquad } from '../../lib/cohortFormationService.js';

/**
 * Guest panelist score cards — Week 2 Day 5 feedback for the intern's squad.
 * @param {{ participantId: string, refreshKey?: number }} props
 */
export function PortfolioPanelistFeedbackPanel({ participantId, refreshKey = 0 }) {
  const [cards, setCards] = useState(() => loadPanelFeedbackCards(participantId));
  const squadName = getParticipantSquad(participantId)?.name ?? '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await syncPitchPanelFeedbackToPortfolio(participantId);
      if (!cancelled) setCards(loadPanelFeedbackCards(participantId));
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId, refreshKey]);

  if (!squadName) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquareQuote size={16} className="text-spike" aria-hidden />
        <p className="text-sm font-bold text-slate-900">Panelist score cards</p>
      </div>
      <p className="text-xs text-slate-500">
        Week 2 · Day 5 — Keep / Improve / Explore from guest panelists scoring {squadName}.
      </p>

      {!cards.length ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Panelist feedback will appear here after guests submit score cards on pitch day.
        </p>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => (
            <li
              key={`${card.panelistName}-${card.submittedAt ?? ''}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-slate-900">
                  {card.panelistName}
                  {card.panelistOrg?.trim() ? (
                    <span className="font-normal text-slate-500"> · {card.panelistOrg}</span>
                  ) : null}
                </p>
                <p className="text-[11px] font-medium text-slate-500">
                  {PITCH_PANEL_DIMENSIONS.map((d) => `${d.label}: ${card[d.id]}`).join(' · ')}
                </p>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-emerald-700">Keep</dt>
                  <dd className="mt-0.5 text-slate-800">{card.keepFeedback}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-amber-700">Improve</dt>
                  <dd className="mt-0.5 text-slate-800">{card.improveFeedback}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-sky-700">Explore</dt>
                  <dd className="mt-0.5 text-slate-800">{card.exploreFeedback}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
