import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

const MAX_BYTES = 2_500_000;
const MAX_DATA_URL_CHARS = 700_000;

/**
 * Resize/compress an image file to a data URL small enough for profiles.avatar_url.
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 640;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process image.'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      let quality = 0.88;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length > MAX_DATA_URL_CHARS && quality > 0.45) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      if (dataUrl.length > MAX_DATA_URL_CHARS) {
        reject(new Error('Image is still too large after compression. Try a smaller photo.'));
        return;
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Optional RA-SPIKE profile photo — never required for navigation.
 * @param {{
 *   userId: string,
 *   name?: string,
 *   avatarUrl?: string | null,
 *   onUpdated?: () => void,
 * }} props
 */
export function RaSpikeProfilePhotoUpload({ userId, name = 'Rookie', avatarUrl, onUpdated }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [preview, setPreview] = useState(avatarUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function saveAvatar(dataUrl) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Photo upload requires Supabase.');
    }
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ avatar_url: dataUrl })
      .eq('id', userId);
    if (updateErr) throw updateErr;
    setPreview(dataUrl);
    onUpdated?.();
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Choose a JPG or PNG image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 2.5 MB.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      await saveAvatar(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {preview ? (
        <img src={preview} alt="" className="h-20 w-20 rounded-full border-2 border-spike/20 object-cover" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-spike-muted text-2xl font-bold text-spike">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <button
          type="button"
          disabled={busy}
          className="spike-btn-secondary inline-flex items-center gap-2 text-sm"
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={16} aria-hidden />
          {busy ? 'Uploading…' : preview ? 'Change photo' : 'Upload photo (optional)'}
        </button>
        <p className="mt-1 text-xs text-slate-500">JPG or PNG, under 2.5 MB — optional.</p>
        {error ? <p className="mt-1 text-xs text-red-700" role="alert">{error}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
