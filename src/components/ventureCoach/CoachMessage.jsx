import { Sparkles } from 'lucide-react';

/**
 * @param {{ role?: 'coach' | 'user', children: import('react').ReactNode, className?: string }} props
 */
export function CoachMessage({ role = 'coach', children, className = '' }) {
  if (role === 'user') {
    return (
      <div className={`flex justify-end ${className}`}>
        <div className="max-w-[90%] rounded-2xl rounded-br-md bg-spike px-4 py-3 text-sm text-white shadow-sm sm:max-w-lg">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${className}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-spike to-spike-dark text-white shadow-sm">
        <Sparkles size={16} />
      </div>
      <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 shadow-card sm:max-w-xl">
        {children}
      </div>
    </div>
  );
}

/**
 * @param {{ options: Array<{ id: string, label: string }>, selected: string[], multi?: boolean, onToggle: (id: string) => void }} props
 */
export function CoachCardGrid({ options, selected, onToggle }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {options.map((opt) => {
        const active = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`rounded-xl border-2 px-3 py-3 text-left text-sm font-medium transition hover:shadow-md ${
              active
                ? 'border-spike bg-spike-muted text-spike shadow-sm ring-2 ring-spike/15'
                : 'border-slate-200 bg-white text-slate-800 hover:border-spike/30'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * @param {{ options: Array<{ id: string, label: string }>, value: string, onChange: (id: string) => void }} props
 */
export function CoachRadioList({ options, value, onChange }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
            value === opt.id ? 'border-spike bg-spike-muted' : 'border-slate-200 bg-white hover:border-spike/30'
          }`}
        >
          <input
            type="radio"
            name="coach-radio"
            checked={value === opt.id}
            onChange={() => onChange(opt.id)}
            className="text-spike focus:ring-spike"
          />
          <span className="text-sm font-medium text-slate-800">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
