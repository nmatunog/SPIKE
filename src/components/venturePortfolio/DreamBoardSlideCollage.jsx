import { useState } from 'react';
import { dreamBoardCategoryMeta } from '../../lib/venturePortfolioService.js';
import {
  dreamBoardCaptionClampClass,
  dreamBoardSlideGridClass,
  getDreamBoardMaxCards,
} from '../../lib/dreamBoardConfig.js';
import { DreamBoardLightbox } from './DreamBoardLightbox.jsx';

/**
 * 16:9 presentation slide collage for dream board assets with category tags and captions.
 * @param {{
 *   assets: Array<{ id: string, category: string, caption: string, imageUrl?: string }>,
 *   title?: string,
 *   maxCards?: number,
 *   enableLightbox?: boolean,
 * }} props
 */
export function DreamBoardSlideCollage({ assets, title = 'My Dream Board', maxCards, enableLightbox = true }) {
  const slideMax = maxCards ?? getDreamBoardMaxCards();
  const cards = assets.filter(
    (asset) => asset.imageUrl || String(asset.caption ?? '').trim() || asset.category,
  );
  const count = Math.min(cards.length, slideMax);
  const [lightboxAsset, setLightboxAsset] = useState(null);
  const hiddenCount = Math.max(0, cards.length - slideMax);
  const captionClamp = dreamBoardCaptionClampClass(count);

  if (!count) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm text-slate-500">Add dream cards with photos and captions in Dream Board Studio.</p>
      </div>
    );
  }

  const layoutClass = dreamBoardSlideGridClass(count);

  return (
    <>
      <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-projection">
        <div className="border-b border-white/10 bg-gradient-to-r from-spike to-spike-dark px-4 py-2">
          <figcaption className="text-sm font-bold tracking-wide text-white">{title}</figcaption>
          {cards.length > 0 ? (
            <p className="mt-0.5 text-[11px] font-medium text-red-100/90">
              {count < cards.length
                ? `Showing ${count} of ${cards.length} cards`
                : `${cards.length} dream card${cards.length === 1 ? '' : 's'}`}
            </p>
          ) : null}
        </div>
        <div className={`grid aspect-video w-full gap-1.5 p-1.5 sm:gap-2 sm:p-2 ${layoutClass}`}>
          {cards.slice(0, slideMax).map((asset) => {
            const category = dreamBoardCategoryMeta(asset.category);
            const caption = asset.caption?.trim() ?? '';
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => enableLightbox && setLightboxAsset(asset)}
                className="flex min-h-0 flex-col overflow-hidden rounded-lg bg-slate-800 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-spike-light"
              >
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  {asset.imageUrl ? (
                    <img
                      src={asset.imageUrl}
                      alt={caption || category.label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-spike-muted/30 to-slate-800 text-3xl text-white/30">
                      ✦
                    </div>
                  )}
                </div>
                <div className="shrink-0 border-t border-white/10 bg-slate-950/95 px-2 py-1.5 sm:px-2.5 sm:py-2">
                  <span className="inline-block rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 sm:text-[11px]">
                    {category.label}
                  </span>
                  {caption ? (
                    <p
                      title={caption}
                      className={`mt-1 text-[11px] font-medium leading-snug text-white sm:text-xs md:text-sm md:leading-relaxed ${captionClamp}`}
                    >
                      {caption}
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
        {hiddenCount > 0 ? (
          <p className="border-t border-white/10 px-4 py-2 text-xs text-slate-300">
            +{hiddenCount} more card{hiddenCount === 1 ? '' : 's'} — open the full grid below or tap any card to
            enlarge.
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
