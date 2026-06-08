import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronDown, ChevronRight, Clock, Loader2, Search, Sparkles } from 'lucide-react';
import { PageContainer, PageTitle } from '../components/layout/PageContainer.jsx';
import { InternReportCard } from '../components/reports/InternReportCard.jsx';
import { deriveReportRowMetrics } from '../lib/sprint01Metrics.js';
import { ROUTES } from '../routes/paths.js';

/**
 * @param {{
 *   interns: Array<object>,
 *   internsLoading: boolean,
 *   searchQuery: string,
 *   onSearchChange: (value: string) => void,
 *   onUpdateIntern: (intern: object) => void,
 * }} props
 */
export function ProgressReportsPage({
  interns,
  internsLoading,
  searchQuery,
  onSearchChange,
  onUpdateIntern,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const filteredInterns = interns.filter((intern) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      intern.name.toLowerCase().includes(q) ||
      (intern.email || '').toLowerCase().includes(q) ||
      (intern.university || '').toLowerCase().includes(q) ||
      (intern.squad || '').toLowerCase().includes(q)
    );
  });

  function toggleExpanded(id) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <PageContainer>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageTitle subtitle="Essential cohort metrics — expand a row for survey, FNA, and track details.">
          Progress reports
        </PageTitle>
        <label className="flex min-h-[44px] w-full items-center rounded-xl border border-slate-200 bg-white px-3 shadow-card sm:max-w-xs">
          <Search size={18} className="shrink-0 text-slate-400" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search interns…"
            className="ml-2 w-full bg-transparent text-sm outline-none"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
        {internsLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-slate-600">
            <Loader2 className="animate-spin text-spike" size={22} />
            Loading interns…
          </div>
        ) : filteredInterns.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No interns match your search.</p>
        ) : (
          <>
            <div className="divide-y md:hidden">
              {filteredInterns.map((intern) => (
                <InternReportCard
                  key={intern.id}
                  intern={intern}
                  report={deriveReportRowMetrics(intern)}
                  onUpdate={onUpdateIntern}
                />
              ))}
            </div>

            <div className="hidden md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-2xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="p-4">Intern</th>
                    <th className="p-4">Segment</th>
                    <th className="p-4">Hours</th>
                    <th className="p-4 text-center">Progress</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterns.map((intern) => {
                    const report = deriveReportRowMetrics(intern);
                    const isOpen = expandedId === intern.id;
                    const hoursPct = Math.min((intern.hours / 600) * 100, 100);

                    return (
                      <Fragment key={intern.id}>
                        <tr className="border-b border-slate-100 transition hover:bg-slate-50/80">
                          <td className="p-4">
                            <p className="font-semibold text-slate-900">{intern.name}</p>
                            <p className="text-xs text-slate-500">
                              {intern.email}
                              {intern.squad ? ` · ${intern.squad}` : ''}
                            </p>
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                                intern.segment === 1
                                  ? 'bg-sky-100 text-sky-800'
                                  : intern.segment === 2
                                    ? 'bg-violet-100 text-violet-800'
                                    : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {report.segmentStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex min-w-[120px] items-center gap-2">
                              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-spike"
                                  style={{ width: `${hoursPct}%` }}
                                />
                              </div>
                              <span className="shrink-0 text-xs font-semibold text-slate-700">
                                {intern.hours}h
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center text-sm font-semibold text-slate-800">
                            {report.portfolioPct}%
                          </td>
                          <td className="p-4 text-center">
                            {intern.licensed ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                <CheckCircle size={12} /> Licensed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                <Clock size={12} /> In progress
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(intern.id)}
                              className="inline-flex min-h-[40px] items-center gap-1 rounded-lg px-2 text-sm font-semibold text-spike hover:bg-spike-muted/60"
                              aria-expanded={isOpen}
                            >
                              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              {isOpen ? 'Hide' : 'View'}
                            </button>
                          </td>
                        </tr>
                        {isOpen ? (
                          <tr className="border-b border-slate-100 bg-slate-50/60">
                            <td colSpan={6} className="p-4">
                              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <p className="spike-label">Recruitment source</p>
                                  <p className="mt-1 text-sm text-slate-800">{intern.university || '—'}</p>
                                </div>
                                <div>
                                  <p className="spike-label">Career track</p>
                                  <p className="mt-1 text-sm text-slate-800">{report.careerTrack}</p>
                                </div>
                                <div>
                                  <p className="spike-label">Survey completion</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {report.surveyCompletion}%
                                  </p>
                                </div>
                                <div>
                                  <p className="spike-label">FNA completion</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {report.fnaCompletion}%
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => onUpdateIntern(intern)}
                                  className="spike-btn-primary"
                                >
                                  Update progress
                                </button>
                                <Link
                                  to={`${ROUTES.mentorVentureCoach}/${intern.id}`}
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                >
                                  <Sparkles size={16} className="text-spike" />
                                  Venture Coach review
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
