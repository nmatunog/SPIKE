#!/usr/bin/env node
/**
 * Import a faculty PDF into SPIKE content:
 * - Copies PDF to public/content/.../ when under Cloudflare Pages 25MB limit, else content/.../source/
 * - Renders each page to PNG (requires Python 3 + PyMuPDF: pip install pymupdf)
 * - Updates presentation.json (deck 01) or presentation-deck-02.json (deck 02)
 *
 * Usage:
 *   node scripts/import-faculty-pdf.mjs --pdf "/path/to/deck.pdf" --day day-2 --deck 1
 *   node scripts/import-faculty-pdf.mjs --pdf "/path/to/deck.pdf" --day day-2 --deck 1 --preserve-text
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_PUBLIC_BYTES = 25 * 1024 * 1024;

/** @param {string[]} argv */
function parseArgs(argv) {
  const args = {
    pdf: '',
    day: 'day-1',
    deck: 1,
    segment: 'segment-1',
    week: 'week-1',
    overwrite: true,
    preserveText: false,
    dpi: 150,
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--pdf') args.pdf = argv[++i];
    else if (argv[i] === '--day') args.day = argv[++i];
    else if (argv[i] === '--deck') args.deck = Number(argv[++i]);
    else if (argv[i] === '--segment') args.segment = argv[++i];
    else if (argv[i] === '--week') args.week = argv[++i];
    else if (argv[i] === '--dpi') args.dpi = Number(argv[++i]);
    else if (argv[i] === '--overwrite') args.overwrite = true;
    else if (argv[i] === '--preserve-text') {
      args.preserveText = true;
      args.overwrite = false;
    }
  }
  if (!args.pdf || !existsSync(args.pdf)) {
    console.error('import-faculty-pdf: --pdf path required and must exist');
    process.exit(1);
  }
  if (![1, 2].includes(args.deck)) {
    console.error('import-faculty-pdf: --deck must be 1 or 2');
    process.exit(1);
  }
  return args;
}

/** @param {string} pdfPath @param {string} imageDir @param {number} dpi */
function renderPdfPages(pdfPath, imageDir, dpi) {
  const py = `
import sys, fitz
pdf_path, out_dir, dpi = sys.argv[1], sys.argv[2], int(sys.argv[3])
doc = fitz.open(pdf_path)
zoom = dpi / 72.0
mat = fitz.Matrix(zoom, zoom)
for i in range(doc.page_count):
    page = doc.load_page(i)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    pix.save(f"{out_dir}/slide-{str(i + 1).zfill(2)}.png")
print(doc.page_count)
`;
  const out = execFileSync('python3', ['-c', py, pdfPath, imageDir, String(dpi)], {
    encoding: 'utf8',
  }).trim();
  const count = Number(out.split('\n').pop());
  if (!count) {
    console.error('import-faculty-pdf: no pages rendered — install PyMuPDF: pip install pymupdf');
    process.exit(1);
  }
  return count;
}

/** @param {string} pdfPath @param {number} pageIndex */
function extractPageText(pdfPath, pageIndex) {
  const py = `
import sys, fitz
doc = fitz.open(sys.argv[1])
page = doc.load_page(int(sys.argv[2]))
lines = [ln.strip() for ln in page.get_text().splitlines() if ln.strip()]
print(lines[0] if lines else '')
print('|||')
print('\\n'.join(lines[1:]) if len(lines) > 1 else '')
`;
  try {
    const out = execFileSync('python3', ['-c', py, pdfPath, String(pageIndex)], { encoding: 'utf8' });
    const [title, body] = out.split('|||').map((s) => s.trim());
    return { title, body };
  } catch {
    return { title: '', body: '' };
  }
}

const args = parseArgs(process.argv);
const deckSlug = args.deck === 1 ? 'deck-01' : 'deck-02';
const publicDir = join(root, 'public', 'content', args.segment, args.week, args.day);
const imageDir = join(publicDir, deckSlug);
const pdfName = `faculty-${deckSlug}.pdf`;
const pdfDest = join(publicDir, pdfName);
const sourceDir = join(root, 'content', args.segment, args.week, args.day, 'source');
const sourcePdfDest = join(sourceDir, pdfName);
const jsonFile =
  args.deck === 1
    ? join(root, 'content', args.segment, args.week, args.day, 'presentation.json')
    : join(root, 'content', args.segment, args.week, args.day, 'presentation-deck-02.json');

mkdirSync(publicDir, { recursive: true });
mkdirSync(imageDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });

cpSync(args.pdf, sourcePdfDest);
if (existsSync(pdfDest)) {
  rmSync(pdfDest, { force: true });
}

const slideCount = renderPdfPages(args.pdf, imageDir, args.dpi);
const existing = JSON.parse(readFileSync(jsonFile, 'utf8'));
const slides = [];

for (let i = 1; i <= slideCount; i++) {
  const prior = existing.slides?.[i - 1] ?? {};
  const extracted = extractPageText(args.pdf, i - 1);
  const imageName = `slide-${String(i).padStart(2, '0')}.png`;
  const imageUrl = `/content/${args.segment}/${args.week}/${args.day}/${deckSlug}/${imageName}`;

  const dayCode = args.day.replace('day-', 'd');
  const deckNum = String(args.deck).padStart(2, '0');

  slides.push({
    id: prior.id ?? `slide-${dayCode}-${deckNum}-${String(i).padStart(2, '0')}`,
    presentationId: existing.presentation?.id ?? `presentation-${args.day}-${deckSlug}`,
    sortOrder: i,
    title: args.overwrite
      ? (extracted.title || prior.title || `Slide ${i}`)
      : (prior.title ?? extracted.title ?? `Slide ${i}`),
    body: args.overwrite ? (extracted.body ?? prior.body ?? '') : (prior.body ?? extracted.body ?? ''),
    speakerNotes: prior.speakerNotes ?? '',
    discussionQuestions: prior.discussionQuestions ?? [],
    imageUrl,
  });
}

for (const file of readdirSync(imageDir)) {
  const match = file.match(/^slide-(\d+)\.png$/);
  if (match && Number(match[1]) > slideCount) {
    rmSync(join(imageDir, file), { force: true });
  }
}

const slideIds = slides.map((s) => s.id);
const contentBase = `content/${args.segment}/${args.week}/${args.day}`;
/** @type {Record<string, unknown>} */
const presentationMeta = {
  ...existing.presentation,
  slideIds,
  sourceFile: pdfName,
  sourcePath: `${contentBase}/source/${pdfName}`,
  importedAt: new Date().toISOString(),
};
delete presentationMeta.pptxUrl;
presentationMeta.pdfUrl = `/api/coach/faculty-deck/${args.segment}/${args.week}/${args.day}/${pdfName}`;
delete presentationMeta.deployNote;

writeFileSync(jsonFile, `${JSON.stringify({ presentation: presentationMeta, slides }, null, 2)}\n`);

console.log('import-faculty-pdf OK');
console.log(`  pdf source: ${sourcePdfDest}`);
console.log(`  pdf download: ${presentationMeta.pdfUrl} (staff API — not public)`);
console.log(`  images: ${slideCount} → ${imageDir}`);
console.log(`  json: ${jsonFile}`);
