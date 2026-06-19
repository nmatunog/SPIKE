import { Link, useLocation } from 'react-router-dom';
import { FecCanvasLayout } from '../ventureDesign/FecCanvasLayout.jsx';
import { buildFecPreviewContent } from '../../lib/myVentureHqService.js';
import { computeCanvasCompletionPct } from '../../lib/canvasService.js';
import { getCanvasSummary } from '../../lib/canvasSummaryService.js';
import { fecProjectionHref } from '../../routes/paths.js';

/** @param {{ participantId: string, participantName?: string }} props */
export function StaffFecReadOnlyPanel({ participantId, participantName = 'Participant' }) {
  const location = useLocation();
  const preview = buildFecPreviewContent(participantId);
  const canvasPct = computeCanvasCompletionPct(participantId);
  const summary = getCanvasSummary(participantId);
  const projectionHref = fecProjectionHref(participantId, {
    name: participantName,
    exit: `${location.pathname}${location.search}`,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Financial Entrepreneurship Canvas</h2>
          <p className="text-sm text-slate-600">
            {participantName}&apos;s canvas — {canvasPct}% complete
          </p>
        </div>
        <Link
          to={projectionHref}
          className="text-sm font-semibold text-spike hover:underline"
        >
          Open projection mode →
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <FecCanvasLayout
          mode={preview.mode}
          variant="embedded"
          showHeader={false}
          showFooter={false}
          centerContent={preview.centerContent}
          uvpDetailContent={preview.uvpDetailContent}
          boxContents={preview.boxContents}
        />
      </div>
      {summary.success_revenue ? (
        <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Revenue target</dt>
            <dd className="mt-1 text-slate-800">{summary.success_revenue}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Customers</dt>
            <dd className="mt-1 text-slate-800">{summary.success_customers || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-slate-500">Annual profit</dt>
            <dd className="mt-1 text-slate-800">{summary.success_annual_profit || '—'}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
