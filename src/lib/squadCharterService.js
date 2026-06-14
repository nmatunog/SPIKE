/**
 * Squad Charter — collaborative signing and PDF generation.
 */
import { jsPDF } from 'jspdf';
import { RESEARCH_MARKETS } from './day1BuilderConstants.js';
import { getAllDay1BuilderData } from './day1BuilderStorage.js';

const CHARTER_STORAGE_KEY = 'spike_squad_charters';

function readCharters() {
  try {
    return JSON.parse(localStorage.getItem(CHARTER_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeCharters(data) {
  localStorage.setItem(CHARTER_STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} squadId */
export function getSquadCharter(squadId) {
  return readCharters()[squadId] ?? null;
}

/**
 * @param {string} squadId
 * @param {Record<string, unknown>} charterFields
 */
export function upsertSquadCharterDraft(squadId, charterFields) {
  const all = readCharters();
  const existing = all[squadId] ?? { squadId, signatures: [] };
  all[squadId] = {
    ...existing,
    ...charterFields,
    squadId,
    updatedAt: new Date().toISOString(),
  };
  writeCharters(all);
  return all[squadId];
}

/**
 * @param {string} squadId
 * @param {{ participantId: string, name: string, signedAt: string }} signature
 */
export function addCharterSignature(squadId, signature) {
  const all = readCharters();
  const charter = all[squadId] ?? { squadId, signatures: [] };
  const signatures = charter.signatures ?? [];
  if (!signatures.find((s) => s.participantId === signature.participantId)) {
    signatures.push(signature);
  }
  charter.signatures = signatures;
  charter.updatedAt = new Date().toISOString();
  all[squadId] = charter;
  writeCharters(all);
  return charter;
}

/**
 * @param {string} squadId
 * @param {string} facultyId
 */
export function approveSquadCharter(squadId, facultyId) {
  const all = readCharters();
  const charter = all[squadId];
  if (!charter) return null;
  charter.facultyApproved = true;
  charter.facultyApprovedBy = facultyId;
  charter.facultyApprovedAt = new Date().toISOString();
  all[squadId] = charter;
  writeCharters(all);
  return charter;
}

/** @param {string} participantId @param {Record<string, unknown>} data */
export async function generateSquadCharterPdf(participantId, data) {
  const squadId = String(data.squadId ?? 'default-squad');
  const charter = getSquadCharter(squadId) ?? upsertSquadCharterDraft(squadId, data);
  const signatures = charter.signatures ?? [];

  if (signatures.length < 1) {
    addCharterSignature(squadId, {
      participantId,
      name: String(data.signatureName ?? 'Participant'),
      signedAt: String(data.signedAt ?? new Date().toISOString()),
    });
  }

  const updated = getSquadCharter(squadId);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const margin = 48;
  let y = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(139, 0, 0);
  pdf.text('Official SPIKE Squad Charter', margin, y);
  y += 32;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 41, 59);

  const marketLabel =
    RESEARCH_MARKETS.find((m) => m.id === updated.marketSegment)?.label
    ?? updated.marketSegment
    ?? 'Research Market';

  const fields = [
    ['Squad Name', updated.squadName ?? data.squadName],
    ['Market Segment', marketLabel],
    ['Team Motto', updated.teamMotto ?? data.teamMotto],
    ['Mission', updated.mission ?? data.mission],
    ['Team Commitment', updated.teamCommitment ?? data.teamCommitment],
    ['Date', new Date().toLocaleDateString()],
  ];

  for (const [label, value] of fields) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, margin, y);
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(String(value ?? ''), 380);
    pdf.text(lines, margin + 120, y);
    y += Math.max(lines.length * 14, 18) + 6;
  }

  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Member Signatures', margin, y);
  y += 18;
  pdf.setFont('helvetica', 'normal');

  for (const sig of updated.signatures ?? []) {
    pdf.text(`✓ ${sig.name} — ${new Date(sig.signedAt).toLocaleDateString()}`, margin, y);
    y += 16;
  }

  if (updated.facultyApproved) {
    y += 8;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(139, 0, 0);
    pdf.text('Program Coach Approved', margin, y);
  }

  pdf.save(`spike-squad-charter-${squadId}.pdf`);
  return pdf;
}

/** List all charters for faculty/mentor views */
export function listAllSquadCharters() {
  return Object.values(readCharters());
}

/** @param {string} participantId */
export function getParticipantCharterPreview(participantId) {
  const builders = getAllDay1BuilderData(participantId);
  return builders['squad-charter']?.data ?? null;
}
