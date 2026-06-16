import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../routes/paths.js';
import { facilitatorsReferenceDayCount } from '../../lib/facilitatorsContentReference.js';

/** Dashboard entry to the Facilitators Content Reference (Weeks 1–4). */
export function FacilitatorsContentReferenceDashboardCard() {
  const dayCount = facilitatorsReferenceDayCount();

  return (
    <section className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-white via-indigo-50/40 to-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-700">
            <BookOpen size={16} /> Facilitation resource
          </p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">Facilitators Content Reference</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Full outline of talks, Deck 01 &amp; Deck 02 slide flows, activities, timing, mentor coaching focus,
            and hour gates for all {dayCount} program days in Weeks 1–4.
          </p>
        </div>
        <Link
          to={ROUTES.facilitatorsReference}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800"
        >
          Open reference
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
