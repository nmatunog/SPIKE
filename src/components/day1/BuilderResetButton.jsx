import { RotateCcw } from 'lucide-react';

/**
 * @param {{ onReset: () => void, disabled?: boolean, label?: string, confirmMessage?: string }} props
 */
export function BuilderResetButton({
  onReset,
  disabled = false,
  label = 'Reset all fields',
  confirmMessage = 'Clear all entries for this builder? You can fill them in again before saving to your Blueprint.',
}) {
  function handleClick() {
    if (!window.confirm(confirmMessage)) {
      return;
    }
    onReset();
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40"
    >
      <RotateCcw size={16} />
      {label}
    </button>
  );
}
