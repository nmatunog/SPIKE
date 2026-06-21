import { MessageSquareText } from 'lucide-react';
import { listSquadInternNotes } from '../../lib/staff/squadInternNotesService.js';

/**
 * Per-intern qualitative notes — migrated from legacy assessments and coaching.
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   week?: number,
 *   compact?: boolean,
 * }} props
 */
export function SquadInternNotesPanel({
  participantId,
  participantName = 'Participant',
  week,
  compact = false,
}) {
  const notes = listSquadInternNotes(participantId, week);

  if (!notes.length) {
    if (compact) return null;
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
        No saved notes yet for {participantName}. Legacy assessment comments migrate automatically on
        first staff login.
      </section>
    );
  }

  return (
    <section className={compact ? 'space-y-2' : 'spike-surface space-y-3'}>
      {!compact ? (
        <div>
          <p className="spike-label flex items-center gap-1.5">
            <MessageSquareText size={14} aria-hidden />
            Notes for {participantName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Carried from coaching sessions, observations, and migrated assessments — not individual scores.
          </p>
        </div>
      ) : null}
      <ul className="space-y-2">
        {notes.slice(0, compact ? 3 : 8).map((note) => (
          <li key={note.id} className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Week {note.week} · {note.source}
              {note.migratedFrom ? ' · migrated' : ''}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{note.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** @param {Array<{ id: string, name: string }>} members @param {number} [week] */
export function SquadMemberNotesAppendix({ members, week }) {
  const withNotes = members.filter((m) => listSquadInternNotes(m.id, week).length > 0);
  if (!withNotes.length) return null;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Individual notes (carried over)
      </p>
      {withNotes.map((member) => (
        <SquadInternNotesPanel
          key={member.id}
          participantId={member.id}
          participantName={member.name}
          week={week}
          compact
        />
      ))}
    </div>
  );
}
