import { useEffect, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { DreamBoardCollage } from '../venturePortfolio/DreamBoardCollage.jsx';
import { DreamBoardSlideCollage } from '../venturePortfolio/DreamBoardSlideCollage.jsx';
import { fetchDreamBoardForStaffView } from '../../lib/dreamBoardCloudSync.js';
import { isBuilderCompleted } from '../../lib/day1BuilderService.js';

/**
 * Dream board collage for mentors and program coaches reviewing a participant.
 * Loads images from Supabase — does not depend on intern device localStorage.
 * @param {{ participantId: string, participantName?: string, className?: string }} props
 */
export function StaffParticipantDreamBoardSection({
  participantId,
  participantName = 'Participant',
  className = '',
}) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const rows = await fetchDreamBoardForStaffView(participantId);
      if (!cancelled) {
        setAssets(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  const completed = isBuilderCompleted(participantId, 'dream-board') || assets.length > 0;
  const cardCount = assets.length;

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
            completed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {loading
            ? 'Loading…'
            : completed
              ? `${cardCount} card${cardCount === 1 ? '' : 's'}`
              : 'In progress'}
        </span>
      </div>

      {loading ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading dream board from the cloud…
        </p>
      ) : cardCount > 0 ? (
        <>
          <DreamBoardSlideCollage
            assets={assets}
            title={`${participantName}'s Dream Board`}
          />

          <details className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-spike marker:content-none">
              <LayoutGrid size={16} />
              View all cards with captions
            </summary>
            <div className="mt-4">
              <DreamBoardCollage
                assets={assets}
                showMeta
                emptyMessage="No dream cards with photos or captions yet."
              />
            </div>
          </details>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No dream board cards yet. Ask them to complete Dream Board Studio in Venture Blueprint and sign in
          so their work syncs to the cloud.
        </p>
      )}
    </section>
  );
}
