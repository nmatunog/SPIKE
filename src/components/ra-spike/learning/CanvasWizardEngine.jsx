import { useState } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import {
  getRaSpikeFecWizardConfig,
  isFecContinueWizardComplete,
  isFecIntroWizardComplete,
  readWizardField,
  resolveWizardStepFields,
  writeWizardField,
} from '../../../lib/raSpikeCanvasWizard.js';

/**
 * Guided FEC wizard — one building block per step (Week 2 intro or Week 3 continue).
 *
 * @param {{
 *   participantId: string,
 *   mode: 'intro' | 'continue',
 *   onComplete?: () => void,
 * }} props
 */
export function CanvasWizardEngine({ participantId, mode, onComplete }) {
  const config = getRaSpikeFecWizardConfig(mode);
  const steps = config?.steps ?? [];
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  const step = steps[index];
  const fields = resolveWizardStepFields(step);

  if (!step || !config) {
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
  const wizardDone = mode === 'intro'
    ? isFecIntroWizardComplete(participantId)
    : isFecContinueWizardComplete(participantId);

  const lockedFields = config.lockedFieldKeys ?? [];
  const lockedLabels = config.lockedSections ?? [];

  return (
    <div className="space-y-5">
      {mode === 'intro' && lockedLabels.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Lock size={14} aria-hidden />
            {config.lockedHeading ?? 'Locked until Week 3'}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {lockedLabels.join(' · ')}
          </p>
        </div>
      ) : null}

      {mode === 'continue' && lockedFields.length ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
            {config.lockedHeading ?? 'Completed in Week 2'}
          </p>
          <dl className="mt-2 space-y-2 text-sm">
            {lockedFields.map((item) => (
              <div key={`${item.pillar}-${item.key}`}>
                <dt className="font-semibold text-slate-800">{item.label}</dt>
                <dd className="mt-0.5 text-slate-600">
                  {fieldValue(item.pillar, item.key).trim() || '—'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

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
          Block {index + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">{step.question ?? step.title}</h2>
        {step.title && step.question ? (
          <p className="mt-1 text-sm font-medium text-slate-700">{step.title}</p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
      </header>

      <div className="space-y-4">
        {fields.map((field) => (
          <label key={`${field.pillar}-${field.key}`} className="block text-sm">
            <span className="mb-1 block font-medium text-slate-800">{field.label}</span>
            {field.hint ? <span className="mb-2 block text-xs text-slate-500">{field.hint}</span> : null}
            <textarea
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
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
            Next block <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            disabled={!allFilled && !wizardDone}
            onClick={() => onComplete?.()}
            className="spike-btn-primary min-h-[44px]"
          >
            {wizardDone ? 'Finish wizard' : 'Complete this block to finish'}
          </button>
        )}
      </div>
    </div>
  );
}
