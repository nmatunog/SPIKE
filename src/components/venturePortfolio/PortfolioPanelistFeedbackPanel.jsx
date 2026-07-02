import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  loadPanelInvestmentCards,
  syncPitchPanelFeedbackToPortfolio,
} from '../../lib/customerDiscovery/week2PanelFeedbackSync.js';
import { formatPitchPeso } from '../../lib/staff/pitchPanelConstants.js';
import { getParticipantSquad } from '../../lib/cohortFormationService.js';

/**
 * Guest panelist investments — Week 2 Day 5 funding for the intern's squad.
 * @param {{ participantId: string, refreshKey?: number }} props
 */
export function PortfolioPanelistFeedbackPanel({ participantId, refreshKey = 0 }) {
  const [cards, setCards] = useState(() => loadPanelInvestmentCards(participantId));
  const squadName = getParticipantSquad(participantId)?.name ?? '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await syncPitchPanelFeedbackToPortfolio(participantId);
      if (!cancelled) setCards(loadPanelInvestmentCards(participantId));
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId, refreshKey]);

  if (!squadName) return null;

  const total = cards.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-spike" aria-hidden />
        <p className="text-sm font-bold text-slate-900">Demo Day funding</p>
      </div>
      <p className="text-xs text-slate-500">
        Week 2 · Day 5 — SPIKE Venture Capital allocations for {squadName}.
      </p>

      {!cards.length ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Investment totals will appear here after panelists finalize their portfolios.
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Total investment received</p>
            <p className="mt-1 text-3xl font-black tabular-nums text-orange-600">{formatPitchPeso(total)}</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[16rem] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Panelist</th>
                  <th className="px-4 py-3 text-right">Investment</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={`${card.panelistName}-${card.updatedAt ?? ''}`} className="border-b border-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{card.panelistName}</p>
                      {card.panelistOrg?.trim() ? (
                        <p className="text-xs text-slate-500">{card.panelistOrg}</p>
                      ) : null}
                      {card.comment?.trim() ? (
                        <p className="mt-1 text-xs italic text-slate-500">&ldquo;{card.comment}&rdquo;</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-orange-600">
                      {formatPitchPeso(card.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-slate-900">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums text-orange-600">{formatPitchPeso(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
