import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays } from 'lucide-react';
import { WEEK1_DAY_META } from '../../lib/mentorWeek1Constants.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * Week 1 mentor playbook quick links — one card per day.
 */
export function MentorWeek1QuickPanel() {
  return (
    <section className="spike-card">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <CalendarDays size={16} className="text-sky-700" /> Week 1 coaching guides
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Open the day guide, then log coaching sessions on each participant&apos;s card. Complete your
        squad weekly review from the mentor home dashboard.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-5">
        {WEEK1_DAY_META.map((meta) => (
          <Link
            key={meta.day}
            to={`${ROUTES.mentorPlaybook}/1/1/${meta.day}`}
            className="rounded-xl bg-slate-50 px-3 py-3 transition hover:bg-sky-50"
          >
            <p className="text-xs font-bold uppercase text-slate-500">Day {meta.day}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{meta.theme}</p>
            <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{meta.expectedOutput}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-spike">
              <BookOpen size={12} /> Open guide
            </span>
          </Link>
        ))}
      </div>
      <Link to={ROUTES.mentorVentureCoach} className="mt-3 inline-flex text-sm font-semibold text-spike hover:underline">
        Open participant coaching cards →
      </Link>
    </section>
  );
}
