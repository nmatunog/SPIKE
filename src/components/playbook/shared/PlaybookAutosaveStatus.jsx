/**
 * @param {{ status: 'editing' | 'saving' | 'saved' | 'error' | 'offline' }} props
 */
export function PlaybookAutosaveStatus({ status }) {
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'editing'
        ? 'Editing'
        : status === 'error'
          ? 'Save failed — retrying on next edit'
          : status === 'offline'
            ? 'Offline draft'
            : 'Saved';

  const tone =
    status === 'error'
      ? 'text-amber-800 bg-amber-50 border-amber-200'
      : status === 'saved'
        ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
        : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone}`}
      role="status"
      aria-live="polite"
    >
      {label}
    </span>
  );
}
