import { useState } from 'react';
import { getWeek2State, saveFieldResearchPlan } from '../../lib/customerDiscovery/week2DiscoveryService.js';
import { resolveSquadMission } from '../../lib/customerDiscovery/week2Constants.js';

/**
 * @param {{ participantId: string, squadName?: string, onSaved?: () => void }} props
 */
export function FieldResearchPlanTask({ participantId, squadName, onSaved }) {
  const mission = resolveSquadMission(squadName);
  const [plan, setPlan] = useState(getWeek2State(participantId).fieldResearchPlan ?? '');

  function persist(value) {
    setPlan(value);
    saveFieldResearchPlan(participantId, value);
    onSaved?.();
  }

  return (
    <div className="space-y-6">
      <section className="spike-surface space-y-2">
        <p className="spike-label">Field research plan</p>
        <h2 className="text-xl font-bold text-slate-900">Submit your squad plan</h2>
        <p className="text-sm text-slate-600">
          Target: {mission.interviewTarget}. Where will you go? Who will you talk to? When?
        </p>
      </section>
      <textarea
        value={plan}
        onChange={(e) => persist(e.target.value)}
        rows={8}
        placeholder={`Squad locations:\n${mission.locations.slice(0, 3).join(', ')}\n\nSchedule:\n\nRoles:`}
        className="w-full rounded-xl border border-slate-200 p-4 text-sm text-slate-800 focus:border-spike focus:outline-none focus:ring-1 focus:ring-spike"
      />
      <p className="text-xs text-slate-500">Auto-saves to your portfolio when complete.</p>
    </div>
  );
}
