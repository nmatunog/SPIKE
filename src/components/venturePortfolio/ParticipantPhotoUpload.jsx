import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { getPortfolioSettings, savePortfolioSettings } from '../../lib/portfolioStorage.js';

const MAX_BYTES = 2_500_000;

/**
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   onUpdated?: () => void,
 * }} props
 */
export function ParticipantPhotoUpload({ participantId, participantName = 'Participant', onUpdated }) {
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const [photoUrl, setPhotoUrl] = useState(() => getPortfolioSettings(participantId).photoUrl);
  const [error, setError] = useState('');

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Choose a JPG or PNG image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 2.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      savePortfolioSettings(participantId, { photoUrl: dataUrl });
      setPhotoUrl(dataUrl);
      setError('');
      onUpdated?.();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {photoUrl ? (
        <img src={photoUrl} alt="" className="h-20 w-20 rounded-2xl border border-slate-200 object-cover" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-2xl font-bold text-slate-400">
          {participantName.charAt(0)}
        </div>
      )}
      <div>
        <button
          type="button"
          className="spike-btn-secondary inline-flex items-center gap-2 text-sm"
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={16} /> {photoUrl ? 'Change photo' : 'Upload photo'}
        </button>
        <p className="mt-1 text-xs text-slate-500">Shown on your portfolio cover and Day 5 presentation.</p>
        {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
      </div>
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
