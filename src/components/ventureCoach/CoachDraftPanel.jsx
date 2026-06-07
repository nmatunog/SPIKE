import { refineText } from '../../lib/ventureCoachEngine.js';
import { REFINE_ACTIONS, FUTURE_SELF_REFINE_ACTIONS } from '../../lib/ventureCoachConstants.js';

/**
 * @param {{
 *   title: string,
 *   draft: string,
 *   onDraftChange: (text: string) => void,
 *   onAccept: () => void,
 *   refineSet?: 'default' | 'future-self',
 *   acceptLabel?: string,
 * }} props
 */
export function CoachDraftPanel({
  title,
  draft,
  onDraftChange,
  onAccept,
  refineSet = 'default',
  acceptLabel = 'Accept Draft',
}) {
  const actions = refineSet === 'future-self' ? FUTURE_SELF_REFINE_ACTIONS : REFINE_ACTIONS;

  return (
    <section className="spike-card space-y-4 border-spike/20 bg-gradient-to-br from-white to-spike-muted/20">
      <div>
        <p className="spike-label text-spike">AI Draft</p>
        <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
      </div>

      <textarea
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
        rows={6}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
      />

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Refine</p>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onDraftChange(refineText(draft, action.id))}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-spike/40 hover:text-spike"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onAccept} className="spike-btn-primary">
          {acceptLabel}
        </button>
      </div>
    </section>
  );
}
