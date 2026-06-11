import { deriveWeek1DayProgress } from '../../lib/mentorFrameworkService.js';

/**
 * @param {{ interns: Array<{ id: string }> }} props
 */
export function FacultyWeek1ProgressPanel({ interns }) {
  const progress = deriveWeek1DayProgress(interns);

  return (
    <section className="spike-card">
      <h3 className="text-sm font-semibold text-slate-900">Week 1 cohort progress</h3>
      <p className="mt-1 text-xs text-slate-500">% of participants meeting each day&apos;s deliverable milestone.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-5">
        {progress.map((day) => (
          <div key={day.day} className="rounded-xl bg-slate-50 px-3 py-3 text-center">
            <p className="text-xs font-bold uppercase text-slate-500">{day.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{day.completePct}%</p>
            <p className="text-[10px] text-slate-500">
              {day.completeCount}/{day.total}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
