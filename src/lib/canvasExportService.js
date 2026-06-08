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

const PPT_COLORS = {
  spike: '8B0000',
  spikeMuted: 'FEE2E2',
  border: 'CBD5E1',
  borderStrong: '8B0000',
  text: '1E293B',
  muted: '64748B',
  white: 'FFFFFF',
  canvasBg: 'F8FAFC',
};

/**
 * @param {import('pptxgenjs').default} pptx
 * @param {import('pptxgenjs').Slide} slide
 * @param {{ x: number, y: number, w: number, h: number, fill?: string, line?: string, lineWidth?: number }} box
 */
function addCanvasBox(pptx, slide, box) {
  slide.addShape(pptx.ShapeType.rect, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: box.fill ?? PPT_COLORS.white },
    line: { color: box.line ?? PPT_COLORS.borderStrong, width: box.lineWidth ?? 1.25 },
  });
}

/**
 * @param {import('pptxgenjs').Slide} slide
 * @param {{ x: number, y: number, w: number }} line
 */
function addCanvasLine(slide, line) {
  slide.addShape('line', {
    x: line.x,
    y: line.y,
    w: line.w,
    h: 0,
    line: { color: PPT_COLORS.border, width: 1 },
  });
}

/**
 * @param {import('pptxgenjs').Slide} slide
 * @param {{ label: string, fields: Array<{ label: string, value: string }> }} engine
 * @param {{ x: number, y: number, w: number, h: number }} box
 */
function addEngineBox(slide, engine, box) {
  const pad = 0.12;
  const innerX = box.x + pad;
  const innerW = box.w - pad * 2;

  slide.addText(engine.label, {
    x: innerX,
    y: box.y + 0.08,
    w: innerW,
    h: 0.22,
    fontSize: 10,
    bold: true,
    color: PPT_COLORS.spike,
    charSpacing: 0.5,
  });

  addCanvasLine(slide, { x: innerX, y: box.y + 0.34, w: innerW });

  const fieldLines = engine.fields.map(
    (field) => `• ${field.label}: ${field.value || '—'}`,
  );

  slide.addText(fieldLines.join('\n'), {
    x: innerX,
    y: box.y + 0.4,
    w: innerW,
    h: box.h - 0.48,
    fontSize: 8,
    color: PPT_COLORS.text,
    valign: 'top',
    lineSpacingMultiple: 1.05,
  });
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
  slide.background = { color: PPT_COLORS.canvasBg };

  const marginX = 0.35;
  const contentW = 9.3;

  slide.addText('SPIKE ASC — Executive Canvas', {
    x: marginX,
    y: 0.18,
    w: contentW,
    h: 0.45,
    fontSize: 22,
    bold: true,
    color: PPT_COLORS.spike,
  });

  slide.addText(
    `${model.header.participantName} · ${model.header.careerTrackLabel} · ${model.header.dateUpdated}`,
    { x: marginX, y: 0.62, w: contentW, h: 0.28, fontSize: 11, color: PPT_COLORS.muted },
  );

  addCanvasLine(slide, { x: marginX, y: 0.95, w: contentW });

  const gridX = marginX;
  const gridY = 1.05;
  const gridW = contentW;
  const gridH = 3.45;
  const colW = gridW / 2 - 0.06;
  const rowH = gridH / 2 - 0.06;
  const gap = 0.12;

  addCanvasBox(pptx, slide, {
    x: gridX,
    y: gridY,
    w: gridW,
    h: gridH,
    fill: PPT_COLORS.white,
    lineWidth: 1.5,
  });

  const engines = model.engines ?? [];
  const engineLayout = [
    { engine: engines[0], x: gridX + gap, y: gridY + gap, w: colW, h: rowH },
    { engine: engines[2], x: gridX + colW + gap * 2, y: gridY + gap, w: colW, h: rowH },
    { engine: engines[1], x: gridX + gap, y: gridY + rowH + gap * 2, w: colW, h: rowH },
    { engine: engines[3], x: gridX + colW + gap * 2, y: gridY + rowH + gap * 2, w: colW, h: rowH },
  ];

  for (const slot of engineLayout) {
    if (!slot.engine) continue;
    addCanvasBox(pptx, slide, {
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      fill: PPT_COLORS.white,
    });
    addEngineBox(slide, slot.engine, slot);
  }

  slide.addShape('line', {
    x: gridX + gridW / 2,
    y: gridY,
    w: 0,
    h: gridH,
    line: { color: PPT_COLORS.border, width: 1 },
  });
  slide.addShape('line', {
    x: gridX,
    y: gridY + gridH / 2,
    w: gridW,
    h: 0,
    line: { color: PPT_COLORS.border, width: 1 },
  });

  const strategyY = 4.65;
  const strategyH = 0.95;
  addCanvasBox(pptx, slide, {
    x: marginX,
    y: strategyY,
    w: contentW,
    h: strategyH,
    fill: PPT_COLORS.spikeMuted,
    line: PPT_COLORS.borderStrong,
  });

  slide.addText('Overall Strategy', {
    x: marginX + 0.12,
    y: strategyY + 0.08,
    w: contentW - 0.24,
    h: 0.22,
    fontSize: 11,
    bold: true,
    color: PPT_COLORS.spike,
  });

  slide.addText(model.strategyStatement || '—', {
    x: marginX + 0.12,
    y: strategyY + 0.32,
    w: contentW - 0.24,
    h: strategyH - 0.4,
    fontSize: 9,
    color: PPT_COLORS.text,
    valign: 'top',
  });

  const prioritiesY = 5.72;
  addCanvasBox(pptx, slide, {
    x: marginX,
    y: prioritiesY,
    w: contentW,
    h: 0.42,
    fill: PPT_COLORS.white,
    line: PPT_COLORS.border,
    lineWidth: 1,
  });

  const priorityText = model.priorities.filter(Boolean).length
    ? model.priorities.filter(Boolean).map((p, i) => `${i + 1}. ${p}`).join('   ')
    : '90-Day Priorities: —';

  slide.addText(priorityText, {
    x: marginX + 0.12,
    y: prioritiesY + 0.08,
    w: contentW - 0.24,
    h: 0.28,
    fontSize: 9,
    color: PPT_COLORS.text,
    valign: 'middle',
  });

  const footerY = 6.22;
  addCanvasBox(pptx, slide, {
    x: marginX,
    y: footerY,
    w: contentW,
    h: 0.38,
    fill: PPT_COLORS.spike,
    line: PPT_COLORS.spike,
  });

  slide.addText(
    `SPIKE Venture Readiness Score: ${model.readiness.composite}/100   ·   Blueprint ${model.header.blueprintCompletion}%   ·   Canvas ${model.header.canvasCompletion}%`,
    {
      x: marginX + 0.12,
      y: footerY + 0.08,
      w: contentW - 0.24,
      h: 0.24,
      fontSize: 10,
      bold: true,
      color: PPT_COLORS.white,
      align: 'center',
    },
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
  pdf.text('Ambition & Impact', margin, y);
  y += 18;
  pdf.setFont('helvetica', 'normal');
  const ambitionPurposeLines = [
    ['Ambition', model.ambitionPurpose?.ambition ?? '—'],
    ['Impact', model.ambitionPurpose?.impact ?? model.ambitionPurpose?.purpose ?? '—'],
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
