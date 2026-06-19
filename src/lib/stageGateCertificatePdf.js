/**
 * Stage Gate Certificate PDF — minimal SPIKE-branded export.
 */
import { jsPDF } from 'jspdf';

/**
 * @param {{
 *   participantName: string,
 *   squadName?: string,
 *   programName?: string,
 *   completedDate: string,
 *   stageLabel: string,
 *   nextStageLabel: string,
 *   title?: string,
 *   closingWeek?: number,
 * }} certificate
 * @param {{ download?: boolean, filename?: string }} [opts]
 */
export function exportStageGateCertificatePdf(certificate, opts = {}) {
  const { download = true, filename } = opts;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const margin = 56;
  const pageW = pdf.internal.pageSize.getWidth();
  let y = margin + 20;

  pdf.setDrawColor(185, 28, 28);
  pdf.setLineWidth(1);
  pdf.rect(margin - 8, margin - 8, pageW - margin * 2 + 16, pdf.internal.pageSize.getHeight() - margin * 2 + 16);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(185, 28, 28);
  pdf.text('SPIKE', pageW / 2, y, { align: 'center' });
  y += 28;

  pdf.setFontSize(11);
  pdf.setTextColor(100, 116, 139);
  pdf.text('STAGE GATE CERTIFICATE', pageW / 2, y, { align: 'center' });
  y += 48;

  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  const meta = [
    ['Participant', certificate.participantName || '—'],
    ['Squad', certificate.squadName || '—'],
    ['Program', certificate.programName || 'SPIKE Venture Studio'],
    ['Date', formatCertDate(certificate.completedDate)],
  ];
  for (const [label, value] of meta) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, margin + 40, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(value), margin + 140, y);
    y += 22;
  }

  y += 36;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(36);
  pdf.setTextColor(15, 23, 42);
  pdf.text(certificate.stageLabel || 'DISCOVER', pageW / 2, y, { align: 'center' });
  y += 32;

  pdf.setFontSize(12);
  pdf.setTextColor(185, 28, 28);
  pdf.text('✓ COMPLETED', pageW / 2, y, { align: 'center' });
  y += 56;

  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text('NEXT STAGE', pageW / 2, y, { align: 'center' });
  y += 18;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${certificate.nextStageLabel || 'VALIDATE'}  ·  UNLOCKED`, pageW / 2, y, { align: 'center' });

  const footerY = pdf.internal.pageSize.getHeight() - margin;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);
  pdf.text('SPIKE Venture Studio', pageW / 2, footerY - 14, { align: 'center' });
  pdf.text('Official Program Record', pageW / 2, footerY, { align: 'center' });

  const name =
    filename
    ?? `spike-stage-gate-${certificate.stageLabel?.toLowerCase() ?? 'certificate'}-week-${certificate.closingWeek ?? 1}.pdf`;
  if (download) pdf.save(name);
  return pdf;
}

/** @param {string} value */
function formatCertDate(value) {
  if (!value) return new Date().toLocaleDateString();
  const d = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
