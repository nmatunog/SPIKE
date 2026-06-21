import { Link, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { deriveWeek2MissionTrack } from '../../lib/customerDiscovery/week2MissionService.js';
import { getMisBreakdown } from '../../lib/customerDiscovery/week2MisService.js';

/**
 * Vertical mission track — Duolingo-style progression.
 * @param {{ participantId: string, activeSlug?: string, context?: 'blueprint' | 'playbook' }} props
 */
export function MissionTrackNav({ participantId, activeSlug, context = 'blueprint' }) {
  const location = useLocation();
  const steps = deriveWeek2MissionTrack(participantId, context);
  const mis = getMisBreakdown(participantId);
  const activeTask = steps.find((s) => !s.complete) ?? steps[steps.length - 1];

  return (
    <nav aria-label="Week 2 mission track" className="space-y-1">
      <p className="mb-3 px-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
        Mission track
      </p>
      {steps.map((step) => {
        const isActive =
          context === 'playbook'
            ? (activeSlug ?? activeTask?.slug) === step.slug
            : location.pathname.includes(`/${step.slug}`)
              || (location.pathname.endsWith('/customer-discovery') && step.id === activeTask?.id);

        return (
          <Link
            key={step.id}
            to={step.href}
            className={`block rounded-xl px-3 py-2.5 transition ${
              isActive ? 'spike-task-active' : step.complete ? 'spike-task-done' : 'spike-task-pending hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step.complete
                    ? 'bg-venture-discover text-white'
                    : isActive
                      ? 'bg-spike text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step.complete ? <Check size={14} /> : step.index}
              </span>
              <span className={step.complete ? '' : 'font-medium'}>{step.shortLabel}</span>
            </span>
          </Link>
        );
      })}

      <div className="mt-6 space-y-2 px-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rewards</p>
        <div className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${mis.badges.explorer ? 'bg-amber-50 text-amber-800' : 'text-slate-300'}`}>
          🟨 Customer Explorer {mis.encodedInterviews}/3
        </div>
        <div className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${mis.badges.researcher ? 'bg-orange-50 text-orange-800' : 'text-slate-300'}`}>
          🟧 Market Researcher {mis.encodedInterviews}/5
        </div>
      </div>
    </nav>
  );
}
