import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getMentorDayTemplates, RATING_HINTS } from '../../lib/mentorEncodingTemplates.js';
import {
  getMentorEncoding,
  hydrateMentorEncodingFromSupabase,
  saveMentorEncoding,
} from '../../lib/mentorEncodingService.js';
import { WEEK1_DAY_META } from '../../lib/mentorWeek1Constants.js';

/**
 * Friendly 1–5 tap row for mentors.
 * @param {{ label: string, value: number, onChange: (n: number) => void }} props
 */
function RatingRow({ label, value, onChange }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            title={RATING_HINTS[score - 1]}
            onClick={() => onChange(score)}
            className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition ${
              value === score
                ? 'bg-spike text-white shadow-sm'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-spike/40'
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      {value > 0 ? (
        <p className="mt-1 text-xs text-slate-500">{RATING_HINTS[value - 1]}</p>
      ) : null}
    </div>
  );
}

/**
 * Per-participant daily observation — simple tap-and-save.
 * @param {{
 *   mentorId: string,
 *   participantId: string,
 *   participantName?: string,
 *   template: Record<string, unknown> | null,
 *   day: number,
 *   showToast?: (message: string, type?: string) => void,
 *   onSaved?: () => void,
 * }} props
 */
export function MentorQuickCapture({
  mentorId,
  participantId,
  participantName = 'Participant',
  template,
  day,
  showToast,
  onSaved,
}) {
  const fields = useMemo(
    () => (Array.isArray(template?.fields) ? template.fields : []),
    [template],
  );
  const ratingFields = fields.filter((f) => f.type === 'rating');
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!mentorId || !template?.id) return;
    let cancelled = false;
    (async () => {
      await hydrateMentorEncodingFromSupabase(
        mentorId,
        participantId,
        1,
        day,
        'observation',
      );
      if (cancelled) return;
      const existing = getMentorEncoding(mentorId, participantId, 1, day, 'observation');
      if (existing?.answers) {
        setAnswers(existing.answers);
        setSaved(true);
      } else {
        setAnswers({});
        setSaved(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mentorId, participantId, day, template?.id]);

  if (!template) {
    return (
      <p className="text-sm text-slate-500">No check-in form for this day yet.</p>
    );
  }

  const checkboxFields = fields.filter((f) => f.type === 'checkbox');
  const textFields = fields.filter((f) => f.type === 'short_text' || f.type === 'long_text');
  const hasRating = ratingFields.some((f) => (answers[f.id] ?? 0) > 0);

  async function handleSave() {
    if (!hasRating && !answers.coaching_note && !answers.notes) {
      showToast?.('Tap at least one rating, or add a short note.', 'info');
      return;
    }
    setSaving(true);
    try {
      await saveMentorEncoding(mentorId, participantId, {
        day,
        formType: 'observation',
        templateId: String(template.id),
        answers,
      });
      setSaved(true);
      showToast?.(`Saved check-in for ${participantName}.`);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {Array.isArray(template.observationAreas) && template.observationAreas.length > 0 ? (
        <p className="text-xs text-slate-500">
          Watch for: {template.observationAreas.join(' · ')}
        </p>
      ) : null}

      <div className="space-y-3">
        {ratingFields.map((field) => (
          <RatingRow
            key={String(field.id)}
            label={String(field.label)}
            value={Number(answers[field.id] ?? 0)}
            onChange={(n) => {
              setAnswers((prev) => ({ ...prev, [field.id]: n }));
              setSaved(false);
            }}
          />
        ))}
      </div>

      {checkboxFields.map((field) => (
        <label
          key={String(field.id)}
          className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
        >
          <input
            type="checkbox"
            checked={Boolean(answers[field.id])}
            onChange={(e) => {
              setAnswers((prev) => ({ ...prev, [field.id]: e.target.checked }));
              setSaved(false);
            }}
            className="h-4 w-4 accent-spike"
          />
          <span className="text-sm text-slate-800">{String(field.label)}</span>
        </label>
      ))}

      {textFields.map((field) => (
        <label key={String(field.id)} className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">
            {field.id === 'coaching_note' || field.id === 'notes'
              ? 'Quick note (optional)'
              : String(field.label)}
          </span>
          <textarea
            rows={field.type === 'long_text' ? 3 : 2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={String(answers[field.id] ?? '')}
            onChange={(e) => {
              setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }));
              setSaved(false);
            }}
            placeholder="A sentence is enough — you can expand in coaching notes later."
          />
        </label>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="spike-btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Update check-in' : 'Save check-in'}
        </button>
        {saved ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
            <Check size={16} /> Saved for Day {day}
          </span>
        ) : null}
      </div>
    </div>
  );
}

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

/**
 * Day picker + observation capture for a participant.
 * @param {{
 *   mentorId: string,
 *   participantId: string,
 *   participantName?: string,
 *   showToast?: (message: string, type?: string) => void,
 *   onSaved?: () => void,
 * }} props
 */
export function MentorParticipantEncodingPanel({
  mentorId,
  participantId,
  participantName,
  showToast,
  onSaved,
}) {
  const [day, setDay] = useState(1);
  const { observation } = useMemo(() => getMentorDayTemplates(day), [day]);

  return (
    <div className="spike-card space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Quick check-in</h3>
        <p className="mt-1 text-sm text-slate-600">
          Tap how {participantName ?? 'they'}&apos;re doing today — about 2 minutes. Not a test, not
          shared as a grade.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {WEEK1_DAY_META.map((meta) => (
          <button
            key={meta.day}
            type="button"
            onClick={() => setDay(meta.day)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              day === meta.day
                ? 'bg-spike text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Day {meta.day} · {meta.theme}
          </button>
        ))}
      </div>

      <MentorQuickCapture
        mentorId={mentorId}
        participantId={participantId}
        participantName={participantName}
        template={observation}
        day={day}
        showToast={showToast}
        onSaved={onSaved}
      />
    </div>
  );
}
