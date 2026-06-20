import { useState } from 'react';
import { Trophy, Zap } from 'lucide-react';
import {
  averageAssessmentScore,
  getWeeklyAssessment,
  saveWeeklyAssessment,
} from '../../lib/weeklyAssessmentService.js';
import { getCoachRatingGamification } from '../../lib/staff/squadRatingService.js';

/**
 * Simplified end-of-week snapshot — one score, optional standout note.
 * @param {{
 *   mentorId: string,
 *   participantId: string,
 *   week?: number,
 *   onSaved?: () => void,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
export function MentorWeeklyAssessmentPanel({
  mentorId,
  participantId,
  week = 1,
  onSaved,
  showToast,
}) {
  const existing = getWeeklyAssessment(participantId, week);
  const gamify = getCoachRatingGamification(mentorId);
  const [overallScore, setOverallScore] = useState(existing?.scores?.overall ?? 0);
  const [standoutNote, setStandoutNote] = useState(existing?.notes ?? '');
  const [showNote, setShowNote] = useState(Boolean(existing?.notes));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!overallScore) {
      showToast?.('Tap an overall score 1–5.', 'info');
      return;
    }
    setSaving(true);
    try {
      await saveWeeklyAssessment(mentorId, participantId, {
        week,
        scores: { overall: overallScore },
        notes: showNote ? standoutNote : '',
        recommendation: overallScore >= 4 ? 'continue_normally' : overallScore <= 2 ? 'needs_coaching' : 'monitor_closely',
      });
      showToast?.(`Week ${week} score saved · +10 Coach XP`);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  const hints = ['Needs support', 'Building', 'On track', 'Strong', 'Standout'];

  return (
    <div className="spike-surface space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Week {week} score</h3>
          <p className="mt-1 text-xs text-slate-500">
            One number — optional note only for standout performance.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-900">
          <Trophy size={12} /> {gamify.level}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            title={hints[score - 1]}
            onClick={() => setOverallScore(score)}
            className={`h-11 w-11 rounded-xl text-sm font-bold ${
              overallScore === score ? 'bg-spike text-white' : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
            }`}
          >
            {score}
          </button>
        ))}
      </div>

      {overallScore > 0 ? (
        <p className="text-sm text-slate-600">
          Average: <strong>{averageAssessmentScore({ overall: overallScore })}/5</strong>
          {' · '}
          {hints[overallScore - 1]}
        </p>
      ) : null}

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
          onChange={(e) => setStandoutNote(e.target.value)}
          placeholder="Extraordinary performance only — one sentence max"
        />
      ) : null}

      <button type="button" disabled={saving} onClick={() => void handleSave()} className="spike-btn-primary inline-flex gap-2 disabled:opacity-50">
        <Zap size={16} />
        {saving ? 'Saving…' : 'Save score'}
      </button>
    </div>
  );
}
