import { useState } from 'react';
import { dreamBoardCategoryMeta } from '../../lib/venturePortfolioService.js';
import { dreamBoardSlideGridClass, getDreamBoardMaxCards } from '../../lib/dreamBoardConfig.js';
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
  const cards = assets.filter((asset) => asset.imageUrl || asset.caption?.trim());
  const count = Math.min(cards.length, slideMax);
  const [lightboxAsset, setLightboxAsset] = useState(null);
  const hiddenCount = Math.max(0, cards.length - slideMax);

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
      </div>
      <div className={`grid aspect-video w-full gap-1 p-1 ${layoutClass}`}>
        {cards.slice(0, slideMax).map((asset) => {
          const category = dreamBoardCategoryMeta(asset.category);
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => enableLightbox && setLightboxAsset(asset)}
              className="relative min-h-0 overflow-hidden rounded-lg bg-slate-800 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-spike-light"
            >
              {asset.imageUrl ? (
                <img src={asset.imageUrl} alt={asset.caption || category.label} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-spike-muted/30 to-slate-800 text-3xl text-white/30">
                  ✦
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2">
                <span className="inline-block rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800">
                  {category.label}
                </span>
                {asset.caption?.trim() ? (
                  <p className="mt-1 line-clamp-3 text-xs font-medium leading-snug text-white">{asset.caption}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      {hiddenCount > 0 ? (
        <p className="border-t border-white/10 px-4 py-2 text-xs text-slate-300">
          +{hiddenCount} more card{hiddenCount === 1 ? '' : 's'} — open the full grid below or tap any card to enlarge.
        </p>
      ) : enableLightbox && count > 0 ? (
        <p className="border-t border-white/10 px-4 py-2 text-xs text-slate-300">Tap any card to view full size.</p>
      ) : null}
    </figure>
    <DreamBoardLightbox asset={lightboxAsset} onClose={() => setLightboxAsset(null)} />
    </>
  );
}
