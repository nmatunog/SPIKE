import { useState } from 'react';
import { dreamBoardCategoryMeta } from '../../lib/venturePortfolioService.js';
import {
  dreamBoardSlideGridClass,
  getDreamBoardMaxCards,
  normalizeDreamBoardCards,
} from '../../lib/dreamBoardConfig.js';
import { DreamBoardLightbox } from './DreamBoardLightbox.jsx';

/**
 * Dream board collage — grid (full captions) or slide (16:9 projection).
 * @param {{
 *   assets: Array<{ id: string, category: string, caption: string, imageUrl?: string }>,
 *   title?: string,
 *   maxCards?: number,
 *   enableLightbox?: boolean,
 *   layout?: 'grid' | 'slide',
 * }} props
 */
export function DreamBoardSlideCollage({
  assets,
  title = 'My Dream Board',
  maxCards,
  enableLightbox = true,
  layout = 'grid',
}) {
  const slideMax = maxCards ?? getDreamBoardMaxCards();
  const allCards = normalizeDreamBoardCards(assets);
  const cards = allCards.filter(
    (asset) => asset.imageUrl || asset.caption.trim() || asset.category,
  );
  const visible = cards.slice(0, slideMax);
  const count = visible.length;
  const [lightboxAsset, setLightboxAsset] = useState(null);
  const hiddenCount = Math.max(0, cards.length - slideMax);
  const isSlide = layout === 'slide';

  if (!count) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm text-slate-500">Add dream cards with photos and captions in Dream Board Studio.</p>
      </div>
    );
  }

  const layoutClass = isSlide
    ? dreamBoardSlideGridClass(count)
    : count <= 1
      ? 'grid-cols-1'
      : count === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <>
      <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-projection">
        <div className="border-b border-white/10 bg-gradient-to-r from-spike to-spike-dark px-4 py-2">
          <figcaption className="text-sm font-bold tracking-wide text-white">{title}</figcaption>
          <p className="mt-0.5 text-[11px] font-medium text-red-100/90">
            {hiddenCount > 0
              ? `Showing ${count} of ${cards.length} cards`
              : `${cards.length} dream card${cards.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div
          className={`grid w-full gap-2 p-2 sm:gap-2.5 sm:p-3 ${layoutClass} ${
            isSlide ? 'aspect-video' : ''
          }`}
        >
          {visible.map((asset) => {
            const category = dreamBoardCategoryMeta(asset.category);
            const caption = asset.caption.trim();
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => enableLightbox && setLightboxAsset(asset)}
                className={`flex overflow-hidden rounded-lg bg-slate-800 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-spike-light ${
                  isSlide ? 'min-h-0 flex-col' : 'flex-col'
                }`}
              >
                <div
                  className={`w-full shrink-0 overflow-hidden ${
                    isSlide ? 'min-h-0 flex-1' : 'aspect-[4/3]'
                  }`}
                >
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={caption || category.label}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const placeholder = e.currentTarget.nextElementSibling;
                        if (placeholder instanceof HTMLElement) {
                          placeholder.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`flex h-full min-h-[7rem] w-full items-center justify-center bg-gradient-to-br from-spike-muted/30 to-slate-800 text-3xl text-white/30 ${
                      asset.imageUrl ? 'hidden' : ''
                    }`}
                  >
                    ✦
                  </div>
                </div>
                <div
                  className={`shrink-0 border-t border-white/10 bg-slate-950/95 px-2.5 py-2 sm:px-3 sm:py-2.5 ${
                    isSlide ? 'min-h-[4.75rem] max-h-[45%] overflow-y-auto' : ''
                  }`}
                >
                  <span className="inline-block rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 sm:text-[11px]">
                    {category.label}
                  </span>
                  {caption ? (
                    <p className="mt-1.5 whitespace-pre-wrap text-xs font-medium leading-relaxed text-white sm:text-sm">
                      {caption}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs italic text-slate-400">No caption yet</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {hiddenCount > 0 ? (
          <p className="border-t border-white/10 px-4 py-2 text-xs text-slate-300">
            +{hiddenCount} more card{hiddenCount === 1 ? '' : 's'} — scroll to the full grid below or tap any card
            to enlarge.
          </p>
        ) : enableLightbox && count > 0 ? (
          <p className="border-t border-white/10 px-4 py-2 text-xs text-slate-300">
            Tap any card to view the full caption and image.
          </p>
        ) : null}
      </figure>
      <DreamBoardLightbox asset={lightboxAsset} onClose={() => setLightboxAsset(null)} />
    </>
  );
}
