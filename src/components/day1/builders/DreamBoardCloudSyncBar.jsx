import { useState } from 'react';
import { CloudUpload, RefreshCw } from 'lucide-react';
import { repairDreamBoardCloudSync } from '../../../lib/day1BuilderService.js';

/**
 * Manual dream board cloud repair — uploads captions + photos for mentor view.
 * @param {{
 *   participantId: string,
 *   assets: Array<{ id: string, category: string, caption: string, imageUrl?: string }>,
 *   editLocked?: boolean,
 *   canRefine?: boolean,
 *   onStartRefine?: () => void,
 * }} props
 */
export function DreamBoardCloudSyncBar({
  participantId,
  assets,
  editLocked = false,
  canRefine = false,
  onStartRefine,
}) {
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState(/** @type {{ ok: boolean, message: string } | null} */ (null));

  async function handleSync() {
    setSyncing(true);
    setFeedback(null);
    try {
      const result = await repairDreamBoardCloudSync(participantId, { assets });
      setFeedback({ ok: result.ok, message: result.message });
    } catch (err) {
      setFeedback({
        ok: false,
        message: err instanceof Error ? err.message : 'Sync failed. Try again.',
      });
    } finally {
      setSyncing(false);
    }
  }

  const photoCount = assets.filter((asset) => asset.imageUrl).length;

  return (
    <section className="rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-sky-950">
            <CloudUpload size={16} className="shrink-0 text-sky-700" aria-hidden />
            Cloud sync for mentors
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            If your coach cannot see dream board photos, stay on this page and tap{' '}
            <strong>Sync to cloud</strong>. This uploads your captions and photos from this device.
          </p>
          {editLocked && photoCount === 0 && canRefine ? (
            <p className="mt-2 text-sm text-amber-900">
              Your board is locked and this device has no photos saved. Tap{' '}
              <button
                type="button"
                onClick={onStartRefine}
                className="font-semibold text-spike underline underline-offset-2"
              >
                Refine your answer
              </button>{' '}
              to re-add photos, then sync again.
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={syncing || !assets.length}
          onClick={() => void handleSync()}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-sky-300 bg-white px-4 py-2.5 text-sm font-bold text-sky-900 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} aria-hidden />
          {syncing ? 'Syncing…' : 'Sync to cloud'}
        </button>
      </div>

      {feedback ? (
        <p
          className={`mt-3 rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
            feedback.ok
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border border-amber-200 bg-amber-50 text-amber-950'
          }`}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
