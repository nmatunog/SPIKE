import { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronRight, Clock } from 'lucide-react';

export function InternReportCard({ intern, report, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const hoursPct = Math.min((intern.hours / 600) * 100, 100);

  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{intern.name}</p>
          <p className="text-xs text-slate-500">
            {intern.email}
            {intern.squad ? ` · ${intern.squad}` : ''}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
            intern.segment === 1
              ? 'bg-sky-100 text-sky-800'
              : intern.segment === 2
                ? 'bg-violet-100 text-violet-800'
                : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {report.segmentStatus}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl bg-slate-50 px-2 py-2">
          <p className="spike-label">Hours</p>
          <p className="font-semibold text-slate-900">{intern.hours}h</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2 py-2">
          <p className="spike-label">Progress</p>
          <p className="font-semibold text-slate-900">{report.portfolioPct}%</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2 py-2">
          <p className="spike-label">Status</p>
          <p className="text-xs font-semibold text-slate-800">
            {intern.licensed ? 'Licensed' : 'Active'}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-spike" style={{ width: `${hoursPct}%` }} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 inline-flex min-h-[40px] items-center gap-1 text-sm font-semibold text-spike"
        aria-expanded={expanded}
      >
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {expanded ? 'Hide details' : 'Show details'}
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
          {intern.university ? (
            <p>
              <span className="spike-label block">Recruitment source</span>
              {intern.university}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="spike-label block">Survey</span>
              <span className="font-semibold">{report.surveyCompletion}%</span>
            </div>
            <div>
              <span className="spike-label block">FNA</span>
              <span className="font-semibold">{report.fnaCompletion}%</span>
            </div>
          </div>
          <p>
            <span className="spike-label block">Career track</span>
            {report.careerTrack}
          </p>
          <p className="flex items-center gap-1 text-xs">
            {intern.licensed ? (
              <>
                <CheckCircle size={12} className="text-emerald-600" /> {report.licensingStatus}
              </>
            ) : (
              <>
                <Clock size={12} className="text-amber-600" /> {report.licensingStatus}
              </>
            )}
          </p>
        </div>
      ) : null}

      <button type="button" onClick={() => onUpdate(intern)} className="spike-btn-primary mt-4 w-full">
        Update progress
      </button>
    </article>
  );
}
