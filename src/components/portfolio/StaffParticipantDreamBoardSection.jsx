import { LayoutGrid } from 'lucide-react';
import { DreamBoardCollage } from '../venturePortfolio/DreamBoardCollage.jsx';
import { DreamBoardSlideCollage } from '../venturePortfolio/DreamBoardSlideCollage.jsx';
import { generateVenturePortfolio } from '../../services/portfolioGenerator.js';

/**
 * Dream board collage for mentors and program coaches reviewing a participant.
 * @param {{ participantId: string, participantName?: string, className?: string }} props
 */
export function StaffParticipantDreamBoardSection({
  participantId,
  participantName = 'Participant',
  className = '',
}) {
  const portfolio = generateVenturePortfolio(participantId, { participantName });
  const { dreamBoard } = portfolio;
  const cardCount = dreamBoard.assets.length;

  return (
    <section className={`spike-card space-y-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="spike-label text-spike">Dream Board</p>
          <h2 className="text-lg font-bold text-slate-900">{participantName}&apos;s vision collage</h2>
          <p className="mt-1 text-sm text-slate-600">
            Lifestyle, career, family, business, and impact dreams from Day 1 Dream Board Studio.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            dreamBoard.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {dreamBoard.completed
            ? `${cardCount} card${cardCount === 1 ? '' : 's'}`
            : 'In progress'}
        </span>
      </div>

      <DreamBoardSlideCollage
        assets={dreamBoard.assets}
        title={`${portfolio.cover.participantName}'s Dream Board`}
      />

      {cardCount > 0 ? (
        <details className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-spike marker:content-none">
            <LayoutGrid size={16} />
            View all cards with captions
          </summary>
          <div className="mt-4">
            <DreamBoardCollage
              assets={dreamBoard.assets}
              showMeta
              emptyMessage="No dream cards with photos or captions yet."
            />
          </div>
        </details>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No dream board cards yet. Ask them to complete Dream Board Studio in Venture Blueprint and sign in
          so their work syncs to the cloud.
        </p>
      )}
    </section>
  );
}
