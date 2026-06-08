/**
 * Venture Portfolio™ PDF export (Sprint 06C).
 */
import { jsPDF } from 'jspdf';
import { generateVenturePortfolio } from '../services/portfolioGenerator.js';

/**
 * @param {string} participantId
 * @param {{ participantName?: string, internProgress?: object | null }} meta
 */
export function exportVenturePortfolioPdf(participantId, meta = {}) {
  const portfolio = generateVenturePortfolio(participantId, meta);
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 48;
  const lineHeight = 16;
  let y = margin;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxWidth = pdf.internal.pageSize.getWidth() - margin * 2;

  function addPageIfNeeded(extra = lineHeight) {
    if (y + extra > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  }

  function writeLine(text, size = 11, style = 'normal') {
    addPageIfNeeded();
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(String(text ?? ''), maxWidth);
    for (const line of lines) {
      addPageIfNeeded();
      pdf.text(line, margin, y);
      y += lineHeight;
    }
  }

  function section(title) {
    y += 8;
    writeLine(title, 14, 'bold');
    y += 4;
  }

  writeLine('SPIKE Venture Portfolio™', 18, 'bold');
  writeLine(portfolio.cover.participantName, 16, 'bold');
  writeLine(portfolio.cover.tagline, 12, 'italic');
  writeLine(
    `${portfolio.cover.cohort} · ${portfolio.cover.squad} · ${portfolio.cover.careerTrack}`,
    10,
  );
  writeLine(
    `Blueprint ${portfolio.cover.blueprintCompletion}% · Portfolio ${portfolio.cover.portfolioCompletion}%`,
    10,
  );

  section('My Ambition');
  writeLine(portfolio.identity.ambition || '—');
  section('My Impact');
  writeLine(portfolio.identity.impact || '—');
  section('My Values');
  writeLine(portfolio.identity.valuesProfile || '—');
  section('My Future Self');
  writeLine(portfolio.identity.futureSelfSummary || portfolio.identity.futureSelf || '—');
  section('My Tagline');
  writeLine(portfolio.identity.tagline || '—');

  section('Dream Board');
  for (const asset of portfolio.dreamBoard.assets) {
    writeLine(`• [${asset.category}] ${asset.caption || 'Untitled'}`);
  }

  section('Financial Canvas Strategy');
  writeLine(portfolio.canvas.strategyStatement || '—');

  section('Research Highlights');
  for (const artifact of portfolio.research.artifacts.slice(0, 6)) {
    writeLine(`${artifact.title}: ${artifact.content.slice(0, 180)}…`);
  }

  section('Certifications & Badges');
  writeLine(portfolio.certifications.allBadges.join(' · ') || '—');

  pdf.save(`${portfolio.cover.participantName.replace(/\s+/g, '-')}-venture-portfolio.pdf`);
}
