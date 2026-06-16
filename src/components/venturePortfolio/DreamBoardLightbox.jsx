import { useEffect } from 'react';
import { X } from 'lucide-react';
import { dreamBoardCategoryMeta } from '../../lib/venturePortfolioService.js';

/**
 * Full-screen dream card viewer.
 * @param {{
 *   asset: { id: string, category: string, caption: string, imageUrl?: string } | null,
 *   onClose: () => void,
 * }} props
 */
export function DreamBoardLightbox({ asset, onClose }) {
  useEffect(() => {
    if (!asset) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [asset, onClose]);

  if (!asset) return null;

  const category = dreamBoardCategoryMeta(asset.category);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Dream board card"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={asset.caption || category.label}
            className="max-h-[70vh] w-full object-contain bg-slate-950"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-slate-100 text-4xl text-slate-300">✦</div>
        )}
        <div className="space-y-2 p-5">
          <span className="inline-block rounded-full bg-spike-muted px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-spike">
            {category.label}
          </span>
          {asset.caption?.trim() ? (
            <p className="text-base leading-relaxed text-slate-800">{asset.caption}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
