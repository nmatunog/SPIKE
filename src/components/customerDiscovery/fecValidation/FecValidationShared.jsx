import { Check, Lock, Sparkles } from 'lucide-react';
import { FEC_BOX_META } from '../../../lib/customerDiscovery/week2FecValidationConstants.js';

/**
 * Compact FEC snapshot — boxes 1–5 with confidence animation.
 * @param {{ boxScores: Record<string, { before: number, after: number, evidenceCount: number, status: string }>, animate?: boolean }} props
 */
export function FecValidationCanvas({ boxScores, animate = true }) {
  const boxes = [
    { id: 'uvp', order: 1 },
    { id: 'who_we_serve', order: 2 },
    { id: 'problem_we_solve', order: 3 },
    { id: 'client_experience', order: 4 },
    { id: 'winning_strategy', order: 5 },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {boxes.map(({ id }) => {
        const meta = FEC_BOX_META[id];
        const score = boxScores[id] ?? { before: meta.before, after: meta.before, evidenceCount: 0, status: 'Needs Validation' };
        const validated = score.after > score.before;
        return (
          <article
            key={id}
            className={`rounded-xl border p-3 transition-all duration-700 ${
              validated ? 'border-emerald-300 bg-emerald-50/80' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{meta.label}</p>
            <div className="mt-2 flex items-baseline gap-1">
              {animate && validated ? (
                <>
                  <span className="text-sm text-slate-400 line-through">{score.before}%</span>
                  <span className="text-lg font-bold text-emerald-700">→ {score.after}%</span>
                </>
              ) : (
                <span className="text-lg font-bold text-slate-800">{score.after}%</span>
              )}
            </div>
            <p className="mt-1 text-[10px] text-slate-500">{score.evidenceCount} interview refs</p>
            <p className={`mt-1 text-[10px] font-semibold ${validated ? 'text-emerald-700' : 'text-amber-700'}`}>
              {score.status}
            </p>
          </article>
        );
      })}
    </div>
  );
}

/**
 * @param {{ roles: Record<string, string>, memberNames: Record<string, string>, currentParticipantId: string }} props
 */
export function SquadRolesBanner({ roles, memberNames, currentParticipantId }) {
  const items = [
    { key: 'research_lead', label: 'Research Lead', detail: 'Evidence review' },
    { key: 'fec_lead', label: 'FEC Lead', detail: 'FEC validation' },
    { key: 'pitch_lead', label: 'Pitch Lead', detail: 'Friday presentation' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const holderId = roles[item.key];
        const isYou = holderId === currentParticipantId;
        return (
          <span
            key={item.key}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isYou ? 'bg-spike/10 text-spike ring-1 ring-spike/30' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isYou ? <Check size={12} aria-hidden /> : null}
            {item.label}: {memberNames[holderId] ?? 'Assigned'}
          </span>
        );
      })}
    </div>
  );
}

/**
 * @param {{ locked: boolean, label: string }} props
 */
export function FecStepLock({ locked, label }) {
  if (!locked) return null;
  return (
    <p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <Lock size={14} aria-hidden />
      Complete {label} first to unlock this step.
    </p>
  );
}

/**
 * Before / After comparison block.
 * @param {{ before: string, after: string, title?: string }} props
 */
export function BeforeAfterBlock({ before, after, title = 'Validation' }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-bold uppercase text-slate-400">Before</p>
        <p className="mt-2 text-sm text-slate-700">{before || '—'}</p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <p className="text-[10px] font-bold uppercase text-emerald-700">{title}</p>
        <p className="mt-2 text-sm font-medium text-slate-900">{after || '—'}</p>
      </div>
    </div>
  );
}

/** @param {{ children: React.ReactNode }} props */
export function AiGeneratedBadge({ children }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold text-spike">
      <Sparkles size={12} aria-hidden />
      {children ?? 'SPIKE AI generated — review, edit, approve'}
    </p>
  );
}
