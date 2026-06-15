import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, Upload } from 'lucide-react';
import { DREAM_BOARD_CATEGORIES } from '../../../lib/day1BuilderConstants.js';
import { BuilderSubmissionFooter } from '../BuilderSubmissionFooter.jsx';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/** @returns {string} */
function newAssetId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `asset-${crypto.randomUUID()}`;
  }
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

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
 *   disabled?: boolean,
 *   onImage: (url: string) => void,
 *   onError: (message: string) => void,
 * }} props
 */
function DreamBoardImageUpload({ assetId, imageUrl, disabled = false, onImage, onError }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const busyRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files) {
    if (disabled || busyRef.current) return;
    const file = files?.[0];
    if (!file) return;
    busyRef.current = true;
    try {
      const dataUrl = await readImageFile(file);
      onImage(dataUrl);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      busyRef.current = false;
    }
  }

  function openFilePicker(event) {
    event.stopPropagation();
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter') openFilePicker(e);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (!disabled) void handleFiles(e.dataTransfer.files);
        }}
        onClick={openFilePicker}
        className={`rounded-xl border-2 border-dashed px-3 py-4 text-center transition ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${
          dragging
            ? 'border-spike bg-spike-muted/40'
            : 'border-white/80 bg-white/50 hover:border-spike/40 hover:bg-white/70'
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Dream board"
            className="pointer-events-none mx-auto mb-2 max-h-36 w-full rounded-lg object-cover"
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
        disabled={disabled}
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={openFilePicker}
          className="inline-flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-2xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
        >
          <Upload size={12} /> Upload photo
        </button>
        {imageUrl ? (
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onImage('');
            }}
            className="rounded-lg bg-white/80 px-2 py-1 text-2xs font-semibold text-red-600 hover:bg-white disabled:opacity-50"
          >
            Remove photo
          </button>
        ) : null}
      </div>

      <input
        type="url"
        placeholder="Or paste an image URL"
        disabled={disabled}
        className="w-full rounded-lg border border-white/60 bg-white/80 px-2 py-1.5 text-xs disabled:opacity-60"
        value={imageUrl.startsWith('data:') ? '' : imageUrl}
        onChange={(e) => onImage(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/**
 * @param {{
 *   draft: Record<string, unknown>,
 *   completed: boolean,
 *   editLocked?: boolean,
 *   refining?: boolean,
 *   completedAt?: string | null,
 *   firstCompletedAt?: string | null,
 *   canRefine?: boolean,
 *   onStartRefine?: () => void,
 *   onChange: (d: Record<string, unknown>) => void,
 *   onComplete: (d: Record<string, unknown>) => void,
 * }} props
 */
export function DreamBoardStudio({
  draft,
  completed,
  editLocked = false,
  completedAt,
  firstCompletedAt,
  canRefine = false,
  onStartRefine,
  onChange,
  onComplete,
}) {
  const [assets, setAssets] = useState(
    /** @type {Array<{ id: string, category: string, caption: string, imageUrl: string }>} */ (
      draft.assets ?? []
    ),
  );
  const [activeCategory, setActiveCategory] = useState(DREAM_BOARD_CATEGORIES[0].id);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const incoming = /** @type {typeof assets} */ (draft.assets ?? []);
    setAssets(incoming);
  }, [draft.assets]);

  function sync(next) {
    setAssets(next);
    onChange({ assets: next });
  }

  function addCard() {
    sync([
      ...assets,
      {
        id: newAssetId(),
        category: activeCategory,
        caption: '',
        imageUrl: '',
      },
    ]);
  }

  /** @param {string} id @param {Partial<{ category: string, caption: string, imageUrl: string }>} patch */
  function updateAsset(id, patch) {
    setAssets((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      onChange({ assets: next });
      return next;
    });
  }

  function removeAsset(id) {
    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      onChange({ assets: next });
      return next;
    });
  }

  function moveAsset(id, direction) {
    setAssets((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx < 0) return prev;
      const category = prev[idx].category;
      const inCategory = prev.filter((a) => a.category === category);
      const localIdx = inCategory.findIndex((a) => a.id === id);
      const targetLocal = localIdx + direction;
      if (targetLocal < 0 || targetLocal >= inCategory.length) return prev;

      const targetId = inCategory[targetLocal].id;
      const targetIdx = prev.findIndex((a) => a.id === targetId);
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      onChange({ assets: next });
      return next;
    });
  }

  const canComplete = assets.filter((a) => a.caption.trim().length >= 3).length >= 3;
  const readOnly = editLocked;

  return (
    <div className={`space-y-6 ${readOnly ? 'pointer-events-none opacity-75' : ''}`}>
      <section className="spike-card">
        <h4 className="mb-1 text-lg font-semibold text-slate-900">Dream Board Studio</h4>
        <p className="mb-4 text-sm text-slate-600">
          Add dream cards by category. Each card stays in its category — deleting one card never moves
          another into the wrong group.
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

        <button type="button" onClick={addCard} className="spike-btn-secondary mb-6">
          <Plus size={16} /> Add dream card to {DREAM_BOARD_CATEGORIES.find((c) => c.id === activeCategory)?.label}
        </button>

        <div className="space-y-8">
          {DREAM_BOARD_CATEGORIES.map((cat) => {
            const catAssets = assets.filter((a) => a.category === cat.id);
            if (!catAssets.length) return null;

            return (
              <section key={cat.id}>
                <h5 className={`mb-3 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase ${cat.color}`}>
                  {cat.label}
                </h5>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catAssets.map((asset, indexInCategory) => (
                    <div
                      key={asset.id}
                      className={`rounded-2xl border-2 p-4 shadow-sm ${cat.color}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label className="min-w-0 flex-1">
                          <span className="sr-only">Category</span>
                          <select
                            value={asset.category}
                            onChange={(e) => updateAsset(asset.id, { category: e.target.value })}
                            className="w-full rounded-lg border border-white/60 bg-white/80 px-2 py-1 text-2xs font-semibold"
                          >
                            {DREAM_BOARD_CATEGORIES.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            disabled={indexInCategory === 0}
                            onClick={() => moveAsset(asset.id, -1)}
                            className="p-1 text-slate-500 disabled:opacity-30"
                            aria-label="Move card up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={indexInCategory === catAssets.length - 1}
                            onClick={() => moveAsset(asset.id, 1)}
                            className="p-1 text-slate-500 disabled:opacity-30"
                            aria-label="Move card down"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAsset(asset.id)}
                            className="p-1 text-red-500"
                            aria-label="Delete card"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <DreamBoardImageUpload
                        assetId={asset.id}
                        imageUrl={asset.imageUrl}
                        disabled={readOnly}
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
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {!assets.length ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Pick a category above, then add your first dream card.
          </p>
        ) : null}
      </section>

      <BuilderSubmissionFooter
        completed={completed}
        editLocked={editLocked}
        completedAt={completedAt}
        firstCompletedAt={firstCompletedAt}
        canRefine={canRefine}
        onStartRefine={onStartRefine}
        completeDisabled={!canComplete}
        completeLabel="Publish Dream Board to Blueprint"
        updateLabel="Update Dream Board"
        savedLabel="✓ Dream Board saved to Ambition & Purpose"
        onComplete={() => onComplete({ assets })}
      />
    </div>
  );
}
