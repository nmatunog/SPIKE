/**
 * Fillable Revalida panel rating PDF — one page per squad, mirrors web layout.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  REVALIDA_CRITERIA,
  REVALIDA_RATING_OPTIONS,
  REVALIDA_RECOMMENDATIONS,
} from './raSpikeRevalidaRatingSchema.js';

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 36;
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
 * @param {import('pdf-lib').PDFForm} form
 * @param {import('pdf-lib').PDFPage} page
 * @param {string} prefix
 * @param {import('pdf-lib').PDFFont} font
 * @param {import('pdf-lib').PDFFont} fontBold
 * @param {string} cohortName
 * @param {{ name?: string }} squad
 */
function drawRatingCard(form, page, prefix, font, fontBold, cohortName, squad) {
  let y = PAGE_H - MARGIN;
  const squadName = squad.name?.trim() ?? '';

  page.drawText('RA-SPIKE', {
    x: MARGIN,
    y,
    size: 7,
    font: fontBold,
    color: SPIKE,
  });
  page.drawText('REVALIDA PANEL RATING', {
    x: MARGIN,
    y: y - 16,
    size: 14,
    font: fontBold,
    color: SLATE_900,
  });
  if (cohortName) {
    page.drawText(cohortName, {
      x: PAGE_W - MARGIN - fontBold.widthOfTextAtSize(cohortName, 8),
      y: y - 2,
      size: 8,
      font: fontBold,
      color: SPIKE,
    });
  }
  if (squadName) {
    const squadText = `Squad: ${squadName}`;
    page.drawText(squadText, {
      x: PAGE_W - MARGIN - font.widthOfTextAtSize(squadText, 7.5),
      y: y - 14,
      size: 7.5,
      font,
      color: SLATE_600,
    });
  }
  page.drawLine({
    start: { x: MARGIN, y: y - 24 },
    end: { x: PAGE_W - MARGIN, y: y - 24 },
    thickness: 1,
    color: SLATE_300,
  });
  y -= 34;

  page.drawRectangle({
    x: MARGIN,
    y: y - 46,
    width: PAGE_W - MARGIN * 2,
    height: 46,
    borderColor: SLATE_300,
    borderWidth: 1,
    color: SLATE_100,
  });
  page.drawText('PANELIST', {
    x: MARGIN + 8,
    y: y - 10,
    size: 6.5,
    font: fontBold,
    color: SPIKE,
  });
  page.drawText('Name', {
    x: MARGIN + 8,
    y: y - 22,
    size: 7,
    font: fontBold,
    color: SLATE_900,
  });
  form.createTextField(`${prefix}.panelist_name`).addToPage(page, {
    x: MARGIN + 8,
    y: y - 40,
    width: 220,
    height: 16,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  page.drawText('Organization', {
    x: MARGIN + 240,
    y: y - 22,
    size: 7,
    font: fontBold,
    color: SLATE_900,
  });
  form.createTextField(`${prefix}.panelist_org`).addToPage(page, {
    x: MARGIN + 240,
    y: y - 40,
    width: PAGE_W - MARGIN * 2 - 248,
    height: 16,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  y -= 56;

  if (!squadName) {
    page.drawText('Squad', {
      x: MARGIN,
      y: y - 10,
      size: 7,
      font: fontBold,
      color: SLATE_900,
    });
    form.createTextField(`${prefix}.squad_name`).addToPage(page, {
      x: MARGIN + 42,
      y: y - 24,
      width: 180,
      height: 16,
      borderColor: SLATE_300,
      backgroundColor: rgb(1, 1, 1),
    });
    y -= 32;
  } else {
    page.drawRectangle({
      x: MARGIN,
      y: y - 20,
      width: Math.min(fontBold.widthOfTextAtSize(squadName, 9) + 16, 240),
      height: 18,
      color: SLATE_100,
      borderColor: SLATE_300,
      borderWidth: 1,
    });
    page.drawText(squadName, {
      x: MARGIN + 8,
      y: y - 14,
      size: 9,
      font: fontBold,
      color: SPIKE,
    });
    y -= 28;
  }

  page.drawText('SCORING', {
    x: MARGIN,
    y,
    size: 9,
    font: fontBold,
    color: SLATE_900,
  });
  y -= 14;

  for (const criterion of REVALIDA_CRITERIA) {
    const options = REVALIDA_RATING_OPTIONS[criterion.key];
    const shortTitle = criterion.title.replace(' & ', ' / ');
    page.drawText(`${shortTitle} (${criterion.max})`, {
      x: MARGIN,
      y,
      size: 7.5,
      font: fontBold,
      color: SLATE_900,
    });

    const radioGroup = form.createRadioGroup(`${prefix}.${criterion.key}`);
    const optionY = y - 14;
    const optionGap = (PAGE_W - MARGIN * 2) / options.length;
    options.forEach((value, optionIndex) => {
      const label = String(value);
      const x = MARGIN + optionIndex * optionGap;
      radioGroup.addOptionToPage(label, page, {
        x,
        y: optionY - 10,
        width: 10,
        height: 10,
      });
      page.drawText(label, {
        x: x + 13,
        y: optionY - 8,
        size: 8,
        font: fontBold,
        color: SLATE_900,
      });
    });

    y = optionY - 20;
  }

  page.drawRectangle({
    x: MARGIN,
    y: y - 22,
    width: PAGE_W - MARGIN * 2,
    height: 22,
    borderColor: SPIKE,
    borderWidth: 1,
    color: SLATE_100,
  });
  page.drawText('TOTAL SCORE', {
    x: MARGIN + 8,
    y: y - 14,
    size: 7,
    font: fontBold,
    color: SLATE_600,
  });
  form.createTextField(`${prefix}.total_score`).addToPage(page, {
    x: PAGE_W / 2 - 24,
    y: y - 18,
    width: 48,
    height: 14,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  page.drawText('/ 100', {
    x: PAGE_W / 2 + 28,
    y: y - 15,
    size: 9,
    font: fontBold,
    color: SLATE_600,
  });
  y -= 32;

  page.drawText('FEEDBACK', {
    x: MARGIN,
    y,
    size: 9,
    font: fontBold,
    color: SLATE_900,
  });
  y -= 12;

  const colGap = 12;
  const colW = (PAGE_W - MARGIN * 2 - colGap) / 2;
  const fieldH = 40;

  page.drawText('Greatest Strength', {
    x: MARGIN,
    y,
    size: 7,
    font: fontBold,
    color: SLATE_900,
  });
  page.drawText('Most Important Improvement', {
    x: MARGIN + colW + colGap,
    y,
    size: 7,
    font: fontBold,
    color: SLATE_900,
  });
  y -= 10;

  const strengthField = form.createTextField(`${prefix}.greatest_strength`);
  strengthField.enableMultiline();
  strengthField.addToPage(page, {
    x: MARGIN,
    y: y - fieldH,
    width: colW,
    height: fieldH,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  const improvementField = form.createTextField(`${prefix}.improvement`);
  improvementField.enableMultiline();
  improvementField.addToPage(page, {
    x: MARGIN + colW + colGap,
    y: y - fieldH,
    width: colW,
    height: fieldH,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });
  y -= fieldH + 14;

  page.drawText('Final Recommendation', {
    x: MARGIN,
    y,
    size: 7,
    font: fontBold,
    color: SLATE_900,
  });
  const recGroup = form.createRadioGroup(`${prefix}.recommendation`);
  let recX = MARGIN;
  const recY = y - 12;
  REVALIDA_RECOMMENDATIONS.forEach((option) => {
    recGroup.addOptionToPage(option.value, page, {
      x: recX,
      y: recY - 9,
      width: 9,
      height: 9,
    });
    page.drawText(option.label, {
      x: recX + 12,
      y: recY - 7,
      size: 6.5,
      font,
      color: SLATE_900,
    });
    recX += font.widthOfTextAtSize(option.label, 6.5) + 24;
  });
  y = recY - 22;

  page.drawText('Standout Participant (optional)', {
    x: MARGIN,
    y,
    size: 7,
    font: fontBold,
    color: SLATE_900,
  });
  form.createTextField(`${prefix}.standout_participant`).addToPage(page, {
    x: MARGIN,
    y: y - 16,
    width: PAGE_W - MARGIN * 2,
    height: 14,
    borderColor: SLATE_300,
    backgroundColor: rgb(1, 1, 1),
  });

  page.drawText('Submit online: portal.1cma.online/ra-spike/revalida-rating', {
    x: MARGIN,
    y: MARGIN - 6,
    size: 6.5,
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
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    drawRatingCard(form, page, `s${index + 1}`, font, fontBold, cohortName, squads[index]);
  }

  form.updateFieldAppearances(font);
  const bytes = await pdfDoc.save();
  const slug = cohortName
    ? cohortName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : 'revalida';
  triggerPdfDownload(bytes, options.filename ?? `ra-spike-${slug}-panel-rating.pdf`);
}
