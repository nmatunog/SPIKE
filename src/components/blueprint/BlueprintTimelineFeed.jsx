import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import {
  hydrateTimelineFromSupabase,
  listTimelineEvents,
} from '../../lib/timelineService.js';

const TYPE_LABELS = {
  blueprint_update: 'Blueprint',
  fna_save: 'FNA',
  coaching_note: 'Coaching',
  survey_submit: 'Survey',
  playbook_complete: 'Playbook',
  board_submit: 'Venture Board',
};

/**
 * @param {{ participantId?: string, limit?: number, compact?: boolean }} props
 */
export function BlueprintTimelineFeed({ participantId, limit = 8, compact = false }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!participantId) return;
    let active = true;
    hydrateTimelineFromSupabase(participantId).then(() => {
      if (!active) return;
      setEvents(listTimelineEvents(participantId, limit));
    });
    return () => {
      active = false;
    };
  }, [participantId, limit]);

  if (!participantId || events.length === 0) {
    return compact ? null : (
      <p className="text-sm text-gray-500">Activity will appear here as you complete Playbook work, surveys, and FNAs.</p>
    );
  }

  return (
    <ul className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      {events.map((evt) => (
        <li
          key={evt.id}
          className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2"
        >
          <Activity size={14} className="mt-0.5 shrink-0 text-[#8B0000]" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{evt.title}</p>
            <p className="text-gray-500">
              {TYPE_LABELS[evt.type] ?? evt.type}
              {evt.at ? ` · ${evt.at.slice(0, 10)}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
