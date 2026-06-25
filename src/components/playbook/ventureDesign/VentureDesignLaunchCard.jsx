import { ArrowRight, Layout, Monitor, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import {
  loadVentureDesignRecord,
  ventureDesignProgressPercent,
} from '../../../lib/ventureDesignStudioService.js';
import {
  COACH_WORKSHOP_HREF,
  PROJECTION_HREF,
  WORKSHOP_HREF,
} from './Day4VentureDesignHero.jsx';
import { internFecCanvasHref } from '../../../routes/paths.js';

/**
 * Session-level CTA — complements the Day 4 hero (replaces Deck 02 in session flow).
 * @param {{ participantId?: string, facultyMode?: boolean, presentMode?: boolean }} props
 */
export function VentureDesignLaunchCard({
  participantId,
  facultyMode = false,
  presentMode = false,
}) {
  const location = useLocation();
  const state = useMemo(
    () => (participantId ? loadVentureDesignRecord(participantId) : null),
    [participantId, location.pathname],
  );
  const percent = state ? ventureDesignProgressPercent(state) : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-spike/20 bg-gradient-to-br from-slate-900/90 to-spike-dark/90 p-5 text-white sm:p-6">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-200/80">
        <Layout size={14} aria-hidden />
        Session module — Venture Design Studio
      </p>
      <p className="mt-2 text-sm text-slate-300">
        {facultyMode
          ? 'Use the Day 4 hero above for projection. This slot replaces Deck 02 in the session timeline.'
          : percent > 0
            ? `You are ${percent}% through the workshop — pick up where you left off.`
            : 'Five steps from research insight to FEC preview. Your squad works here instead of slides.'}
      </p>

      <ul className="mt-4 flex flex-wrap gap-2 text-xs">
        {['Insight', 'Transform', 'UVP', 'Brand', 'FEC'].map((label) => (
          <li
            key={label}
            className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 font-semibold text-slate-300"
          >
            <Sparkles size={12} className="text-amber-300" aria-hidden />
            {label}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        {facultyMode ? (
          <>
            <Link
              to={presentMode ? PROJECTION_HREF : PROJECTION_HREF}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-stone-900 hover:bg-amber-300"
            >
              <Monitor size={16} aria-hidden />
              FEC Canvas projection
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              to={COACH_WORKSHOP_HREF}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Squad workshop
            </Link>
          </>
        ) : (
          <>
            <Link
              to={WORKSHOP_HREF}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-spike hover:bg-red-50"
            >
              {percent > 0 ? 'Continue workshop' : 'Enter Venture Design Studio'}
              <ArrowRight size={16} aria-hidden />
            </Link>
            {percent > 0 ? (
              <Link
                to={internFecCanvasHref()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                <Layout size={16} aria-hidden />
                My FEC Canvas
              </Link>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
