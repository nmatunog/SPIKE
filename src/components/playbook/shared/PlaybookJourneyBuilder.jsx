import { PlaybookMissionField } from '../shared/PlaybookMissionField.jsx';

const STAGE_INPUT =
  'w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-spike focus:ring-1 focus:ring-spike/20';

/**
 * @param {{
 *   stages: import('../../lib/week5Day1/types.js').JourneyStage[],
 *   onChange: (stages: import('../../lib/week5Day1/types.js').JourneyStage[]) => void,
 *   readOnly?: boolean,
 * }} props
 */
export function PlaybookJourneyBuilder({ stages, onChange, readOnly = false }) {
  function updateStage(index, patch) {
    const next = stages.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(next);
  }

  function addStage() {
    onChange([
      ...stages,
      {
        id: `stage-${Date.now()}`,
        title: 'New stage',
        description: '',
        emotion: '',
        advisorAction: '',
        platformSupport: '',
        risk: '',
      },
    ]);
  }

  function removeStage(index) {
    onChange(stages.filter((_, i) => i !== index));
  }

  function moveStage(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <div key={stage.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${STAGE_INPUT} min-w-[140px] flex-1 font-semibold`}
              value={stage.title}
              disabled={readOnly}
              onChange={(e) => updateStage(index, { title: e.target.value })}
              aria-label={`Stage ${index + 1} title`}
            />
            {!readOnly ? (
              <div className="flex gap-1">
                <button type="button" className="text-xs text-slate-600 hover:underline" onClick={() => moveStage(index, -1)}>Up</button>
                <button type="button" className="text-xs text-slate-600 hover:underline" onClick={() => moveStage(index, 1)}>Down</button>
                <button type="button" className="text-xs text-red-700 hover:underline" onClick={() => removeStage(index)}>Remove</button>
              </div>
            ) : null}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <PlaybookMissionField
              fieldId={`${stage.id}-desc`}
              label="Description"
              type="textarea"
              value={stage.description}
              readOnly={readOnly}
              onChange={(v) => updateStage(index, { description: v })}
            />
            <PlaybookMissionField fieldId={`${stage.id}-emotion`} label="Customer emotion" value={stage.emotion} readOnly={readOnly} onChange={(v) => updateStage(index, { emotion: v })} />
            <PlaybookMissionField fieldId={`${stage.id}-advisor`} label="Advisor action" value={stage.advisorAction} readOnly={readOnly} onChange={(v) => updateStage(index, { advisorAction: v })} />
            <PlaybookMissionField fieldId={`${stage.id}-platform`} label="Platform support" value={stage.platformSupport} readOnly={readOnly} onChange={(v) => updateStage(index, { platformSupport: v })} />
            <PlaybookMissionField fieldId={`${stage.id}-risk`} label="Risk / friction" value={stage.risk} readOnly={readOnly} onChange={(v) => updateStage(index, { risk: v })} />
          </div>
        </div>
      ))}
      {!readOnly ? (
        <button type="button" onClick={addStage} className="text-sm font-semibold text-spike hover:underline">
          + Add stage
        </button>
      ) : null}
    </div>
  );
}
