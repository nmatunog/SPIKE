import { Download, X } from 'lucide-react';
import { exportStageGateCertificatePdf } from '../../lib/stageGateCertificatePdf.js';
import { StageGateCertificateCard } from './StageGateCertificateCard.jsx';

/**
 * Coach sample certificate preview — does not issue or unlock anything.
 * @param {{
 *   certificate: import('../../lib/stageGateService.js').StageGateCertificateDisplay,
 *   onClose: () => void,
 * }} props
 */
export function StageGateCertificatePreviewModal({ certificate, onClose }) {
  function handleDownload() {
    exportStageGateCertificatePdf(certificate, {
      filename: `spike-stage-gate-sample-week-${certificate.closingWeek ?? 1}.pdf`,
    });
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        className="spike-card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
        role="dialog"
        aria-labelledby="sample-cert-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="sample-cert-title" className="text-lg font-bold text-slate-900">
              Sample certificate preview
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Week {certificate.closingWeek} — each participant receives a personalized certificate
              when you unlock {certificate.nextStageLabel}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>

        <StageGateCertificateCard certificate={certificate} sample />

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="spike-btn-primary inline-flex items-center gap-2"
          >
            <Download size={16} /> Download sample PDF
          </button>
          <button type="button" onClick={onClose} className="spike-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
