import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadCoachDeckFile, isCoachDeckDownloadUrl } from '../../lib/facultyDeckDownload.js';

/**
 * @param {{
 *   href: string,
 *   label: string,
 *   className?: string,
 *   variant?: 'button' | 'link',
 * }} props
 */
export function FacultyDeckDownloadButton({
  href,
  label,
  className = '',
  variant = 'button',
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!href || !isCoachDeckDownloadUrl(href)) return null;

  const handleClick = async () => {
    setBusy(true);
    setError('');
    try {
      await downloadCoachDeckFile(href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setBusy(false);
    }
  };

  const baseClass =
    variant === 'link'
      ? 'inline-flex items-center gap-1.5 font-semibold text-spike hover:underline disabled:opacity-60'
      : 'inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-50 disabled:opacity-60';

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`${baseClass} ${className}`.trim()}
      >
        <Download size={14} aria-hidden />
        {busy ? 'Preparing…' : label}
      </button>
      {error ? <span className="text-xs text-rose-700">{error}</span> : null}
    </span>
  );
}
