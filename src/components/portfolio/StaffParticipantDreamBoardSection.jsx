import { useEffect, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { DreamBoardCollage } from '../venturePortfolio/DreamBoardCollage.jsx';
import { DreamBoardSlideCollage } from '../venturePortfolio/DreamBoardSlideCollage.jsx';
import { fetchDreamBoardForStaffView } from '../../lib/dreamBoardCloudSync.js';
import { normalizeDreamBoardCards } from '../../lib/dreamBoardConfig.js';
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
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    (async () => {
      try {
        const rows = await fetchDreamBoardForStaffView(participantId);
        if (!cancelled) {
          setAssets(rows);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setAssets([]);
          setLoadError(err instanceof Error ? err.message : 'Could not load dream board from the cloud.');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  const completed = isBuilderCompleted(participantId, 'dream-board') || assets.length > 0;
  const cardCount = normalizeDreamBoardCards(assets).length;
  const incompleteCards = assets.filter(
    (asset) => !String(asset.caption ?? '').trim() && !asset.imageUrl,
  ).length;
  const missingPhotos = assets.filter(
    (asset) => String(asset.caption ?? '').trim() && !asset.imageUrl,
  ).length;
  const photoCount = assets.filter((asset) => asset.imageUrl).length;

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

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {loadError} If this persists, ask an administrator to run dream board migrations{' '}
          <code className="rounded bg-white px-1">20260717</code> and{' '}
          <code className="rounded bg-white px-1">20260718</code> in Supabase.
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading dream board from the cloud…
        </p>
      ) : cardCount > 0 ? (
        <>
          {photoCount === 0 && missingPhotos > 0 ? (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <strong>Captions synced, photos missing.</strong> {cardCount} dream card
              {cardCount === 1 ? '' : 's'} loaded from the cloud with text only — no photos were uploaded
              yet. Ask {participantName.split(' ')[0] || 'them'} to open{' '}
              <strong>Dream Board Studio</strong> on the phone or laptop where they added photos, then tap{' '}
              <strong>Sync to cloud</strong>. Photos cannot be recovered from the server until they do that.
            </p>
          ) : null}

          <DreamBoardSlideCollage
            assets={assets}
            title={`${participantName}'s Dream Board`}
            layout="grid"
          />

          {incompleteCards > 0 ? (
            <p className="text-sm text-amber-800">
              {incompleteCards} card{incompleteCards === 1 ? '' : 's'} still missing a caption or photo in the
              cloud. Ask {participantName.split(' ')[0] || 'them'} to open Dream Board Studio on their device and
              tap <strong>Sync to cloud</strong> in Dream Board Studio to upload photos and captions.
            </p>
          ) : null}

          {missingPhotos > 0 ? (
            <p className="text-sm text-amber-800">
              {missingPhotos} card{missingPhotos === 1 ? '' : 's'} have captions in the cloud but no photo yet. Ask{' '}
              {participantName.split(' ')[0] || 'them'} to open <strong>Dream Board Studio</strong>, re-add the
              missing photos, and tap <strong>Sync to cloud</strong> so coaches can see the collage.
            </p>
          ) : null}

          <details className="rounded-xl border border-slate-200 bg-slate-50/80 p-4" open>
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-spike marker:content-none">
              <LayoutGrid size={16} />
              View all cards with full captions
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
