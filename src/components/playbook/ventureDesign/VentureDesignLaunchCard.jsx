import { ArrowRight, Layout, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import {
  loadVentureDesignRecord,
  ventureDesignProgressPercent,
} from '../../../lib/ventureDesignStudioService.js';
import { BLUEPRINT_LINKS } from '../../../routes/paths.js';

/**
 * Playbook call-to-action — opens the Day 4 Venture Design Studio (replaces Deck 02).
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
  const href = presentMode
    ? `${BLUEPRINT_LINKS.businessPlan}?coach=1&start=1`
    : `${BLUEPRINT_LINKS.businessPlan}?start=1`;

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-spike/25 bg-gradient-to-br from-slate-900 via-spike-dark to-slate-900 p-5 text-white shadow-card sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-200/90">
            <Layout size={16} aria-hidden />
            Interactive module — replaces Deck 02
          </p>
          <h3 className="mt-2 text-xl font-bold sm:text-2xl lg:text-3xl">
            Venture Design Studio — FEC Workshop
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
            {facultyMode
              ? 'Project this workspace for your squad. Five guided steps build customer insight, brand identity, and a Financial Entrepreneurship Canvas draft.'
              : 'Work through five steps: target insight, transformation, venture proposition, brand identity, and FEC preview — no slides required.'}
          </p>
        </div>
        {participantId && percent > 0 ? (
          <div className="shrink-0 rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-black">{percent}%</p>
            <p className="text-2xs font-semibold uppercase tracking-wide text-slate-300">
              Design progress
            </p>
          </div>
        ) : null}
      </div>

      <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {['Target Insight', 'Before & After', 'Venture Proposition', 'Brand Identity', 'FEC Preview'].map(
          (label) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 font-medium text-slate-200"
            >
              <Sparkles size={14} className="shrink-0 text-amber-300" aria-hidden />
              {label}
            </li>
          ),
        )}
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to={href}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-spike shadow-lg transition hover:bg-red-50 sm:flex-none sm:px-8 sm:text-base"
        >
          {facultyMode ? 'Open for projection' : 'Enter Venture Design Studio'}
          <ArrowRight size={18} aria-hidden />
        </Link>
        {facultyMode ? (
          <Link
            to={`${BLUEPRINT_LINKS.businessPlan}?start=1`}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Squad view
          </Link>
        ) : null}
      </div>
    </section>
  );
}
