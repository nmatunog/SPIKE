import { useRef, useState } from 'react';
import { Check, CloudUpload, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { PORTFOLIO_DELIVERABLE_ACCEPT, formatDeliverableFileSize } from '../../lib/portfolioDeliverableConstants.js';
import {
  openPctcCertificate,
  removePctcCertificate,
  uploadPctcCertificate,
} from '../../lib/customerDiscovery/week2PctcCertificateService.js';

/**
 * Single PCTC certificate upload slot.
 * @param {{
 *   participantId: string,
 *   slot: 1 | 2,
 *   label: string,
 *   deliverable?: import('../../lib/portfolioDeliverableService.js').PortfolioDeliverable | null,
 *   onChange?: () => void,
 * }} props
 */
export function PctcCertificateUploadSlot({ participantId, slot, label, deliverable, onChange }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await uploadPctcCertificate(participantId, slot, file);
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm(`Remove ${label}?`)) return;
    setUploading(true);
    setError('');
    try {
      await removePctcCertificate(participantId, slot);
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove file.');
    } finally {
      setUploading(false);
    }
  }

  if (deliverable) {
    return (
      <article className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-emerald-800">
              <Check size={14} /> {label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{deliverable.fileName}</p>
            <p className="text-xs text-slate-600">{formatDeliverableFileSize(deliverable.fileSizeBytes)}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => void openPctcCertificate(deliverable).catch((e) => setError(e.message))}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800"
            >
              <ExternalLink size={12} /> View
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => void handleRemove()}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-800"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-3 text-xs font-semibold text-spike hover:underline disabled:opacity-50"
        >
          Replace file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={PORTFOLIO_DELIVERABLE_ACCEPT}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
        {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className="mt-3 flex w-full flex-col items-center rounded-lg border border-slate-200 bg-white px-4 py-6 text-center transition hover:border-spike/40 disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-spike" />
        ) : (
          <CloudUpload size={24} className="text-slate-400" />
        )}
        <p className="mt-2 text-sm font-semibold text-slate-800">
          {uploading ? 'Uploading…' : 'Upload certificate'}
        </p>
        <p className="mt-1 text-xs text-slate-500">PDF or image · max 15 MB</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={PORTFOLIO_DELIVERABLE_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </article>
  );
}
