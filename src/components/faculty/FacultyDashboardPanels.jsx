import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, Users } from 'lucide-react';
import {
  deriveFacultyAssessmentCoverage,
  deriveFacultyParticipantSubmissions,
  deriveFacultySubmissionSummary,
} from '../../lib/facultyFrameworkService.js';
import { WEEK1_FACULTY_DAY_META } from '../../lib/facultyWeek1Constants.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{ interns: Array<{ id: string, name: string, squad?: string }> }} props
 */
export function FacultyDashboardPanels({ interns }) {
  const submissions = deriveFacultyParticipantSubmissions(interns);
  const summary = deriveFacultySubmissionSummary(interns);
  const coverage = deriveFacultyAssessmentCoverage(interns);

  return (
    <div className="space-y-6">
      <section className="spike-card">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <CalendarDays size={16} className="text-indigo-700" /> Week 1 delivery
        </h3>
        <p className="mt-1 text-xs text-slate-500">Open day framework or deliver live content in Playbook.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {WEEK1_FACULTY_DAY_META.map((meta) => {
            const daySummary = summary.find((s) => s.day === meta.day);
            return (
              <div key={meta.day} className="rounded-xl bg-slate-50 px-3 py-3">
                <p className="text-xs font-bold uppercase text-slate-500">Day {meta.day}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{meta.theme}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {daySummary?.completePct ?? 0}% submitted
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  <Link
                    to={`${ROUTES.programCoachPlaybook}/1/1/${meta.day}`}
                    className="text-xs font-semibold text-spike hover:underline"
                  >
                    Framework →
                  </Link>
                  <Link to={ROUTES.playbook} className="text-xs font-semibold text-indigo-700 hover:underline">
                    Deliver →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="spike-card">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ClipboardCheck size={16} className="text-emerald-700" /> Mentor assessment coverage
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-xs font-bold uppercase text-slate-500">Coaching notes</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{coverage.coachingPct}%</p>
              <p className="text-[10px] text-slate-500">
                {coverage.coachingCount}/{coverage.total}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-center">
              <p className="text-xs font-bold uppercase text-slate-500">Week 1 assessments</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{coverage.assessmentPct}%</p>
              <p className="text-[10px] text-slate-500">
                {coverage.assessmentCount}/{coverage.total}
              </p>
            </div>
          </div>
        </section>

        <section className="spike-card">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BookOpen size={16} className="text-indigo-700" /> Submission summary
          </h3>
          <ul className="mt-3 space-y-2">
            {summary.map((day) => (
              <li key={day.day} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span>
                  Day {day.day} — {day.theme}
                </span>
                <span className="font-bold text-slate-900">
                  {day.completeCount}/{day.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="spike-card overflow-x-auto">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Users size={16} className="text-spike" /> Participant submission status
        </h3>
        <table className="mt-3 w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-2xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4">Participant</th>
              <th className="py-2 pr-4">Squad</th>
              <th className="py-2 pr-4">Week 1</th>
              {[1, 2, 3, 4, 5].map((day) => (
                <th key={day} className="py-2 px-1 text-center">
                  D{day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {submissions.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-semibold text-slate-900">{row.name}</td>
                <td className="py-2 pr-4 text-slate-600">{row.squad}</td>
                <td className="py-2 pr-4 font-semibold text-spike">{row.week1Pct}%</td>
                {row.dayStatus.map((day) => (
                  <td key={day.day} className="py-2 px-1 text-center">
                    {day.complete ? (
                      <CheckCircle2 size={16} className="inline text-emerald-600" aria-label="Complete" />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
