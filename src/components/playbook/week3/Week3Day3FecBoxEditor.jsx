import { useEffect, useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { approveFecStep, getFecStepPayload } from '../../../lib/customerDiscovery/week2FecValidationService.js';
import { FEC_VALIDATION_STEPS } from '../../../lib/customerDiscovery/week2FecValidationConstants.js';
import {
  getWeek3Day3FecBoxDisplayText,
  week3Day3FecBoxIdForStep,
} from '../../../lib/week3Day3FecBoxContent.js';
import { ViewMyFecCanvasLink } from '../../ventureDesign/ViewMyFecCanvasLink.jsx';

/**
 * Week 3 Day 3 — focused FEC Box 4/5 editor (no studio redirect).
 * @param {{
 *   participantId: string,
 *   stepSlug: 'fec-step-4' | 'fec-step-5',
 *   onSaved?: () => void,
 * }} props
 */
export function Week3Day3FecBoxEditor({ participantId, stepSlug, onSaved }) {
  const normalizedStep = stepSlug === 'fec-step-5' ? 'fec-step-5' : 'fec-step-4';
  const stepDef = FEC_VALIDATION_STEPS.find((step) => step.slug === normalizedStep)
    ?? FEC_VALIDATION_STEPS[3];
  const boxId = week3Day3FecBoxIdForStep(normalizedStep);

  const initialText = useMemo(() => {
    const saved = getWeek3Day3FecBoxDisplayText(participantId, boxId);
    if (saved) return saved;
    const payload = getFecStepPayload(participantId, normalizedStep);
    if (normalizedStep === 'fec-step-4') {
      return String(payload.experienceStatement ?? '').trim();
    }
    return String(payload.strategicStatement ?? '').trim();
  }, [participantId, normalizedStep, boxId]);

  const [draft, setDraft] = useState(initialText);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(initialText);
  }, [initialText, normalizedStep]);

  function saveBox() {
    const text = String(draft ?? '').trim();
    if (!text) return;
    approveFecStep(participantId, normalizedStep, { approvedStatement: text, afterText: text });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
    onSaved?.();
  }

  return (
    <div className="space-y-5 rounded-2xl border border-spike/20 bg-white p-5 shadow-sm sm:p-6">
      <header className="space-y-1">
        <p className="spike-label">Week 3 Day 3 · Improve FEC</p>
        <h2 className="text-xl font-bold text-slate-900">{stepDef.title}</h2>
        <p className="text-sm text-slate-600">{stepDef.subtitle}</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-spike">{stepDef.fecBoxLabel}</p>
      </header>

      <p className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        <Sparkles size={16} className="mt-0.5 shrink-0" aria-hidden />
        Use what you learned in FNA role play — experience, understanding, and trust — to upgrade this box.
      </p>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-900">{stepDef.fecBoxLabel}</span>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={8}
          placeholder={
            normalizedStep === 'fec-step-4'
              ? 'Describe the client journey: before, during, and after engagement…'
              : 'Why will clients choose your practice over another advisor?…'
          }
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveBox}
          disabled={String(draft ?? '').trim().length < 10}
          className="spike-btn-primary inline-flex min-h-[44px] items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved ? <Check size={16} aria-hidden /> : null}
          {saved ? 'FEC updated' : 'Save to FEC & portfolio'}
        </button>
        <ViewMyFecCanvasLink
          exit="/playbook?segment=1&week=3&day=3"
          compact
          label="Open full FEC canvas"
        />
      </div>
    </div>
  );
}
