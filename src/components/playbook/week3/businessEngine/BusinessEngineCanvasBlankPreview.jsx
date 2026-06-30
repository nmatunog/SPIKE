import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Download, ExternalLink } from 'lucide-react';
import { BusinessEngineCanvas } from './BusinessEngineCanvas.jsx';
import { playbookBusinessEngineCanvasPreviewHref, playbookHref } from '../../../../routes/paths.js';
import { exportExecutiveCanvasPng, exportExecutiveCanvasPdf } from '../../../../lib/canvasExportService.js';
import { PROGRAM_COACH_LABEL } from '../../../../lib/terminology.js';

const FACILITATOR_FLOW = [
  'Teams complete the Activity Engine using the 10–5–3–1–₱10,000–3 model.',
  'Convert weekly activities into monthly projections (Weekly × 4).',
  'Identify which business lever creates the greatest impact.',
  'Commit to a Year 1 revenue target on Page 2.',
  'Each squad presents its Business Engine in 3–5 minutes.',
];

/**
 * Blank SPIKE Business Engine Canvas™ — coach/mentor reference for workshop delivery.
 * @param {{
 *   compact?: boolean,
 *   roleLabel?: string,
 *   className?: string,
 *   showOpenFullscreen?: boolean,
 * }} props
 */
export function BusinessEngineCanvasBlankPreview({
  compact = false,
  roleLabel = PROGRAM_COACH_LABEL,
  className = '',
  showOpenFullscreen = true,
}) {
  const canvasRef = useRef(null);

  async function exportPng() {
    if (!canvasRef.current) return;
    await exportExecutiveCanvasPng(canvasRef.current, 'spike-business-engine-canvas-blank.png');
  }

  async function exportPdf() {
    if (!canvasRef.current) return;
    await exportExecutiveCanvasPdf(canvasRef.current, 'spike-business-engine-canvas-blank.pdf');
  }

  return (
    <div className={className}>
      <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-sm text-slate-800">
        <p className="font-semibold text-slate-900">
          {roleLabel} reference — SPIKE Business Engine Canvas™ (blank)
        </p>
        <p className="mt-1 text-slate-700">
          Project this during the workshop so interns see what they will complete. Numbers in the engine
          show the model defaults; target tables and reflections are blank.
        </p>
        {!compact ? (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-slate-700">
            {FACILITATOR_FLOW.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3">
          {showOpenFullscreen ? (
            <Link
              to={playbookBusinessEngineCanvasPreviewHref()}
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-spike hover:underline"
            >
              <ExternalLink size={15} aria-hidden />
              Open fullscreen preview
            </Link>
          ) : null}
          <Link
            to={playbookHref({ segment: 1, week: 3, day: 3 })}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-slate-700 hover:underline"
          >
            <BookOpen size={15} aria-hidden />
            Coach delivery view
          </Link>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 print:hidden">
        <button type="button" onClick={exportPng} className="spike-btn-secondary text-xs">
          <Download size={14} aria-hidden /> PNG
        </button>
        <button type="button" onClick={exportPdf} className="spike-btn-secondary text-xs">
          <Download size={14} aria-hidden /> PDF
        </button>
        <button type="button" onClick={() => window.print()} className="spike-btn-secondary text-xs">
          Print
        </button>
      </div>

      <div ref={canvasRef}>
        <BusinessEngineCanvas variant="blankPreview" showBothPages={!compact} />
      </div>
    </div>
  );
}
