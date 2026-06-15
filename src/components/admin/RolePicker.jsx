import { portalRoleOptionsFor } from '../../lib/terminology.js';

/** @param {{ value: string, onChange: (value: string) => void, allowedValues: string[], name?: string }} props */
export function RolePicker({ value, onChange, allowedValues, name = 'portal-role' }) {
  const options = portalRoleOptionsFor(allowedValues);
  const selectedValue = String(value ?? '').trim().toUpperCase();

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Select role</legend>
      {options.map((opt) => {
        const selected = selectedValue === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
              selected
                ? 'border-spike bg-spike-muted/50 font-semibold text-slate-900'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="h-4 w-4 accent-spike"
            />
            <span className="flex-1">{opt.label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
