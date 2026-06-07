/**
 * Executive Canvas export engine — PNG, PDF, PPT, Venture Board cover sheet.
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';

const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;

/**
 * @param {HTMLElement} element
 * @param {string} filename
 */
export async function exportExecutiveCanvasPng(element, filename = 'spike-executive-canvas.png') {
  const canvas = await renderExportCanvas(element);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * @param {HTMLElement} element
 * @param {string} filename
 */
export async function exportExecutiveCanvasPdf(element, filename = 'spike-executive-canvas.pdf') {
  const canvas = await renderExportCanvas(element);
  const imgData = canvas.toDataURL('image/jpeg', 0.92);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [EXPORT_WIDTH, EXPORT_HEIGHT],
  });
  pdf.addImage(imgData, 'JPEG', 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
  pdf.save(filename);
}

/**
 * @param {import('./executiveCanvasModel.js').ReturnType<typeof import('./executiveCanvasModel.js').buildExecutiveCanvasModel>} model
 * @param {string} [filename]
 */
export async function exportExecutiveCanvasPpt(model, filename = 'spike-executive-canvas.pptx') {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'SPIKE ASC';
  pptx.title = 'Executive Canvas';

  const slide = pptx.addSlide();
  slide.background = { color: 'F8FAFC' };

  slide.addText('SPIKE ASC — Executive Canvas', {
    x: 0.4,
    y: 0.2,
    w: 9.2,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: '8B0000',
  });

  slide.addText(
    `${model.header.participantName} · ${model.header.careerTrackLabel} · ${model.header.dateUpdated}`,
    { x: 0.4, y: 0.75, w: 9.2, h: 0.35, fontSize: 12, color: '475569' },
  );

  const leftCol = model.engines
    .slice(0, 2)
    .map((engine) => `${engine.label}\n${engine.fields.map((f) => `• ${f.label}: ${f.value}`).join('\n')}`)
    .join('\n\n');

  const rightCol = model.engines
    .slice(2)
    .map((engine) => `${engine.label}\n${engine.fields.map((f) => `• ${f.label}: ${f.value}`).join('\n')}`)
    .join('\n\n');

  slide.addText(leftCol, {
    x: 0.4,
    y: 1.2,
    w: 4.5,
    h: 3.2,
    fontSize: 9,
    color: '1E293B',
    valign: 'top',
  });

  slide.addText(rightCol, {
    x: 5.1,
    y: 1.2,
    w: 4.5,
    h: 3.2,
    fontSize: 9,
    color: '1E293B',
    valign: 'top',
  });

  slide.addText('Overall Strategy', {
    x: 0.4,
    y: 4.5,
    w: 9.2,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: '8B0000',
  });
  slide.addText(model.strategyStatement, {
    x: 0.4,
    y: 4.85,
    w: 9.2,
    h: 0.9,
    fontSize: 10,
    color: '334155',
    valign: 'top',
  });

  slide.addText(
    `90-Day Priorities: ${model.priorities.filter(Boolean).join(' · ') || '—'}`,
    { x: 0.4, y: 5.85, w: 9.2, h: 0.35, fontSize: 10, color: '334155' },
  );

  slide.addText(
    `SPIKE Venture Readiness Score: ${model.readiness.composite}/100 · Blueprint ${model.header.blueprintCompletion}%`,
    { x: 0.4, y: 6.3, w: 9.2, h: 0.35, fontSize: 11, bold: true, color: '8B0000' },
  );

  await pptx.writeFile({ fileName: filename });
}

/**
 * @param {ReturnType<typeof import('./executiveCanvasModel.js').buildExecutiveCanvasModel>} model
 * @param {string} [filename]
 */
export async function exportVentureBoardCoverSheet(
  model,
  filename = 'spike-venture-board-cover.pdf',
) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const margin = 48;
  let y = margin;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(139, 0, 0);
  pdf.text('SPIKE Venture Board — Cover Sheet', margin, y);
  y += 28;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(30, 41, 59);

  const lines = [
    ['Participant', model.header.participantName],
    ['Career Track', model.header.careerTrackLabel],
    ['Current Position', model.header.careerPosition],
    ['Blueprint Completion', `${model.header.blueprintCompletion}%`],
    ['Canvas Completion', `${model.header.canvasCompletion}%`],
    ['Venture Readiness Score', `${model.readiness.composite}/100`],
    ['Venture Board Status', model.header.ventureBoardStatus],
    ['Segment', `Segment ${model.header.segment}`],
    ['Date Updated', model.header.dateUpdated],
  ];

  for (const [label, value] of lines) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(String(value), margin + 160, y);
    y += 20;
  }

  y += 12;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Ambition & Purpose', margin, y);
  y += 18;
  pdf.setFont('helvetica', 'normal');
  const ambitionPurposeLines = [
    ['Ambition', model.ambitionPurpose?.ambition ?? '—'],
    ['Purpose', model.ambitionPurpose?.purpose ?? '—'],
    ['Values', model.ambitionPurpose?.values ?? '—'],
    ['Tagline', model.ambitionPurpose?.tagline ?? '—'],
    ['Future Self Summary', model.ambitionPurpose?.futureSelfSummary ?? '—'],
    ['Future Self', model.ambitionPurpose?.futureSelf ?? '—'],
  ];
  for (const [label, value] of ambitionPurposeLines) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, margin, y);
    pdf.setFont('helvetica', 'normal');
    const wrapped = pdf.splitTextToSize(String(value), 520);
    pdf.text(wrapped, margin + 80, y);
    y += Math.max(wrapped.length * 14, 16) + 4;
  }

  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Canvas Summary', margin, y);
  y += 18;
  pdf.setFont('helvetica', 'normal');
  const summaryText = pdf.splitTextToSize(model.strategyStatement, 520);
  pdf.text(summaryText, margin, y);
  y += summaryText.length * 14 + 16;

  pdf.setFont('helvetica', 'bold');
  pdf.text('90-Day Priorities', margin, y);
  y += 18;
  pdf.setFont('helvetica', 'normal');
  model.priorities.forEach((priority, idx) => {
    if (!priority) return;
    pdf.text(`${idx + 1}. ${priority}`, margin, y);
    y += 16;
  });

  pdf.save(filename);
}

/** @param {HTMLElement} element */
async function renderExportCanvas(element) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#f8fafc',
    width: element.scrollWidth,
    height: element.scrollHeight,
  });

  const output = document.createElement('canvas');
  output.width = EXPORT_WIDTH;
  output.height = EXPORT_HEIGHT;
  const ctx = output.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);

  const scale = Math.min(EXPORT_WIDTH / canvas.width, EXPORT_HEIGHT / canvas.height);
  const drawWidth = canvas.width * scale;
  const drawHeight = canvas.height * scale;
  const offsetX = (EXPORT_WIDTH - drawWidth) / 2;
  const offsetY = (EXPORT_HEIGHT - drawHeight) / 2;
  ctx.drawImage(canvas, offsetX, offsetY, drawWidth, drawHeight);
  return output;
}
