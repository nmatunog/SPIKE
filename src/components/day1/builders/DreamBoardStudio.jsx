import { useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { DREAM_BOARD_CATEGORIES } from '../../../lib/day1BuilderConstants.js';

let assetCounter = 0;

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function DreamBoardStudio({ draft, completed, onChange, onComplete }) {
  const [assets, setAssets] = useState(
    /** @type {Array<{ id: string, category: string, caption: string, imageUrl: string }>} */ (
      draft.assets ?? []
    ),
  );
  const [activeCategory, setActiveCategory] = useState(DREAM_BOARD_CATEGORIES[0].id);

  function sync(next) {
    setAssets(next);
    onChange({ ...draft, assets: next });
  }

  function addCard() {
    sync([
      ...assets,
      {
        id: `asset-${++assetCounter}`,
        category: activeCategory,
        caption: '',
        imageUrl: '',
      },
    ]);
  }

  function updateAsset(id, patch) {
    sync(assets.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function removeAsset(id) {
    sync(assets.filter((a) => a.id !== id));
  }

  function moveAsset(id, direction) {
    const idx = assets.findIndex((a) => a.id === id);
    const target = idx + direction;
    if (target < 0 || target >= assets.length) return;
    const next = [...assets];
    [next[idx], next[target]] = [next[target], next[idx]];
    sync(next);
  }

  const canComplete = assets.filter((a) => a.caption.trim().length >= 3).length >= 3;

  return (
    <div className="space-y-6">
      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">Dream Board Studio</h4>
        <p className="mb-4 text-sm text-slate-600">
          Add vision cards by category. Drag to reorder. Paste an image URL or describe your dream.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {DREAM_BOARD_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activeCategory === cat.id
                  ? 'border-spike bg-spike text-white'
                  : `${cat.color} border`
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button type="button" onClick={addCard} className="spike-btn-secondary mb-4">
          <Plus size={16} /> Add dream card
        </button>

        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {assets.map((asset) => {
            const cat = DREAM_BOARD_CATEGORIES.find((c) => c.id === asset.category);
            return (
              <div
                key={asset.id}
                className={`mb-4 break-inside-avoid rounded-2xl border-2 p-4 shadow-sm ${cat?.color ?? 'bg-white border-slate-200'}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase">{cat?.label}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveAsset(asset.id, -1)} className="p-1 text-slate-500">
                      <GripVertical size={14} />
                    </button>
                    <button type="button" onClick={() => removeAsset(asset.id)} className="p-1 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt=""
                    className="mb-2 max-h-32 w-full rounded-lg object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <input
                  type="url"
                  placeholder="Image URL (optional)"
                  className="mb-2 w-full rounded-lg border border-white/60 bg-white/80 px-2 py-1.5 text-xs"
                  value={asset.imageUrl}
                  onChange={(e) => updateAsset(asset.id, { imageUrl: e.target.value })}
                />
                <textarea
                  rows={3}
                  placeholder="Describe this dream…"
                  className="w-full rounded-lg border border-white/60 bg-white/80 px-2 py-1.5 text-sm"
                  value={asset.caption}
                  onChange={(e) => updateAsset(asset.id, { caption: e.target.value })}
                />
              </div>
            );
          })}
        </div>
      </section>

      {!completed ? (
        <button
          type="button"
          disabled={!canComplete}
          onClick={() => onComplete({ assets })}
          className="spike-btn-primary disabled:opacity-50"
        >
          Publish Dream Board to Blueprint
        </button>
      ) : (
        <p className="text-sm font-semibold text-emerald-700">✓ Dream Board saved to Ambition & Purpose</p>
      )}
    </div>
  );
}
