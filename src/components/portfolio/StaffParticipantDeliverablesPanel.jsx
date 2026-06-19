import { useEffect, useState } from 'react';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import {
  listPortfolioDeliverables,
  openPortfolioDeliverable,
} from '../../lib/portfolioDeliverableService.js';
import {
  deliverableCategoryLabel,
  formatDeliverableFileSize,
} from '../../lib/portfolioDeliverableConstants.js';

/**
 * Staff read-only view of intern portfolio uploads (pitch decks, research, etc.).
 * @param {{ participantId: string, participantName?: string }} props
 */
export function StaffParticipantDeliverablesPanel({
  participantId,
  participantName = 'Participant',
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingId, setOpeningId] = useState('');

  useEffect(() => {
    if (!participantId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const rows = await listPortfolioDeliverables(participantId);
        if (!cancelled) setItems(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load deliverables.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  async function handleOpen(item) {
    setOpeningId(item.id);
    setError('');
    try {
      await openPortfolioDeliverable(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open file.');
    } finally {
      setOpeningId('');
    }
  }

  const presentations = items.filter((item) => item.category === 'presentation');
  const other = items.filter((item) => item.category !== 'presentation');

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-slate-900">Uploaded files</h2>
      <p className="mt-1 text-sm text-slate-600">
        Pitch decks, research summaries, and other portfolio deliverables for {participantName}.
      </p>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={16} className="animate-spin text-spike" /> Loading uploads…
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {!loading && !items.length ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No files uploaded yet. Ask {participantName} to upload their squad pitch deck under{' '}
          <strong>My Venture Portfolio → Work → Upload Deliverables</strong> (category: Presentation).
        </p>
      ) : null}

      {!loading && presentations.length ? (
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Pitch decks ({presentations.length})
          </h3>
          <ul className="mt-2 space-y-2">
            {presentations.map((item) => (
              <DeliverableRow
                key={item.id}
                item={item}
                opening={openingId === item.id}
                onOpen={() => void handleOpen(item)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {!loading && other.length ? (
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Other deliverables ({other.length})
          </h3>
          <ul className="mt-2 space-y-2">
            {other.map((item) => (
              <DeliverableRow
                key={item.id}
                item={item}
                opening={openingId === item.id}
                onOpen={() => void handleOpen(item)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/**
 * @param {{
 *   item: {
 *     id: string,
 *     title: string,
 *     category: string,
 *     fileName: string,
 *     fileSizeBytes?: number,
 *     week?: number | null,
 *     updatedAt?: string,
 *     localOnly?: boolean,
 *   },
 *   opening: boolean,
 *   onOpen: () => void,
 * }} props
 */
function DeliverableRow({ item, opening, onOpen }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FileText size={16} className="shrink-0 text-spike" />
          <span className="truncate">{item.title || item.fileName}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {deliverableCategoryLabel(item.category)} · {item.fileName}
          {item.fileSizeBytes ? ` · ${formatDeliverableFileSize(item.fileSizeBytes)}` : ''}
          {item.week ? ` · Week ${item.week}` : ''}
          {item.localOnly ? ' · device only (not synced)' : ''}
        </p>
      </div>
      <button
        type="button"
        disabled={opening || item.localOnly}
        onClick={onOpen}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ExternalLink size={14} />
        {opening ? 'Opening…' : item.localOnly ? 'Not in cloud' : 'Open file'}
      </button>
    </li>
  );
}
