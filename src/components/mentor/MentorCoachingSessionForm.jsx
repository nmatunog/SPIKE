import { useState } from 'react';
import { markCoachingSessionComplete, saveCoachingSession } from '../../lib/coachingService.js';
import { WEEK1_DAY_META } from '../../lib/mentorWeek1Constants.js';

/**
 * @param {{
 *   mentorId: string,
 *   participantId: string,
 *   onSaved?: () => void,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
export function MentorCoachingSessionForm({ mentorId, participantId, onSaved, showToast }) {
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(1);
  const [discussionSummary, setDiscussionSummary] = useState('');
  const [strengths, setStrengths] = useState('');
  const [growthAreas, setGrowthAreas] = useState('');
  const [actionItemsText, setActionItemsText] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);

  const dayMeta = WEEK1_DAY_META.find((d) => d.day === day);

  async function handleSave(markComplete = false) {
    if (!discussionSummary.trim()) {
      showToast?.('Add a discussion summary before saving.', 'info');
      return;
    }
    setSaving(true);
    try {
      await saveCoachingSession(mentorId, participantId, {
        week,
        day,
        discussionSummary,
        strengths,
        growthAreas,
        actionItems: actionItemsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        followUpRequired,
        followUpDate: followUpRequired ? followUpDate : undefined,
        completed: markComplete,
        topic: `Week ${week} Day ${day} — ${dayMeta?.theme ?? 'Coaching'}`,
      });
      setDiscussionSummary('');
      setStrengths('');
      setGrowthAreas('');
      setActionItemsText('');
      showToast?.(markComplete ? 'Coaching session marked complete.' : 'Coaching notes saved.');
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="spike-card space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Session notes</h3>
        <p className="mt-1 text-xs text-slate-500">
          Optional detail after your quick check-in — what you discussed and agreed to try next.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Week</span>
          <input
            type="number"
            min={1}
            max={15}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Day</span>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          >
            {WEEK1_DAY_META.map((d) => (
              <option key={d.day} value={d.day}>
                Day {d.day} — {d.theme}
              </option>
            ))}
          </select>
        </label>
      </div>

      {dayMeta ? (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-950">
          <strong>{dayMeta.theme}:</strong> {dayMeta.objective} Expected output: {dayMeta.expectedOutput}
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Discussion summary</span>
        <textarea
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          value={discussionSummary}
          onChange={(e) => setDiscussionSummary(e.target.value)}
          placeholder="What did you discuss today?"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Strengths observed</span>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Growth areas</span>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            value={growthAreas}
            onChange={(e) => setGrowthAreas(e.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Action items (one per line)</span>
        <textarea
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          value={actionItemsText}
          onChange={(e) => setActionItemsText(e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={followUpRequired}
          onChange={(e) => setFollowUpRequired(e.target.checked)}
        />
        Schedule follow-up
      </label>
      {followUpRequired ? (
        <input
          type="date"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={saving} onClick={() => void handleSave(false)} className="spike-btn-primary disabled:opacity-50">
          Save notes
        </button>
        <button type="button" disabled={saving} onClick={() => void handleSave(true)} className="spike-btn-secondary disabled:opacity-50">
          Mark complete
        </button>
      </div>
    </div>
  );
}

/**
 * @param {{ history: Array<Record<string, unknown>>, participantId: string, onUpdated?: () => void }} props
 */
export function MentorCoachingHistory({ history, participantId, onUpdated }) {
  if (!history.length) {
    return <p className="text-sm text-slate-500">No coaching sessions logged yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {history.slice(0, 10).map((entry) => (
        <li key={String(entry.id)} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-slate-500">
              W{entry.week ?? 1} D{entry.day ?? 1} · {entry.topic ?? 'Coaching'} ·{' '}
              {new Date(String(entry.createdAt)).toLocaleDateString()}
            </p>
            {!entry.completed ? (
              <button
                type="button"
                className="text-xs font-semibold text-spike hover:underline"
                onClick={() => {
                  markCoachingSessionComplete(String(entry.id), participantId);
                  onUpdated?.();
                }}
              >
                Mark complete
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-700">Complete ✓</span>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-slate-700">{String(entry.discussionSummary ?? entry.notes)}</p>
          {entry.strengths ? <p className="mt-1 text-xs text-emerald-800"><strong>Strengths:</strong> {String(entry.strengths)}</p> : null}
          {entry.growthAreas ? <p className="mt-1 text-xs text-amber-800"><strong>Growth:</strong> {String(entry.growthAreas)}</p> : null}
          {entry.followUpDate ? <p className="mt-1 text-xs text-sky-800">Follow-up: {String(entry.followUpDate)}</p> : null}
        </li>
      ))}
    </ul>
  );
}
