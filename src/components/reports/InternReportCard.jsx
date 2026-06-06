import { CheckCircle, Clock } from 'lucide-react';

export function InternReportCard({ intern, report, onUpdate }) {
  const hoursPct = Math.min((intern.hours / 600) * 100, 100);

  return (
    <article className="space-y-3 p-4">
      <div>
        <p className="font-bold text-gray-900">{intern.name}</p>
        <p className="text-xs text-gray-500">
          {intern.email}
          {intern.squad ? ` · ${intern.squad}` : ''}
        </p>
        {intern.university ? (
          <p className="mt-1 text-sm text-gray-600">{intern.university}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <span
          className={`rounded px-2 py-1 text-xs font-bold ${
            intern.segment === 1
              ? 'bg-blue-100 text-blue-800'
              : intern.segment === 2
                ? 'bg-purple-100 text-purple-800'
                : 'bg-green-100 text-green-800'
          }`}
        >
          {report.segmentStatus}
        </span>
        {intern.licensed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">
            <CheckCircle size={12} /> {report.licensingStatus}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-800">
            <Clock size={12} /> {report.licensingStatus}
          </span>
        )}
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs font-bold text-gray-600">
          <span>Hours</span>
          <span>
            {intern.hours}/600
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-[#8B0000]" style={{ width: `${hoursPct}%` }} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-gray-50 p-2">
          <dt className="text-xs font-bold uppercase text-gray-500">Portfolio</dt>
          <dd className="font-bold text-gray-900">{report.portfolioPct}%</dd>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <dt className="text-xs font-bold uppercase text-gray-500">Survey</dt>
          <dd className="font-bold text-gray-900">{report.surveyCompletion}%</dd>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <dt className="text-xs font-bold uppercase text-gray-500">FNA</dt>
          <dd className="font-bold text-gray-900">{report.fnaCompletion}%</dd>
        </div>
        <div className="rounded-lg bg-gray-50 p-2">
          <dt className="text-xs font-bold uppercase text-gray-500">Track</dt>
          <dd className="text-xs font-semibold text-gray-800">{report.careerTrack}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onUpdate(intern)}
        className="min-h-[44px] w-full rounded-lg bg-[#8B0000] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-900"
      >
        Update progress
      </button>
    </article>
  );
}
