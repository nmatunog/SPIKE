import { useMemo, useState } from 'react';
import { Presentation } from 'lucide-react';
import { PresentationViewer } from '../playbook/PresentationViewer.jsx';
import { getRaSpikeCoachPresentation } from '../../lib/raSpikePresentationLoader.js';
import { RA_SPIKE_PROGRAM } from '../../lib/programs/ra-spike.js';

/**
 * Coach presentation materials for the active RA-SPIKE week (classroom slides).
 * @param {{ defaultWeek?: number }} props
 */
export function RaSpikeCoachPresentationPanel({ defaultWeek = 2 }) {
  const [week, setWeek] = useState(defaultWeek);
  const deck = useMemo(() => getRaSpikeCoachPresentation(week), [week]);

  if (!deck?.slides?.length) {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Coach presentation</p>
        <p className="mt-1">No slides uploaded for Week {week} yet.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Presentation className="mt-0.5 shrink-0 text-indigo-700" size={22} aria-hidden />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-800">Coach presentation</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Week {week} classroom slides</h2>
            <p className="mt-1 text-sm text-slate-600">
              Present live in class — speaker notes and PPTX download for coaches.
            </p>
          </div>
        </div>
        <label className="text-sm text-slate-600">
          <span className="sr-only">Week</span>
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold"
          >
            {Array.from({ length: RA_SPIKE_PROGRAM.totalWeeks }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </label>
      </div>

      <PresentationViewer
        presentation={deck.presentation}
        slides={deck.slides}
        facultyMode
      />
    </section>
  );
}
