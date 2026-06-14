import { useState } from 'react';
import {
  MENTOR_RECOMMENDATIONS,
  WEEK1_ASSESSMENT_CATEGORIES,
} from '../../lib/mentorWeek1Constants.js';
import { averageAssessmentScore, getWeeklyAssessment, saveWeeklyAssessment } from '../../lib/weeklyAssessmentService.js';

/**
 * @param {{
 *   mentorId: string,
 *   participantId: string,
 *   onSaved?: () => void,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
export function MentorWeeklyAssessmentPanel({ mentorId, participantId, onSaved, showToast }) {
  const existing = getWeeklyAssessment(participantId, 1);
  const [scores, setScores] = useState(
    () => /** @type {Record<string, number>} */ (existing?.scores ?? {}),
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [recommendation, setRecommendation] = useState(existing?.recommendation ?? 'continue_normally');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const hasScore = WEEK1_ASSESSMENT_CATEGORIES.some((cat) => (scores[cat.id] ?? 0) > 0);
    if (!hasScore) {
      showToast?.('Score at least one category before saving.', 'info');
      return;
    }
    setSaving(true);
    try {
      await saveWeeklyAssessment(mentorId, participantId, { week: 1, scores, notes, recommendation });
      showToast?.('Week 1 assessment saved.');
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="spike-card space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Week 1 snapshot</h3>
        <p className="mt-1 text-xs text-slate-500">
          Optional end-of-week view. Daily check-ins above are enough for most mentors.
        </p>
      </div>

      <div className="space-y-3">
        {WEEK1_ASSESSMENT_CATEGORIES.map((cat) => (
          <div key={cat.id} className="rounded-xl bg-slate-50 px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{cat.label}</p>
            <p className="text-xs text-slate-500">{cat.question}</p>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setScores((prev) => ({ ...prev, [cat.id]: score }))}
                  className={`h-9 w-9 rounded-lg text-sm font-bold ${
                    scores[cat.id] === score ? 'bg-spike text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-600">
        Average score: <strong>{averageAssessmentScore(scores) || '—'}</strong>
      </p>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Observation notes</span>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Mentor recommendation</span>
        <select
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
        >
          {MENTOR_RECOMMENDATIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <button type="button" disabled={saving} onClick={() => void handleSave()} className="spike-btn-primary disabled:opacity-50">
        Save assessment
      </button>
    </div>
  );
}
