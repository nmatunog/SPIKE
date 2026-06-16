import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CloudUpload,
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { PortfolioEditGraceBanner } from '../portfolio/PortfolioEditGraceBanner.jsx';
import {
  PORTFOLIO_DELIVERABLE_ACCEPT,
  PORTFOLIO_DELIVERABLE_CATEGORIES,
  deliverableCategoryLabel,
  formatDeliverableFileSize,
} from '../../lib/portfolioDeliverableConstants.js';
import { isWithinCohortEditWindow } from '../../lib/portfolioEditWindow.js';
import {
  deletePortfolioDeliverable,
  listPortfolioDeliverables,
  openPortfolioDeliverable,
  uploadPortfolioDeliverable,
} from '../../lib/portfolioDeliverableService.js';

/**
 * @param {{ participantId: string }} props
 */
export function PortfolioDeliverablesSection({ participantId }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('research_summary');
  const [notes, setNotes] = useState('');
  const [week, setWeek] = useState('');
  const [day, setDay] = useState('');
  const [pendingFile, setPendingFile] = useState(/** @type {File | null} */ (null));

  const canEdit = isWithinCohortEditWindow();

  const refresh = useCallback(async () => {
    if (!participantId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const rows = await listPortfolioDeliverables(participantId);
    setItems(rows);
    setLoading(false);
  }, [participantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleUpload(file) {
    if (!file || !canEdit) return;
    setError('');
    setMessage('');
    setUploading(true);
    try {
      await uploadPortfolioDeliverable(participantId, file, {
        title: title.trim() || file.name.replace(/\.[^.]+$/, ''),
        category: /** @type {import('../../lib/portfolioDeliverableConstants.js').PortfolioDeliverableCategory} */ (
          category
        ),
        notes: notes.trim(),
        week: week ? Number(week) : null,
        day: day ? Number(day) : null,
      });
      setTitle('');
      setNotes('');
      setWeek('');
      setDay('');
      setPendingFile(null);
      setMessage('Deliverable uploaded. Mentors can view it from your portfolio.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    if (!canEdit) return;
    if (!window.confirm('Remove this deliverable? This cannot be undone.')) return;
    setError('');
    try {
      await deletePortfolioDeliverable(participantId, id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="spike-label text-spike">Upload Deliverables</p>
        <h2 className="text-2xl font-bold text-slate-900">Research, presentations & activity outputs</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Submit finished work — research summaries, interview notes, presentation decks, and worksheets. Files
          sync to the cloud when you are signed in.
        </p>
      </header>

      <PortfolioEditGraceBanner locked={!canEdit} />

      <section className="spike-card space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Upload size={18} className="text-spike" />
          Add a deliverable
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Title</span>
            <input
              type="text"
              value={title}
              disabled={!canEdit || uploading}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 1 research summary"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Type</span>
            <select
              value={category}
              disabled={!canEdit || uploading}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              {PORTFOLIO_DELIVERABLE_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Week (optional)</span>
            <input
              type="number"
              min={1}
              max={12}
              value={week}
              disabled={!canEdit || uploading}
              onChange={(e) => setWeek(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Day (optional)</span>
            <input
              type="number"
              min={1}
              max={7}
              value={day}
              disabled={!canEdit || uploading}
              onChange={(e) => setDay(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Notes for your mentor (optional)</span>
          <textarea
            rows={2}
            value={notes}
            disabled={!canEdit || uploading}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Context, squad name, or what to review"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </label>

        <div
          role="button"
          tabIndex={canEdit && !uploading ? 0 : -1}
          onKeyDown={(e) => {
            if (!canEdit || uploading) return;
            if (e.key === 'Enter') inputRef.current?.click();
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            if (canEdit && !uploading) setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (canEdit && !uploading) setDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!canEdit || uploading) return;
            const file = e.dataTransfer.files?.[0];
            if (file) {
              setPendingFile(file);
              if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''));
            }
          }}
          onClick={() => {
            if (canEdit && !uploading) inputRef.current?.click();
          }}
          className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
            !canEdit || uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          } ${
            dragging
              ? 'border-spike bg-spike-muted/40'
              : 'border-slate-200 bg-slate-50 hover:border-spike/40 hover:bg-spike-muted/20'
          }`}
        >
          <CloudUpload size={32} className="mx-auto mb-2 text-slate-400" />
          <p className="text-sm font-semibold text-slate-800">
            {dragging ? 'Drop file here' : 'Drag a file here or tap to browse'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            PDF, PowerPoint, Word, or images · max 15 MB
          </p>
          {pendingFile ? (
            <p className="mt-3 text-sm font-medium text-spike">
              Selected: {pendingFile.name} ({formatDeliverableFileSize(pendingFile.size)})
            </p>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={PORTFOLIO_DELIVERABLE_ACCEPT}
          className="hidden"
          disabled={!canEdit || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPendingFile(file);
              if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ''));
            }
            e.target.value = '';
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canEdit || uploading || !pendingFile}
            onClick={() => void handleUpload(pendingFile)}
            className="spike-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Uploading…' : 'Upload deliverable'}
          </button>
          {pendingFile ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => setPendingFile(null)}
              className="spike-btn-secondary text-sm"
            >
              Clear file
            </button>
          ) : null}
        </div>

        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
        {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
      </section>

      <section className="spike-card">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileText size={18} className="text-spike" />
            Your uploads
          </div>
          <span className="text-xs text-slate-500">{items.length} file{items.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading deliverables…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">
            No files yet. Upload research summaries, presentation decks, or worksheet outputs above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {deliverableCategoryLabel(item.category)} · {item.fileName} ·{' '}
                    {formatDeliverableFileSize(item.fileSizeBytes)}
                  </p>
                  {item.week || item.day ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Week {item.week ?? '—'}
                      {item.day ? ` · Day ${item.day}` : ''}
                    </p>
                  ) : null}
                  {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
                  {item.localOnly ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Saved on this device — sign in to sync to the cloud.
                    </p>
                  ) : null}
                  <p className="mt-1 text-2xs text-slate-400">
                    Uploaded {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void openPortfolioDeliverable(item).catch((err) => {
                      setError(err instanceof Error ? err.message : 'Could not open file.');
                    })}
                    className="spike-btn-secondary inline-flex items-center gap-1.5 !px-3 !py-2 text-xs"
                  >
                    <Download size={14} /> Open
                  </button>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
