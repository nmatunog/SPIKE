import { dreamBoardCategoryMeta } from '../../lib/venturePortfolioService.js';

/**
 * @param {{
 *   assets: Array<{ id: string, category: string, caption: string, imageUrl?: string, addedAt?: string | null }>,
 *   emptyMessage?: string,
 *   showMeta?: boolean,
 * }} props
 */
export function DreamBoardCollage({
  assets,
  emptyMessage = 'Complete Dream Board Studio to add your vision cards.',
  showMeta = true,
}) {
  const cards = assets.filter((asset) => asset.caption?.trim() || asset.imageUrl);

  if (!cards.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
      {cards.map((asset) => {
        const category = dreamBoardCategoryMeta(asset.category);
        const addedLabel = asset.addedAt
          ? new Date(asset.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          : null;

        return (
          <article
            key={asset.id}
            className={`mb-4 break-inside-avoid overflow-hidden rounded-2xl border shadow-card transition hover:shadow-projection ${category.color}`}
          >
            {asset.imageUrl ? (
              <img
                src={asset.imageUrl}
                alt={asset.caption || category.label}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-spike-muted/40 to-white px-4 text-center">
                <span className="text-3xl opacity-40" aria-hidden>
                  ✦
                </span>
              </div>
            )}
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-block rounded-full bg-white/80 px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-slate-600">
                  {category.label}
                </span>
                {showMeta && addedLabel ? (
                  <span className="text-2xs text-slate-500">Added {addedLabel}</span>
                ) : null}
              </div>
              {asset.caption?.trim() ? (
                <p className="text-sm font-medium leading-snug text-slate-900">{asset.caption}</p>
              ) : null}
              {showMeta ? (
                <p className="text-2xs font-semibold uppercase tracking-wide text-emerald-700">Captured</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
