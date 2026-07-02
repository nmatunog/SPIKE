import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getRaSpikeCanvasWizardConfig,
  getWizardStepFields,
  isCanvasWizardComplete,
  readWizardField,
  writeWizardField,
} from '../../../lib/raSpikeCanvasWizard.js';

/**
 * @param {{
 *   participantId: string,
 *   onComplete?: () => void,
 * }} props
 */
export function CanvasWizardEngine({ participantId, onComplete }) {
  const config = getRaSpikeCanvasWizardConfig();
  const steps = config?.steps ?? [];
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  const step = steps[index];
  const fields = step ? getWizardStepFields(step.id) : [];

  if (!step) {
    return <p className="text-sm text-slate-600">Canvas wizard configuration not found.</p>;
  }

  function refresh() {
    setTick((t) => t + 1);
  }

  function fieldValue(pillar, key) {
    void tick;
    return readWizardField(participantId, pillar, key);
  }

  const allFilled = fields.every((f) => fieldValue(f.pillar, f.key).trim().length >= (f.minChars ?? 10));
  const wizardDone = isCanvasWizardComplete(participantId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`h-2 flex-1 rounded-full ${i <= index ? 'bg-spike' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      <header>
        <p className="text-sm font-semibold text-spike">
          Step {index + 1} of {steps.length}
        </p>
        <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{step.description}</p>
      </header>

      <div className="space-y-4">
        {fields.map((field) => (
          <label key={`${field.pillar}-${field.key}`} className="block text-sm">
            <span className="mb-1 block font-medium text-slate-800">{field.label}</span>
            {field.hint ? <span className="mb-2 block text-xs text-slate-500">{field.hint}</span> : null}
            <textarea
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={fieldValue(field.pillar, field.key)}
              onChange={(e) => {
                writeWizardField(participantId, field.pillar, field.key, e.target.value);
                refresh();
              }}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="spike-btn-secondary inline-flex min-h-[44px] items-center justify-center gap-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {index < steps.length - 1 ? (
          <button
            type="button"
            disabled={!allFilled}
            onClick={() => setIndex((i) => i + 1)}
            className="spike-btn-primary inline-flex min-h-[44px] items-center justify-center gap-1"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            disabled={!allFilled && !wizardDone}
            onClick={() => onComplete?.()}
            className="spike-btn-primary min-h-[44px]"
          >
            {wizardDone ? 'Finish wizard' : 'Complete all fields to finish'}
          </button>
        )}
      </div>
    </div>
  );
}
