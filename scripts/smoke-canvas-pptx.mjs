#!/usr/bin/env node
/**
 * End-to-end smoke test for Executive Canvas PPTX export.
 * Generates a deck from a fixture model, unpacks slide XML, and asserts
 * executive summary fields are present and within the 16:9 slide bounds.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { exportExecutiveCanvasPpt } from '../src/lib/canvasExportService.js';

const SLIDE_HEIGHT_IN = 5.625;
const EMU_PER_INCH = 914400;

const STRATEGY =
  'I will build a financial services business focused on my target market through comprehensive financial planning while developing future advisors and leaders who can expand organizational impact.';

/** Fixture mirrors Blueprint Summary UI with year goals filled, priorities empty. */
function buildFixtureModel() {
  return {
    header: {
      participantName: 'Smoke Test Intern',
      careerTrackLabel: 'Agency Builder',
      dateUpdated: 'Jun 7, 2026',
      blueprintCompletion: 42,
      canvasCompletion: 38,
      segment: 1,
      careerPosition: 'Advisor',
      ventureBoardStatus: 'Not started',
    },
    engines: [
      {
        key: 'client_growth',
        label: 'Client Growth Engine',
        fields: [{ key: 'customer_segments', label: 'Customer Segments', value: 'Young professionals' }],
      },
      {
        key: 'talent_growth',
        label: 'Talent Growth Engine',
        fields: [{ key: 'talent_segments', label: 'Talent Segments', value: 'Career changers' }],
      },
      {
        key: 'leadership_growth',
        label: 'Leadership Growth Engine',
        fields: [{ key: 'culture_statement', label: 'Culture Statement', value: 'Servant leadership' }],
      },
      {
        key: 'foundation',
        label: 'Foundation',
        fields: [{ key: 'key_resources', label: 'Key Resources', value: 'Mentor network' }],
      },
    ],
    strategyStatement: STRATEGY,
    priorities: ['', '', ''],
    yearAmbition: [
      { year: 'Year 1', goal: 'Build Client Base' },
      { year: 'Year 2', goal: 'Build Team' },
      { year: 'Year 3', goal: 'Build Leaders' },
    ],
    readiness: { composite: 35, dimensions: {} },
  };
}

/** @param {string} xml */
function extractSlideText(xml) {
  const texts = [];
  const re = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    if (match[1]) texts.push(match[1]);
  }
  return texts.join('\n');
}

/** @param {string} xml @returns {number[]} y positions in inches */
function extractTextYPositionsInches(xml) {
  const positions = [];
  const blocks = xml.split(/<p:sp>/);
  for (const block of blocks.slice(1)) {
    const textMatch = block.match(/<a:t[^>]*>([^<]+)<\/a:t>/);
    if (!textMatch) continue;
    const off = block.match(/<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"/);
    if (off) {
      positions.push({
        text: textMatch[1],
        yIn: Number(off[2]) / EMU_PER_INCH,
      });
    }
  }
  return positions;
}

function fail(message) {
  console.error(`smoke:canvas-pptx FAIL — ${message}`);
  process.exit(1);
}

const tmpDir = mkdtempSync(join(tmpdir(), 'spike-pptx-'));
const outPath = join(tmpDir, 'smoke-executive-canvas.pptx');

try {
  await exportExecutiveCanvasPpt(buildFixtureModel(), outPath);

  const zip = await JSZip.loadAsync(readFileSync(outPath));
  const slideEntry = zip.file('ppt/slides/slide1.xml');
  if (!slideEntry) fail('missing ppt/slides/slide1.xml');

  const slideXml = await slideEntry.async('string');
  const slideText = extractSlideText(slideXml);
  const yPositions = extractTextYPositionsInches(slideXml);

  const requiredStrings = [
    'SPIKE ASC — Executive Canvas',
    'Overall Strategy Statement',
    STRATEGY,
    '90-Day Priorities',
    '3-Year Ambition Snapshot',
    'Year 1',
    'Year 2',
    'Year 3',
    'Build Client Base',
    'Build Team',
    'Build Leaders',
    'SPIKE Venture Readiness Score',
    'Client Growth Engine',
    'Talent Growth Engine',
    'Leadership Growth Engine',
    'Foundation',
  ];

  for (const needle of requiredStrings) {
    if (!slideText.includes(needle)) {
      fail(`slide text missing "${needle}"`);
    }
  }

  if (!slideText.includes('—')) {
    fail('empty priorities should render em dash placeholders');
  }

  const offSlide = yPositions.filter((p) => p.yIn > SLIDE_HEIGHT_IN);
  if (offSlide.length > 0) {
    const sample = offSlide
      .slice(0, 3)
      .map((p) => `"${p.text}" @ y=${p.yIn.toFixed(2)}"`)
      .join(', ');
    fail(`${offSlide.length} text element(s) below slide (${SLIDE_HEIGHT_IN}") — e.g. ${sample}`);
  }

  const summaryLabels = yPositions.filter((p) =>
    ['Overall Strategy Statement', '90-Day Priorities', '3-Year Ambition Snapshot'].includes(p.text),
  );
  if (summaryLabels.length < 3) {
    fail(`expected 3 summary box labels on slide, found ${summaryLabels.length}`);
  }

  const maxSummaryY = Math.max(...summaryLabels.map((p) => p.yIn));
  if (maxSummaryY > 4.5) {
    fail(`summary row too low on slide (y=${maxSummaryY.toFixed(2)}")`);
  }

  const footer = yPositions.find((p) => p.text.includes('SPIKE Venture Readiness Score'));
  if (!footer) fail('footer readiness score missing from positioned text');
  if (footer.yIn + 0.34 > SLIDE_HEIGHT_IN) {
    fail(`footer clipped below slide (y=${footer.yIn.toFixed(2)}")`);
  }

  console.log('smoke:canvas-pptx OK — executive summary, year goals, engines, footer on slide');
  console.log(`  slide text blocks: ${yPositions.length}`);
  console.log(`  summary row y: ${maxSummaryY.toFixed(2)}"`);
  console.log(`  footer y: ${footer.yIn.toFixed(2)}"`);
  console.log(`  output: ${outPath}`);
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
