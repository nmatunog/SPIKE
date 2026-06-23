import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { acknowledgeSquadAlignment, getWeek2State } from '../../lib/customerDiscovery/week2DiscoveryService.js';
import { week2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';
import { Link } from 'react-router-dom';

/**
 * @param {{ participantId: string, onComplete?: () => void, missionContext?: 'blueprint' | 'playbook' }} props
 */
export function SquadAlignmentTask({ participantId, onComplete, missionContext = 'playbook' }) {
  const [aligned, setAligned] = useState(() => Boolean(getWeek2State(participantId).squadAlignedAt));

  function handleConfirm() {
    acknowledgeSquadAlignment(participantId);
    setAligned(true);
    onComplete?.();
  }

  return (
    <div className="spike-surface space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="spike-label">Squad alignment</p>
        {aligned ? (
          <span className="rounded-full bg-venture-discover/15 px-2.5 py-0.5 text-xs font-semibold text-venture-discover">
            Aligned ✓
          </span>
        ) : null}
      </div>
      <h2 className="text-xl font-bold text-slate-900">Confirm your squad is ready</h2>
      <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
        <li>Everyone has read the mission brief</li>
        <li>Assumptions and interview questions are shared</li>
        <li>Field research plan is agreed</li>
        <li>Roles assigned for Tuesday interviews</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleConfirm} className="spike-btn-primary">
          {aligned ? 'Confirm again' : 'Squad is aligned — continue'}
        </button>
        {aligned ? (
          <Link to={week2MissionHref('interview-1', missionContext, 2)} className="spike-btn-secondary inline-flex">
            Start field research <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
      <p className="text-xs text-slate-500">
        You can return here anytime to re-confirm after revising assumptions or your interview guide.
      </p>
    </div>
  );
}
