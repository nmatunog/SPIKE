import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

const MAX_BYTES = 2_500_000;

/**
 * @param {{
 *   label?: string,
 *   hint?: string,
 *   onUpload: (dataUrl: string) => Promise<void>,
 *   disabled?: boolean,
 * }} props
 */
export function OnboardingPhotoCapture({ label = 'Upload photo', hint, onUpload, disabled }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Choose a JPG or PNG image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 2.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result ?? '');
      setPreview(dataUrl);
      setBusy(true);
      setError('');
      try {
        await onUpload(dataUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.');
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      {preview ? (
        <img src={preview} alt="" className="mx-auto mb-4 h-48 w-full max-w-sm rounded-2xl object-cover" />
      ) : null}
      <button
        type="button"
        disabled={disabled || busy}
        className="spike-btn-primary inline-flex items-center gap-2"
        onClick={() => inputRef.current?.click()}
      >
        <Camera size={16} /> {busy ? 'Uploading…' : label}
      </button>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
