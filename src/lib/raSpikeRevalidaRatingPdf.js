/**
 * Fillable Revalida panel rating PDF — mirrors the web rating card layout.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  REVALIDA_CRITERIA,
  REVALIDA_RATING_OPTIONS,
  REVALIDA_RECOMMENDATIONS,
} from './raSpikeRevalidaRatingSchema.js';

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 40;
const SPIKE = rgb(0.725, 0.11, 0.11);
const SLATE_900 = rgb(0.059, 0.09, 0.165);
const SLATE_600 = rgb(0.278, 0.333, 0.412);
const SLATE_300 = rgb(0.796, 0.835, 0.882);
const SLATE_100 = rgb(0.945, 0.961, 0.976);

/** @param {Uint8Array} bytes @param {string} filename */
function triggerPdfDownload(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {import('pdf-lib').PDFPage} page
 * @param {import('pdf-lib').PDFFont} fontBold
 * @param {import('pdf-lib').PDFFont} font
 * @param {number} y
 * @param {string} cohortName
 * @param {string} [squadName]
 */
function drawPageHeader(page, fontBold, font, y, cohortName, squadName) {
  page.drawText('RA-SPIKE', {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: SPIKE,
  });
  page.drawText('REVALIDA PANEL RATING', {
    x: MARGIN,
    y: y - 22,
    size: 18,
    font: fontBold,
    color: SLATE_900,
  });
  if (cohortName) {
    page.drawText(cohortName, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(cohortName, 9),
      y: y - 8,
      size: 9,
      font: fontBold,
      color: SPIKE,
    });
  }
  if (squadName) {
    const squadText = `Squad: ${squadName}`;
    page.drawText(squadText, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(squadText, 8),
      y: y - 22,
      size: 8,
      font,
      color: SLATE_600,
    });
  }
  page.drawLine({
    start: { x: MARGIN, y: y - 32 },
    end: { x: PAGE_W - MARGIN, y: y - 32 },
    thickness: 1,
    color: SLATE_300,
  });
  return y - 48;
}

/**
 * @param {import('pdf-lib').PDFForm} form
 * @param {import('pdf-lib').PDFPage} page
 * @param {string} prefix
 * @param {import('pdf-lib').PDFFont} font
 * @param {import('pdf-lib').PDFFont} fontBold
 * @param {number} startY
 * @param {{ name?: string }} squad
 */
function drawScoringPage(form, page, prefix, font, fontBold, startY, squad) {
  let y = startY;

  page.drawRectangle({
    x: MARGIN,
    y: y - 68,
    width: PAGE_W - MARGIN * 2,
    height: 68,
    borderColor: SLATE_300,
    borderWidth: 1,
    color: SLATE_100,
  });
  page.drawText('PANELIST', {
    x: MARGIN + 10,
    y: y - 14,
    size: 7,
    font: fontBold,
    color: SPIKE,
  });
  page.drawText('Your name', {
    x: MARGIN + 10,
    y: y - 28,
    size: 8,
    font: fontBold,
    color: SLATE_900,
  });
  form.createTextField(`${prefix}.panelist_name`).addToPage(page, {
    x: MARGIN + 10,
    y: y - 58,
    width: 240,
    height: 22,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  page.drawText('Organization (optional)', {
    x: MARGIN + 270,
    y: y - 28,
    size: 8,
    font: fontBold,
    color: SLATE_900,
  });
  form.createTextField(`${prefix}.panelist_org`).addToPage(page, {
    x: MARGIN + 270,
    y: y - 58,
    width: PAGE_W - MARGIN * 2 - 280,
    height: 22,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  y -= 82;

  page.drawText('SQUAD', {
    x: MARGIN,
    y,
    size: 7,
    font: fontBold,
    color: SPIKE,
  });
  page.drawText('Which pitch are you rating?', {
    x: MARGIN,
    y: y - 16,
    size: 11,
    font: fontBold,
    color: SLATE_900,
  });
  const squadLabel = squad.name?.trim();
  if (squadLabel) {
    page.drawRectangle({
      x: MARGIN,
      y: y - 44,
      width: Math.min(fontBold.widthOfTextAtSize(squadLabel, 10) + 20, 260),
      height: 22,
      color: SLATE_100,
      borderColor: SLATE_300,
      borderWidth: 1,
    });
    page.drawText(squadLabel, {
      x: MARGIN + 10,
      y: y - 36,
      size: 10,
      font: fontBold,
      color: SPIKE,
    });
  } else {
    form.createTextField(`${prefix}.squad_name`).addToPage(page, {
      x: MARGIN,
      y: y - 44,
      width: 220,
      height: 22,
      borderColor: SLATE_300,
      backgroundColor: rgb(1, 1, 1),
    });
  }
  y -= 58;

  page.drawText('SCORING', {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: SLATE_900,
  });
  y -= 18;

  for (const criterion of REVALIDA_CRITERIA) {
    const options = REVALIDA_RATING_OPTIONS[criterion.key];
    page.drawText(`${criterion.title} (Max: ${criterion.max})`, {
      x: MARGIN,
      y,
      size: 9,
      font: fontBold,
      color: SLATE_900,
    });
    let descY = y - 12;
    for (const line of wrapText(criterion.description, 88)) {
      page.drawText(line, {
        x: MARGIN,
        y: descY,
        size: 7.5,
        font,
        color: SLATE_600,
      });
      descY -= 10;
    }

    const radioGroup = form.createRadioGroup(`${prefix}.${criterion.key}`);
    const optionY = descY - 6;
    const optionGap = (PAGE_W - MARGIN * 2 - 20) / options.length;
    options.forEach((value, optionIndex) => {
      const label = String(value);
      const x = MARGIN + optionIndex * optionGap;
      radioGroup.addOptionToPage(label, page, {
        x,
        y: optionY - 14,
        width: 12,
        height: 12,
      });
      page.drawText(label, {
        x: x + 16,
        y: optionY - 12,
        size: 9,
        font: fontBold,
        color: SLATE_900,
      });
    });

    page.drawText('NEEDS WORK', {
      x: MARGIN,
      y: optionY - 28,
      size: 6.5,
      font,
      color: SLATE_600,
    });
    page.drawText('OUTSTANDING', {
      x: PAGE_W - MARGIN - 52,
      y: optionY - 28,
      size: 6.5,
      font,
      color: SLATE_600,
    });

    y = optionY - 38;
  }

  page.drawRectangle({
    x: MARGIN,
    y: y - 34,
    width: PAGE_W - MARGIN * 2,
    height: 34,
    borderColor: SPIKE,
    borderWidth: 1.5,
    color: SLATE_100,
  });
  page.drawText('TOTAL SCORE', {
    x: MARGIN + 10,
    y: y - 14,
    size: 7,
    font: fontBold,
    color: SLATE_600,
  });
  form.createTextField(`${prefix}.total_score`).addToPage(page, {
    x: PAGE_W / 2 - 30,
    y: y - 28,
    width: 60,
    height: 18,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  page.drawText('/ 100', {
    x: PAGE_W / 2 + 36,
    y: y - 24,
    size: 10,
    font: fontBold,
    color: SLATE_600,
  });
}

/**
 * @param {import('pdf-lib').PDFForm} form
 * @param {import('pdf-lib').PDFPage} page
 * @param {string} prefix
 * @param {import('pdf-lib').PDFFont} font
 * @param {import('pdf-lib').PDFFont} fontBold
 * @param {number} startY
 */
function drawFeedbackPage(form, page, prefix, font, fontBold, startY) {
  let y = startY;

  page.drawText('FEEDBACK', {
    x: MARGIN,
    y,
    size: 11,
    font: fontBold,
    color: SLATE_900,
  });
  y -= 16;

  page.drawText('Greatest Strength', {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: SLATE_900,
  });
  const strengthField = form.createTextField(`${prefix}.greatest_strength`);
  strengthField.enableMultiline();
  strengthField.addToPage(page, {
    x: MARGIN,
    y: y - 72,
    width: PAGE_W - MARGIN * 2,
    height: 64,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  y -= 86;

  page.drawText('Most Important Improvement', {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: SLATE_900,
  });
  const improvementField = form.createTextField(`${prefix}.improvement`);
  improvementField.enableMultiline();
  improvementField.addToPage(page, {
    x: MARGIN,
    y: y - 72,
    width: PAGE_W - MARGIN * 2,
    height: 64,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  y -= 86;

  page.drawText('Final Recommendation', {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: SLATE_900,
  });
  const recGroup = form.createRadioGroup(`${prefix}.recommendation`);
  let recY = y - 18;
  REVALIDA_RECOMMENDATIONS.forEach((option) => {
    recGroup.addOptionToPage(option.value, page, {
      x: MARGIN,
      y: recY - 12,
      width: 11,
      height: 11,
    });
    page.drawText(option.label, {
      x: MARGIN + 16,
      y: recY - 10,
      size: 8.5,
      font,
      color: SLATE_900,
    });
    recY -= 22;
  });
  y = recY - 6;

  page.drawText('Standout Participant (optional)', {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: SLATE_900,
  });
  form.createTextField(`${prefix}.standout_participant`).addToPage(page, {
    x: MARGIN,
    y: y - 24,
    width: PAGE_W - MARGIN * 2,
    height: 20,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });

  page.drawText('Submit scores online at portal.1cma.online/ra-spike/revalida-rating', {
    x: MARGIN,
    y: MARGIN - 8,
    size: 7,
    font,
    color: SLATE_600,
  });
}

/**
 * @param {{
 *   squads?: Array<{ name?: string }>,
 *   cohortName?: string,
 *   filename?: string,
 * }} options
 */
export async function downloadRevalidaRatingPdf(options = {}) {
  const squads = options.squads?.length ? options.squads : [{ name: '' }];
  const cohortName = options.cohortName?.trim() ?? '';
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle('RA-SPIKE Revalida Panel Rating');
  pdfDoc.setAuthor('RA-SPIKE');
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (let index = 0; index < squads.length; index += 1) {
    const squad = squads[index];
    const prefix = `s${index + 1}`;
    const squadName = squad.name?.trim() ?? '';

    const scorePage = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const scoreStartY = drawPageHeader(
      scorePage,
      fontBold,
      font,
      PAGE_H - MARGIN,
      cohortName,
      squadName,
    );
    drawScoringPage(form, scorePage, prefix, font, fontBold, scoreStartY, squad);

    const feedbackPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
    const feedbackStartY = drawPageHeader(
      feedbackPage,
      fontBold,
      font,
      PAGE_H - MARGIN,
      cohortName,
      squadName,
    );
    drawFeedbackPage(form, feedbackPage, prefix, font, fontBold, feedbackStartY);
  }

  form.updateFieldAppearances(font);
  const bytes = await pdfDoc.save();
  const slug = cohortName
    ? cohortName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : 'revalida';
  triggerPdfDownload(bytes, options.filename ?? `ra-spike-${slug}-panel-rating.pdf`);
}

/** @param {string} text @param {number} maxChars */
function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}
