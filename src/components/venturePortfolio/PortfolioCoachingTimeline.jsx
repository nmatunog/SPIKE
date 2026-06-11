import { useEffect, useState } from 'react';
import { listCoachingNotesForParticipant } from '../../lib/coachingService.js';
import { listTimelineEvents, hydrateTimelineFromSupabase } from '../../lib/timelineService.js';

/**
 * @param {{ participantId: string }} props
 */
export function PortfolioCoachingTimeline({ participantId }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await hydrateTimelineFromSupabase(participantId);
      if (cancelled) return;
      const coaching = listCoachingNotesForParticipant(participantId).map((note) => ({
        id: note.id,
        title: note.topic ?? 'Coaching session',
        body: note.discussionSummary ?? note.notes,
        createdAt: note.createdAt,
        kind: 'coaching',
      }));
      const timeline = listTimelineEvents(participantId, 12)
        .filter((evt) => evt.type === 'coaching_note' || evt.module === 'leadership-growth')
        .map((evt) => ({
          id: evt.id,
          title: evt.title,
          body: '',
          createdAt: evt.createdAt,
          kind: 'timeline',
        }));
      const merged = [...coaching, ...timeline]
        .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
        .slice(0, 8);
      setEvents(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  if (!events.length) {
    return (
      <p className="text-sm text-slate-500">Coaching conversations with your mentor will appear here.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {events.map((evt) => (
        <li key={evt.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <p className="text-xs font-semibold text-slate-500">
            {evt.title} · {new Date(String(evt.createdAt)).toLocaleDateString()}
          </p>
          {evt.body ? <p className="mt-1 whitespace-pre-wrap text-slate-700">{evt.body}</p> : null}
        </li>
      ))}
    </ul>
  );
}
