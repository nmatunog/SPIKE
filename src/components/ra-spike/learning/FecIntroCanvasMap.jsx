import { Check, Lock } from 'lucide-react';

/** @typedef {{ id: string, title: string, question?: string }} IntroStep */

const LOCKED_PILLARS = [
  {
    label: 'Capture Value',
    items: ['Revenue Streams', 'Cost Structure', 'Profit Formula'],
  },
  {
    label: 'Enable Value',
    items: ['Key Resources', 'Key Partners', 'Funding Strategy'],
  },
  {
    label: 'Unified Venture Proposition',
    items: ['One sentence that ties your canvas together'],
  },
];

/**
 * Visual map — Week 2 opens only CREATE VALUE (3 blocks); rest locks until Week 3.
 *
 * @param {{
 *   steps: IntroStep[],
 *   activeStepId?: string,
 *   completedStepIds?: string[],
 * }} props
 */
export function FecIntroCanvasMap({ steps, activeStepId, completedStepIds = [] }) {
  return (
    <div className="space-y-4 rounded-2xl border border-spike/25 bg-gradient-to-br from-spike-muted/30 to-white p-4 sm:p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-spike">
          Financial Entrepreneurship Canvas
        </p>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          Week 2 starts with your customer — not the full board. Complete three building blocks
          now; the rest unlocks in Week 3 so you focus on real needs before designing solutions.
        </p>
      </div>

      <div>
        <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-slate-500">
          Week 2 — guided start
        </p>
        <ol className="grid gap-2 sm:grid-cols-3">
          {steps.map((step, index) => {
            const isActive = step.id === activeStepId;
            const isDone = completedStepIds.includes(step.id);
            return (
              <li
                key={step.id}
                className={`rounded-xl border px-3 py-3 text-sm transition ${
                  isActive
                    ? 'border-spike bg-white shadow-sm ring-2 ring-spike/20'
                    : isDone
                      ? 'border-emerald-200 bg-emerald-50/80'
                      : 'border-slate-200 bg-white/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xs font-bold uppercase text-slate-400">Block {index + 1}</span>
                  {isDone ? (
                    <Check size={14} className="shrink-0 text-emerald-600" aria-hidden />
                  ) : null}
                </div>
                <p className="mt-1 font-semibold text-slate-900">{step.title}</p>
                {step.question ? (
                  <p className="mt-1 text-xs leading-snug text-slate-600">{step.question}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/90 px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <Lock size={14} aria-hidden />
          Locked until Week 3
        </p>
        <ul className="mt-3 space-y-2 text-xs text-slate-600">
          {LOCKED_PILLARS.map((pillar) => (
            <li key={pillar.label}>
              <span className="font-semibold text-slate-700">{pillar.label}</span>
              <span className="text-slate-500"> — {pillar.items.join(' · ')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
