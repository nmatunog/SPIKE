import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Presentation } from 'lucide-react';
import {
  getWeek1DayProgress,
  getWeek1RequiredOutputs,
  isWeek1PresentationReady,
  week1CompletionPct,
} from '../../lib/week1JourneyService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ participantId: string }} props
 */
export function PortfolioWeek1JourneyPanel({ participantId }) {
  const days = getWeek1DayProgress(participantId);
  const outputs = getWeek1RequiredOutputs(participantId);
  const pct = week1CompletionPct(participantId);
  const ready = isWeek1PresentationReady(participantId);

  return (
    <section className="spike-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="spike-label text-spike">Week 1 Journey</p>
          <h2 className="text-lg font-bold text-slate-900">Your Day 1–5 deliverables</h2>
          <p className="mt-1 text-sm text-slate-600">{pct}% of required Week 1 outputs complete</p>
        </div>
        <Link
          to={`${ROUTES.myVenturePortfolio}/present`}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            ready ? 'bg-spike text-white hover:bg-red-900' : 'bg-slate-100 text-slate-500 pointer-events-none'
          }`}
          aria-disabled={!ready}
        >
          <Presentation size={16} /> Present portfolio
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        {days.map((day) => (
          <div
            key={day.day}
            className={`rounded-xl px-3 py-2 text-center text-xs ${
              day.complete ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-600'
            }`}
          >
            <p className="font-bold">Day {day.day}</p>
            <p className="mt-0.5">{day.theme}</p>
            <p className="mt-1 text-[10px] opacity-80">{day.complete ? 'Complete' : day.expectedOutput}</p>
          </div>
        ))}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {outputs.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              item.done ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-700'
            }`}
          >
            {item.done ? <CheckCircle2 size={16} className="shrink-0" /> : <Circle size={16} className="shrink-0 text-slate-400" />}
            {item.href && !item.done ? (
              <Link to={item.href} className="font-medium hover:text-spike hover:underline">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>

      {!ready ? (
        <p className="text-xs text-amber-800">
          Complete identity, dream board, canvas, and portfolio sections to unlock Day 5 presentation mode.
        </p>
      ) : null}
    </section>
  );
}
