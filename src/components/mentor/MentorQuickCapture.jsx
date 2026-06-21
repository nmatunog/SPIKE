import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getMentorEncoding,
  hydrateMentorEncodingFromSupabase,
  saveMentorEncoding,
} from '../../lib/mentorEncodingService.js';
import { WEEK1_DAY_META } from '../../lib/mentorWeek1Constants.js';

/**
 * Cohort-level day debrief — one question at a time.
 * @param {{
 *   mentorId: string,
 *   template: Record<string, unknown> | null,
 *   day: number,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
export function MentorDayDebriefCapture({ mentorId, template, day, showToast }) {
  const prompts = useMemo(
    () => (Array.isArray(template?.prompts) ? template.prompts.map(String) : []),
    [template],
  );
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!mentorId || !template?.id) return;
    let cancelled = false;
    (async () => {
      await hydrateMentorEncodingFromSupabase(mentorId, null, 1, day, 'debrief');
      if (cancelled) return;
      const existing = getMentorEncoding(mentorId, null, 1, day, 'debrief');
      if (existing?.answers) {
        setAnswers(existing.answers);
        setSaved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mentorId, day, template?.id]);

  if (!template || !prompts.length) return null;

  const currentPrompt = prompts[step] ?? '';
  const promptKey = `p${step}`;
  const dayMeta = WEEK1_DAY_META.find((d) => d.day === day);

  async function handleSave() {
    const filled = prompts.some((_, i) => String(answers[`p${i}`] ?? '').trim().length > 0);
    if (!filled) {
      showToast?.('Answer at least one reflection question.', 'info');
      return;
    }
    setSaving(true);
    try {
      await saveMentorEncoding(mentorId, null, {
        day,
        formType: 'debrief',
        templateId: String(template.id),
        answers,
      });
      setSaved(true);
      showToast?.(`Day ${day} debrief saved.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="spike-card space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-sky-800">
          Day {day} · {dayMeta?.theme ?? 'Debrief'}
        </p>
        <h3 className="mt-1 text-base font-semibold text-slate-900">End-of-day reflection</h3>
        <p className="mt-1 text-sm text-slate-600">
          A few minutes for you — not graded, not shared with participants. One question at a time.
        </p>
      </div>

      <p className="text-xs font-medium text-slate-500">
        Question {step + 1} of {prompts.length}
      </p>

      <label className="block">
        <span className="text-sm font-medium text-slate-900">{currentPrompt}</span>
        <textarea
          rows={4}
          autoFocus
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={String(answers[promptKey] ?? '')}
          onChange={(e) => {
            setAnswers((prev) => ({ ...prev, [promptKey]: e.target.value }));
            setSaved(false);
          }}
          placeholder="Short answer is fine."
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {step < prompts.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="spike-btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? 'Update debrief' : 'Save debrief'}
          </button>
        )}
      </div>

      {saved ? (
        <p className="inline-flex items-center gap-1 text-sm text-emerald-700">
          <Check size={16} /> Debrief saved for Day {day}
        </p>
      ) : null}
    </div>
  );
}
