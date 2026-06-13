#!/usr/bin/env node
/**
 * Import a faculty PPTX into SPIKE content:
 * - Copies PPTX to public/content/.../
 * - Extracts slide images + speaker notes
 * - Updates presentation.json (deck 01) or presentation-deck-02.json (deck 02)
 *
 * Usage:
 *   node scripts/import-faculty-pptx.mjs --pptx "/path/to/deck.pptx" --day day-1 --deck 1
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @param {string[]} argv */
function parseArgs(argv) {
  const args = { pptx: '', day: 'day-1', deck: 1, segment: 'segment-1', week: 'week-1' };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--pptx') args.pptx = argv[++i];
    else if (argv[i] === '--day') args.day = argv[++i];
    else if (argv[i] === '--deck') args.deck = Number(argv[++i]);
    else if (argv[i] === '--segment') args.segment = argv[++i];
    else if (argv[i] === '--week') args.week = argv[++i];
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
  return parts.join('\n');
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
    notes.push(existsSync(path) ? extractTextRuns(readFileSync(path, 'utf8')) : '');
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
const jsonFile =
  args.deck === 1
    ? join(root, 'content', args.segment, args.week, args.day, 'presentation.json')
    : join(root, 'content', args.segment, args.week, args.day, 'presentation-deck-02.json');

mkdirSync(publicDir, { recursive: true });
mkdirSync(imageDir, { recursive: true });

const tmp = mkdtempSync(join(tmpdir(), 'spike-import-pptx-'));
try {
  execSync(`unzip -q ${JSON.stringify(args.pptx)} -d ${JSON.stringify(tmp)}`);

  const slideCount = countSlides(tmp);
  if (!slideCount) {
    console.error('import-faculty-pptx: no slides found in PPTX');
    process.exit(1);
  }

  cpSync(args.pptx, pptxDest);
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
    const imageUrl = `/content/${args.segment}/${args.week}/${args.day}/${deckSlug}/${imageName}`;

    slides.push({
      id: prior.id ?? `slide-${deckSlug}-${String(i).padStart(2, '0')}`,
      presentationId: existing.presentation?.id ?? `presentation-${args.day}-${deckSlug}`,
      sortOrder: i,
      title: prior.title ?? `Slide ${i}`,
      body: prior.body ?? '',
      speakerNotes: speakerNotes[i - 1] || prior.speakerNotes || '',
      discussionQuestions: prior.discussionQuestions ?? [],
      imageUrl,
    });
  }

  const slideIds = slides.map((s) => s.id);
  const next = {
    presentation: {
      ...existing.presentation,
      slideIds,
      pptxUrl: `/content/${args.segment}/${args.week}/${args.day}/${pptxName}`,
      sourceFile: pptxName,
      importedAt: new Date().toISOString(),
    },
    slides,
  };

  writeFileSync(jsonFile, `${JSON.stringify(next, null, 2)}\n`);

  console.log('import-faculty-pptx OK');
  console.log(`  pptx: ${pptxDest}`);
  console.log(`  images: ${slideCount} → ${imageDir}`);
  console.log(`  json: ${jsonFile}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
