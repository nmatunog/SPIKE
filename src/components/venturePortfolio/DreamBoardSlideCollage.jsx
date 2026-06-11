import { dreamBoardCategoryMeta } from '../../lib/venturePortfolioService.js';

/**
 * 16:9 presentation slide collage for dream board assets with category tags and captions.
 * @param {{
 *   assets: Array<{ id: string, category: string, caption: string, imageUrl?: string }>,
 *   title?: string,
 * }} props
 */
export function DreamBoardSlideCollage({ assets, title = 'My Dream Board' }) {
  const cards = assets.filter((asset) => asset.imageUrl || asset.caption?.trim());
  const count = Math.min(cards.length, 6);

  if (!count) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        <p className="text-sm text-slate-500">Add dream cards with photos and captions in Dream Board Studio.</p>
      </div>
    );
  }

  const layoutClass =
    count === 1
      ? 'grid-cols-1 grid-rows-1'
      : count === 2
        ? 'grid-cols-2 grid-rows-1'
        : count === 3
          ? 'grid-cols-3 grid-rows-1'
          : count === 4
            ? 'grid-cols-2 grid-rows-2'
            : 'grid-cols-3 grid-rows-2';

  return (
    <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-projection">
      <div className="border-b border-white/10 bg-gradient-to-r from-spike to-spike-dark px-4 py-2">
        <figcaption className="text-sm font-bold tracking-wide text-white">{title}</figcaption>
      </div>
      <div className={`grid aspect-video w-full gap-1 p-1 ${layoutClass}`}>
        {cards.slice(0, 6).map((asset) => {
          const category = dreamBoardCategoryMeta(asset.category);
          return (
            <div key={asset.id} className="relative min-h-0 overflow-hidden rounded-lg bg-slate-800">
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
                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-white">{asset.caption}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
