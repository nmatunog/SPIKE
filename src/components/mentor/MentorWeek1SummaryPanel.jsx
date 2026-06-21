import { buildWeek1CoachingSummary } from '../../lib/mentorFrameworkService.js';
import { MENTOR_REVIEW_DIMENSIONS } from '../../lib/staff/squadXpConstants.js';
import { SquadInternNotesPanel } from '../staff/SquadInternNotesPanel.jsx';

/**
 * @param {{
 *   participantId: string,
 *   participantName: string,
 *   squad?: string,
 *   memberIds?: string[],
 *   week?: number,
 * }} props
 */
export function MentorWeek1SummaryPanel({
  participantId,
  participantName,
  squad,
  memberIds = [],
  week = 1,
}) {
  const summary = buildWeek1CoachingSummary(participantId, participantName, {
    squad,
    memberIds,
    week,
  });
  const dimensionScores = summary.squadDimensionScores ?? {};

  return (
    <div className="spike-card space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Week {week} coaching summary</h3>
        <p className="mt-1 text-xs text-slate-500">
          Generated from squad review, coaching notes, and carried-over mentor comments.
        </p>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold text-slate-500">Participant</dt>
          <dd className="font-semibold text-slate-900">{summary.participantName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">Squad</dt>
          <dd>{summary.squad}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-slate-500">Career direction</dt>
          <dd>{summary.careerDirection}</dd>
        </div>
      </dl>

      {summary.squadXp > 0 ? (
        <p className="text-sm text-slate-600">
          Squad XP: <strong className="text-spike">{summary.squadXp}</strong> / 100 (shared)
        </p>
      ) : null}

      <SummaryList title="Strengths (top 3)" items={summary.strengths} />
      <SummaryList title="Growth areas (top 3)" items={summary.growthAreas} />
      <SummaryList title="Recommended actions" items={summary.recommendedActions} />

      <div className="rounded-xl bg-spike-muted px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-spike">Mentor recommendation</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{summary.mentorRecommendation}</p>
      </div>

      {Object.keys(dimensionScores).length ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Squad review dimensions</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {MENTOR_REVIEW_DIMENSIONS.map((dim) => (
              <li key={dim.id} className="text-sm text-slate-700">
                {dim.label}: <strong>{dimensionScores[dim.id] ?? '—'}</strong>/5
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <SquadInternNotesPanel
        participantId={participantId}
        participantName={participantName}
        week={week}
        compact
      />
    </div>
  );
}

/** @param {{ title: string, items: string[] }} props */
function SummaryList({ title, items }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
