import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { saveMentorCoachingNote } from '../../lib/coachingService.js';
import { getDay1MissionProgress, getAllDay1BuilderData } from '../../lib/day1BuilderService.js';
import { getParticipantCharterPreview } from '../../lib/squadCharterService.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{
 *   interns: Array<{ id: string, name: string }>,
 *   mentorId?: string,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
export function MentorDay1Panel({ interns, mentorId, showToast }) {
  const ids = interns.map((i) => i.id);
  const { ready, version } = useCohortHydration(ids);
  void version;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Day 1 builder previews</h3>
        <Link to={ROUTES.playbook} className="text-sm font-semibold text-spike hover:underline">
          Open Playbook →
        </Link>
      </div>
      {!ready ? (
        <p className="text-sm text-slate-500">Loading participant work from the server…</p>
      ) : null}
      {interns.map((intern) => (
        <MentorInternDay1Card
          key={intern.id}
          intern={intern}
          mentorId={mentorId}
          showToast={showToast}
        />
      ))}
    </div>
  );
}

/**
 * @param {{
 *   intern: { id: string, name: string },
 *   mentorId?: string,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
function MentorInternDay1Card({ intern, mentorId, showToast }) {
  const progress = getDay1MissionProgress(intern.id);
  const data = getAllDay1BuilderData(intern.id);
  const purpose = data['impact-builder']?.data ?? data['purpose-builder']?.data ?? data['discover-why']?.data;
  const ambition = data['ambition-builder']?.data;
  const values = data['values-builder']?.data;
  const charter = getParticipantCharterPreview(intern.id);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveComment() {
    if (!comment.trim() || !mentorId) return;
    setSaving(true);
    try {
      await saveMentorCoachingNote(mentorId, intern.id, comment.trim(), {
        topic: 'Day 1 builder coaching note',
      });
      setSaved(true);
      setComment('');
      showToast?.(`Coaching note saved for ${intern.name}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="spike-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900">{intern.name}</h4>
          <Link
            to={`${ROUTES.mentorVentureCoach}/${intern.id}`}
            className="text-xs font-semibold text-spike hover:underline"
          >
            Venture Coach review →
          </Link>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
          Day 1: {progress.percent}%
        </span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="spike-label">My Ambition</p>
          <p className="mt-1 line-clamp-3 text-sm text-slate-700">
            {ambition?.ambitionStatement ? String(ambition.ambitionStatement) : 'Not started'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="spike-label">My Impact</p>
          <p className="mt-1 line-clamp-3 text-sm text-slate-700">
            {purpose?.purposeStatement
              ? String(purpose.purposeStatement)
              : purpose?.joinReason
                ? String(purpose.joinReason)
                : 'Not started'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="spike-label">My Values</p>
          <p className="mt-1 line-clamp-3 text-sm text-slate-700">
            {values?.valuesProfile ? String(values.valuesProfile) : 'Not started'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="spike-label">Dream board</p>
          <p className="mt-1 text-sm text-slate-700">
            {data['dream-board']?.completedAt
              ? `${(data['dream-board']?.data?.assets ?? []).length} dream cards`
              : 'Not started'}
          </p>
        </div>
      </div>

      {charter ? (
        <p className="mb-3 text-xs text-slate-600">
          Squad: <strong>{charter.squadName}</strong> · Motto: {charter.teamMotto}
        </p>
      ) : null}

      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
          <MessageSquare size={14} /> Leave a comment
        </span>
        <textarea
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={comment}
          placeholder="Coaching note on Day 1 builders…"
          onChange={(e) => {
            setComment(e.target.value);
            setSaved(false);
          }}
        />
      </label>
      <button
        type="button"
        disabled={!comment.trim() || !mentorId || saving}
        onClick={() => void handleSaveComment()}
        className="mt-2 spike-btn-secondary text-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Comment saved' : 'Post comment'}
      </button>
    </article>
  );
}
