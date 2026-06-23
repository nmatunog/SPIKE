import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { acknowledgeSquadAlignment, getWeek2State } from '../../lib/customerDiscovery/week2DiscoveryService.js';
import { week2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';
import { Link } from 'react-router-dom';

/**
 * @param {{ participantId: string, onComplete?: () => void, missionContext?: 'blueprint' | 'playbook' }} props
 */
export function SquadAlignmentTask({ participantId, onComplete, missionContext = 'playbook' }) {
  const [done, setDone] = useState(() => Boolean(getWeek2State(participantId).squadAlignedAt));

  function handleConfirm() {
    acknowledgeSquadAlignment(participantId);
    setDone(true);
    onComplete?.();
  }

  if (done) {
    return (
      <div className="spike-surface space-y-4">
        <p className="spike-label text-venture-discover">Squad aligned ✓</p>
        <p className="text-sm text-slate-600">
          Day 1 prep is complete. Tuesday — head to the field for Discover mode interviews.
        </p>
        <Link to={week2MissionHref('interview-1', missionContext, 2)} className="spike-btn-primary inline-flex">
          Start field research <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="spike-surface space-y-4">
      <p className="spike-label">Squad alignment</p>
      <h2 className="text-xl font-bold text-slate-900">Confirm your squad is ready</h2>
      <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
        <li>Everyone has read the mission brief</li>
        <li>Assumptions and interview questions are shared</li>
        <li>Field research plan is agreed</li>
        <li>Roles assigned for Tuesday interviews</li>
      </ul>
      <button type="button" onClick={handleConfirm} className="spike-btn-primary">
        Squad is aligned — continue
      </button>
    </div>
  );
}
