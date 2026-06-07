import { useRef, useState } from 'react';
import { GripVertical, ImagePlus, Plus, Trash2, Upload } from 'lucide-react';
import { DREAM_BOARD_CATEGORIES } from '../../../lib/day1BuilderConstants.js';

let assetCounter = 0;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** @param {File} file */
function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (JPG, PNG, or WebP).'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Image must be under 2 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
}

/**
 * @param {{
 *   assetId: string,
 *   imageUrl: string,
 *   onImage: (url: string) => void,
 *   onError: (message: string) => void,
 * }} props
 */
function DreamBoardImageUpload({ assetId, imageUrl, onImage, onError }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFile(file);
      onImage(dataUrl);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-3 py-4 text-center transition ${
          dragging
            ? 'border-spike bg-spike-muted/40'
            : 'border-white/80 bg-white/50 hover:border-spike/40 hover:bg-white/70'
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Dream board"
            className="mx-auto mb-2 max-h-36 w-full rounded-lg object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <ImagePlus size={28} className="mx-auto mb-2 text-slate-400" />
        )}
        <p className="text-xs font-semibold text-slate-700">
          {dragging ? 'Drop photo here' : 'Drag a photo here or tap to upload'}
        </p>
        <p className="mt-1 text-2xs text-slate-500">JPG, PNG, WebP · max 2 MB</p>
      </div>

      <input
        ref={inputRef}
        id={`dream-board-file-${assetId}`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-2xs font-semibold text-slate-700 hover:bg-white"
        >
          <Upload size={12} /> Upload photo
        </button>
        {imageUrl ? (
          <button
            type="button"
            onClick={() => onImage('')}
            className="rounded-lg bg-white/80 px-2 py-1 text-2xs font-semibold text-red-600 hover:bg-white"
          >
            Remove photo
          </button>
        ) : null}
      </div>

      <input
        type="url"
        placeholder="Or paste an image URL"
        className="w-full rounded-lg border border-white/60 bg-white/80 px-2 py-1.5 text-xs"
        value={imageUrl.startsWith('data:') ? '' : imageUrl}
        onChange={(e) => onImage(e.target.value)}
      />
    </div>
  );
}

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
  const [uploadError, setUploadError] = useState('');

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
          Add dream cards by category. Upload or drag a photo, reorder cards, and describe each dream.
        </p>

        {uploadError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {uploadError}
          </p>
        ) : null}

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

                <DreamBoardImageUpload
                  assetId={asset.id}
                  imageUrl={asset.imageUrl}
                  onImage={(url) => {
                    setUploadError('');
                    updateAsset(asset.id, { imageUrl: url });
                  }}
                  onError={setUploadError}
                />

                <textarea
                  rows={3}
                  placeholder="Describe this dream…"
                  className="mt-2 w-full rounded-lg border border-white/60 bg-white/80 px-2 py-1.5 text-sm"
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
