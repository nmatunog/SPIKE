import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveSquadMission, PREPARE_RULES } from '../../lib/customerDiscovery/week2Constants.js';
import { acknowledgeMission, getWeek2State } from '../../lib/customerDiscovery/week2DiscoveryService.js';
import { week2MissionHref } from '../../lib/customerDiscovery/week2MissionService.js';

/**
 * Minimal mission brief — always editable; acknowledgment is optional progress.
 * @param {{ participantId: string, squadName?: string, onComplete?: () => void, missionContext?: 'blueprint' | 'playbook' }} props
 */
export function MissionBriefTask({ participantId, squadName, onComplete, missionContext = 'blueprint' }) {
  const mission = resolveSquadMission(squadName);
  const [expanded, setExpanded] = useState(true);
  const [acknowledged, setAcknowledged] = useState(() => Boolean(getWeek2State(participantId).missionAcknowledged));

  function handleAcknowledge() {
    acknowledgeMission(participantId);
    setAcknowledged(true);
    onComplete?.();
  }

  return (
    <div className="space-y-8">
      <section className="spike-surface space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="spike-label">Today&apos;s mission</p>
          {acknowledged ? (
            <span className="rounded-full bg-venture-discover/15 px-2.5 py-0.5 text-xs font-semibold text-venture-discover">
              Acknowledged ✓
            </span>
          ) : null}
        </div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Interview {mission.interviewTarget}
        </h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">Goal</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{mission.goal}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">Success</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{mission.success}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-400">Reward</dt>
            <dd className="mt-0.5 font-medium text-spike">Research Validation Gate → Week 3 Build</dd>
          </div>
        </dl>
        {!acknowledged ? (
          <button type="button" onClick={handleAcknowledge} className="spike-btn-primary w-full sm:w-auto">
            I understand — continue <ArrowRight size={16} />
          </button>
        ) : (
          <Link to={week2MissionHref('assumptions', missionContext, 1)} className="spike-btn-primary inline-flex">
            Identify assumptions <ArrowRight size={16} />
          </Link>
        )}
      </section>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-slate-500 hover:text-spike"
      >
        {expanded ? 'Hide full mission brief' : 'View full mission brief'}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded ? (
        <section className="spike-surface space-y-5 animate-spike-fade-in">
          <p className="flex items-center gap-1.5 text-sm font-bold text-spike">
            <Star size={14} fill="currentColor" aria-hidden />
            {mission.squadKey}
          </p>
          <p className="text-sm font-semibold text-slate-700">{mission.marketSegment}</p>
          <p className="text-sm leading-relaxed text-slate-600">{mission.mission}</p>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Suggested locations</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {mission.locations.map((loc) => (
                <li
                  key={loc}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  <MapPin size={12} className="text-spike" aria-hidden />
                  {loc}
                </li>
              ))}
            </ul>
          </div>
          <ul className="space-y-2 text-sm text-slate-600">
            {mission.objectives.map((obj) => (
              <li key={obj} className="flex gap-2">
                <span className="text-spike">•</span>
                {obj}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <p className="text-display-sm font-bold text-slate-900">{PREPARE_RULES.headline}</p>
        <p className="text-sm text-slate-600">{PREPARE_RULES.subhead}</p>
      </section>
    </div>
  );
}
