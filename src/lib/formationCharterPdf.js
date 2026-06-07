/**
 * Official SPIKE Squad Charter PDF generation.
 */
import { jsPDF } from 'jspdf';
import {
  getOfficialCohort,
  getSquadById,
  getSquadCharter,
  RESEARCH_MARKETS,
  getThemeItem,
} from './cohortFormationService.js';

/** @param {string} squadId */
export async function generateFormationCharterPdf(squadId) {
  const squad = getSquadById(squadId);
  const charter = getSquadCharter(squadId);
  const cohort = getOfficialCohort();
  if (!squad || !charter) return null;

  const item = getThemeItem(String(squad.themeItemId));
  const market =
    RESEARCH_MARKETS.find((m) => m.id === squad.researchMarket)?.label ?? squad.researchMarket;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const margin = 48;
  let y = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(139, 0, 0);
  pdf.text('Official SPIKE Squad Charter', margin, y);
  y += 28;

  pdf.setFontSize(11);
  pdf.setTextColor(30, 41, 59);

  const fields = [
    ['Cohort', cohort ? `SPIKE Cohort ${cohort.name} ${cohort.year}-${cohort.batch}` : 'SPIKE ASC'],
    ['Squad Name', squad.name],
    ['Theme', item ? `${item.themeName} · ${item.name}` : '—'],
    ['Research Market', market],
    ['Squad Motto', charter.motto],
    ['Commitment', charter.commitment_statement],
    ['Date', new Date().toLocaleDateString()],
  ];

  for (const [label, value] of fields) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, margin, y);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(String(value ?? ''), 360);
    pdf.text(lines, margin + 110, y);
    y += Math.max(lines.length * 13, 16) + 8;
  }

  y += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Members & Digital Signatures', margin, y);
  y += 18;
  pdf.setFont('helvetica', 'normal');

  for (const member of squad.members ?? []) {
    const sig = (charter.signatures ?? []).find((s) => s.participantId === member.participantId);
    const line = sig
      ? `✓ ${member.role}: ${sig.name} — ${new Date(sig.signedAt).toLocaleDateString()}`
      : `○ ${member.role}: Pending signature`;
    pdf.text(line, margin, y);
    y += 16;
  }

  pdf.save(`spike-squad-charter-${squadId}.pdf`);
  return pdf;
}
