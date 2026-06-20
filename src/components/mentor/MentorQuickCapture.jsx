import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useMentorDayTemplates } from '../../hooks/useMentorDayTemplates.js';
import {
  getMentorEncoding,
  hydrateMentorEncodingFromSupabase,
  saveMentorEncoding,
} from '../../lib/mentorEncodingService.js';
import {
  getParticipantPulseRating,
  saveParticipantPulseRating,
  SIMPLIFIED_PULSE_HINTS,
} from '../../lib/staff/squadRatingService.js';
import { WEEK1_DAY_META } from '../../lib/mentorWeek1Constants.js';

/**
 * Per-participant daily observation — simplified pulse score.
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
  week = 1,
  showToast,
  onSaved,
}) {
  const [pulseScore, setPulseScore] = useState(0);
  const [standoutNote, setStandoutNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = getParticipantPulseRating(mentorId, participantId, week, day);
    if (existing) {
      setPulseScore(existing.overallScore ?? 0);
      setStandoutNote(existing.standoutNote ?? '');
      setShowNote(Boolean(existing.standoutNote));
      setSaved(true);
    }
  }, [mentorId, participantId, week, day]);

  async function handleSave() {
    if (!pulseScore) {
      showToast?.('Tap a score 1–5 for today.', 'info');
      return;
    }
    setSaving(true);
    try {
      saveParticipantPulseRating(mentorId, participantId, week, day, {
        pulseScore,
        standoutNote: showNote ? standoutNote : undefined,
      });
      if (template?.id) {
        await saveMentorEncoding(mentorId, participantId, {
          day,
          week,
          formType: 'observation',
          templateId: String(template.id),
          answers: { pulse_score: pulseScore, coaching_note: showNote ? standoutNote : '' },
        });
      }
      setSaved(true);
      showToast?.(`Saved · +${pulseScore >= 4 ? 15 : 10} Coach XP`);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        One tap for {participantName ?? 'them'} today — about 15 seconds.
      </p>

      <div className="rounded-xl bg-slate-50 px-3 py-3">
        <p className="text-sm font-medium text-slate-900">Today&apos;s pulse</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              title={SIMPLIFIED_PULSE_HINTS[score - 1]}
              onClick={() => {
                setPulseScore(score);
                setSaved(false);
              }}
              className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-bold transition ${
                pulseScore === score
                  ? 'bg-spike text-white shadow-sm'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-spike/40'
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        {pulseScore > 0 ? (
          <p className="mt-1 text-xs text-slate-500">{SIMPLIFIED_PULSE_HINTS[pulseScore - 1]}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setShowNote((v) => !v)}
        className="text-xs font-semibold text-spike"
      >
        {showNote ? 'Hide' : 'Add'} standout note (optional)
      </button>

      {showNote ? (
        <textarea
          rows={2}
          className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm"
          value={standoutNote}
          onChange={(e) => {
            setStandoutNote(e.target.value);
            setSaved(false);
          }}
          placeholder="Extraordinary moment only"
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="spike-btn-primary inline-flex gap-2 disabled:opacity-50"
        >
          <Zap size={16} />
          {saving ? 'Saving…' : saved ? 'Update pulse' : 'Save pulse'}
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
  const { observation, loading } = useMentorDayTemplates(day);

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
        template={loading ? null : observation}
        day={day}
        week={1}
        showToast={showToast}
        onSaved={onSaved}
      />
    </div>
  );
}
