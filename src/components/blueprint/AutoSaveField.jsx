import { useEffect, useState } from 'react';

/**
 * Text field with 2-second debounced save.
 * @param {{
 *   label: string,
 *   value: string,
 *   onSave: (value: string) => void,
 *   rows?: number,
 *   placeholder?: string,
 * }} props
 */
export function AutoSaveField({ label, value, onSave, rows = 3, placeholder }) {
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState('saved');

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return undefined;
    setStatus('typing');
    const timer = setTimeout(() => {
      onSave(draft);
      setStatus('saved');
    }, 2000);
    return () => clearTimeout(timer);
  }, [draft, value, onSave]);

  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
        <span className="font-normal normal-case text-gray-400">
          {status === 'typing' ? 'Saving…' : 'Saved'}
        </span>
      </span>
      <textarea
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#8B0000] focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
        rows={rows}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
      />
    </label>
  );
}
