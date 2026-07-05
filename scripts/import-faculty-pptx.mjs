#!/usr/bin/env node
/**
 * Import a faculty PPTX into SPIKE content:
 * - Copies PPTX to public/content/.../ when under Cloudflare Pages 25MB limit, else content/.../source/
 * - Extracts slide images + speaker notes
 * - Updates presentation.json (deck 01) or presentation-deck-02.json (deck 02)
 *
 * Usage:
 *   node scripts/import-faculty-pptx.mjs --pptx "/path/to/deck.pptx" --day day-1 --deck 1
 *   node scripts/import-faculty-pptx.mjs --pptx "/path/to/deck.pptx" --day day-1 --deck 2 --overwrite
 *
 * By default --overwrite replaces title/body/speaker notes/discussion questions from the PPTX.
 * Pass --preserve-text to keep existing JSON text when re-importing.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_PUBLIC_PPTX_BYTES = 25 * 1024 * 1024;

/** @param {string[]} argv */
function parseArgs(argv) {
  const args = {
    pptx: '',
    day: 'day-1',
    deck: 1,
    segment: 'segment-1',
    week: 'week-1',
    overwrite: true,
    preserveText: false,
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--pptx') args.pptx = argv[++i];
    else if (argv[i] === '--day') args.day = argv[++i];
    else if (argv[i] === '--deck') args.deck = Number(argv[++i]);
    else if (argv[i] === '--segment') args.segment = argv[++i];
    else if (argv[i] === '--week') args.week = argv[++i];
    else if (argv[i] === '--overwrite') args.overwrite = true;
    else if (argv[i] === '--preserve-text') {
      args.preserveText = true;
      args.overwrite = false;
    }
  }
  if (!args.pptx || !existsSync(args.pptx)) {
    console.error('import-faculty-pptx: --pptx path required and must exist');
    process.exit(1);
  }
  if (![1, 2].includes(args.deck)) {
    console.error('import-faculty-pptx: --deck must be 1 or 2');
    process.exit(1);
  }
  return args;
}

/** @param {string} xml */
function extractTextRuns(xml) {
  const withoutSlideNum = xml.replace(/<a:fld[^>]*type="slidenum"[^>]*>[\s\S]*?<\/a:fld>/gi, '');
  const parts = [];
  const re = /<a:t>([^<]*)<\/a:t>/g;
  let match;
  while ((match = re.exec(withoutSlideNum)) !== null) {
    const text = match[1].replace(/\s+/g, ' ').trim();
    if (text) parts.push(text);
  }
  return parts;
}

/** @param {string} extractDir @param {number} slideNum */
function readSlideText(extractDir, slideNum) {
  const path = join(extractDir, 'ppt', 'slides', `slide${slideNum}.xml`);
  if (!existsSync(path)) return { title: '', body: '' };
  const lines = extractTextRuns(readFileSync(path, 'utf8'));
  if (!lines.length) return { title: '', body: '' };
  return {
    title: lines[0],
    body: lines.slice(1).join('\n'),
  };
}

/** @param {string} extractDir @param {number} slideNum */
function slideImageFile(extractDir, slideNum) {
  const relsPath = join(extractDir, 'ppt', 'slides', '_rels', `slide${slideNum}.xml.rels`);
  const rels = readFileSync(relsPath, 'utf8');
  const target = rels.match(/relationships\/image" Target="\.\.\/media\/([^"]+)"/i)?.[1];
  return target ? join(extractDir, 'ppt', 'media', target) : null;
}

/** @param {string} extractDir @param {number} count */
function readSpeakerNotes(extractDir, count) {
  const notes = [];
  for (let i = 1; i <= count; i++) {
    const path = join(extractDir, 'ppt', 'notesSlides', `notesSlide${i}.xml`);
    notes.push(existsSync(path) ? extractTextRuns(readFileSync(path, 'utf8')).join('\n') : '');
  }
  return notes;
}

/** @param {number} count */
function countSlides(extractDir) {
  const dir = join(extractDir, 'ppt', 'slides');
  return readdirSync(dir).filter((f) => /^slide\d+\.xml$/.test(f)).length;
}

const args = parseArgs(process.argv);
const deckSlug = args.deck === 1 ? 'deck-01' : 'deck-02';
const publicDir = join(root, 'public', 'content', args.segment, args.week, args.day);
const imageDir = join(publicDir, deckSlug);
const pptxName = `faculty-${deckSlug}.pptx`;
const pptxDest = join(publicDir, pptxName);
const sourceDir = join(root, 'content', args.segment, args.week, args.day, 'source');
const sourcePptxDest = join(sourceDir, pptxName);
const jsonFile =
  args.deck === 1
    ? join(root, 'content', args.segment, args.week, args.day, 'presentation.json')
    : join(root, 'content', args.segment, args.week, args.day, 'presentation-deck-02.json');

mkdirSync(publicDir, { recursive: true });
mkdirSync(imageDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });

const tmp = mkdtempSync(join(tmpdir(), 'spike-import-pptx-'));
try {
  execSync(`unzip -q ${JSON.stringify(args.pptx)} -d ${JSON.stringify(tmp)}`);

  const slideCount = countSlides(tmp);
  if (!slideCount) {
    console.error('import-faculty-pptx: no slides found in PPTX');
    process.exit(1);
  }

  cpSync(args.pptx, sourcePptxDest);
  if (existsSync(pptxDest)) {
    rmSync(pptxDest, { force: true });
  }
  const speakerNotes = readSpeakerNotes(tmp, slideCount);

  const existing = JSON.parse(readFileSync(jsonFile, 'utf8'));
  const slides = [];

  for (let i = 1; i <= slideCount; i++) {
    const srcImage = slideImageFile(tmp, i);
    const imageName = `slide-${String(i).padStart(2, '0')}.png`;
    const imageDest = join(imageDir, imageName);
    if (srcImage && existsSync(srcImage)) {
      cpSync(srcImage, imageDest);
    }

    const prior = existing.slides?.[i - 1] ?? {};
    const extracted = readSlideText(tmp, i);
    const imageUrl = `/content/${args.segment}/${args.week}/${args.day}/${deckSlug}/${imageName}`;
    const deckId = deckSlug.replace('-', '');

    const notesFromPptx = speakerNotes[i - 1]?.trim() ?? '';
    slides.push({
      id: prior.id ?? `slide-${deckId}-${String(i).padStart(2, '0')}`,
      presentationId: existing.presentation?.id ?? `presentation-${args.day}-${deckSlug}`,
      sortOrder: i,
      title: args.overwrite
        ? (extracted.title || `Slide ${i}`)
        : (prior.title ?? extracted.title ?? `Slide ${i}`),
      body: args.overwrite ? (extracted.body ?? '') : (prior.body ?? extracted.body ?? ''),
      speakerNotes: args.overwrite
        ? notesFromPptx
        : (notesFromPptx || prior.speakerNotes || ''),
      discussionQuestions: args.overwrite ? [] : (prior.discussionQuestions ?? []),
      imageUrl,
    });
  }

  // Drop stale slide images when deck shrinks.
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
    sourceFile: pptxName,
    sourcePath: `${contentBase}/source/${pptxName}`,
    importedAt: new Date().toISOString(),
  };
  presentationMeta.pptxUrl = `/api/coach/faculty-deck/${args.segment}/${args.week}/${args.day}/${pptxName}`;
  delete presentationMeta.deployNote;

  const next = {
    presentation: presentationMeta,
    slides,
  };

  writeFileSync(jsonFile, `${JSON.stringify(next, null, 2)}\n`);

  console.log('import-faculty-pptx OK');
  console.log(`  pptx source: ${sourcePptxDest}`);
  console.log(`  pptx download: ${presentationMeta.pptxUrl} (staff API — not public)`);
  console.log(`  images: ${slideCount} → ${imageDir}`);
  console.log(`  json: ${jsonFile}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
