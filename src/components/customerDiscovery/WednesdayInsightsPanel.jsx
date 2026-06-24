import { Sparkles } from 'lucide-react';
import { getSquadIntelligenceBoard } from '../../lib/customerDiscovery/week2DiscoveryService.js';

/**
 * Squad workspace — Wednesday Insights Board (auto-generated from interviews).
 * @param {{ participantId: string }} props
 */
export function WednesdayInsightsPanel({ participantId }) {
  const board = getSquadIntelligenceBoard(participantId);

  const topQuote = board.mostCommonQuotes?.[0];
  const topProblem = board.mostCommonChallenges?.[0];
  const topGoal = board.mostCommonGoals?.[0];
  const emerging = board.emergingOpportunities?.[0];
  const theme = board.mostCommonRisks?.[0];

  const tiles = [
    { label: 'Top quote', value: topQuote, quote: true },
    { label: 'Top problem', value: topProblem },
    { label: 'Top goal', value: topGoal },
    { label: 'Emerging opportunity', value: emerging },
    { label: 'Most common theme', value: theme },
  ];

  return (
    <section className="spike-card space-y-4">
      <header>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-spike">
          <Sparkles size={14} aria-hidden />
          Wednesday Insights Board
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Auto-generated from squad interviews — no manual consolidation.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-400">{tile.label}</p>
            {tile.value ? (
              <p className={`mt-1 text-sm text-slate-800 ${tile.quote ? 'italic' : ''}`}>
                {tile.quote ? `“${tile.value}”` : tile.value}
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">Encode more interviews to populate.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
