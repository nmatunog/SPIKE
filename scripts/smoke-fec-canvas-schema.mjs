#!/usr/bin/env node
/**
 * Smoke test — FEC Canvas v2 schema, migration map, and service layer (no UI).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

class MemoryStorage {
  constructor() {
    /** @type {Map<string, string>} */
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

globalThis.localStorage = new MemoryStorage();

function fail(message) {
  console.error(`smoke:fec-canvas-schema FAIL — ${message}`);
  process.exit(1);
}

const migrationPath = join(root, 'supabase/migrations/20260713_fec_canvas_v2.sql');
if (!existsSync(migrationPath)) fail('missing migration 20260713_fec_canvas_v2.sql');

const migrationSql = readFileSync(migrationPath, 'utf8');
for (const snippet of [
  'canvas_schema_version',
  'unified_venture_proposition',
  'create_value',
  'agency_talent',
  'scorecard_manual_overrides',
]) {
  if (!migrationSql.includes(snippet)) fail(`migration missing ${snippet}`);
}

const server = await createServer({ root, server: { middlewareMode: true }, logLevel: 'error' });

try {
  const constants = await server.ssrLoadModule('/src/lib/fecCanvasConstants.js');
  const migration = await server.ssrLoadModule('/src/lib/fecCanvasMigration.js');
  const service = await server.ssrLoadModule('/src/lib/fecCanvasService.js');

  if (constants.FEC_CANVAS_TITLE !== 'SPIKE Financial Entrepreneurship Canvas') {
    fail('FEC_CANVAS_TITLE mismatch');
  }

  const entryFields = constants.listFecV2EntryFields();
  if (entryFields.length < 20) fail(`expected 20+ v2 entry fields, got ${entryFields.length}`);

  const map = migration.FEC_V1_TO_V2_ENTRY_MAP;
  if (map.length < 12) fail('v1→v2 map too short');

  const testId = `smoke-fec-${Date.now()}`;
  const { saveCanvasField } = await server.ssrLoadModule('/src/lib/canvasService.js');
  const { saveCanvasSummary, getCanvasSummary } = await server.ssrLoadModule(
    '/src/lib/canvasSummaryService.js',
  );

  saveCanvasField(testId, 'client_growth', 'customer_segments', 'Young professionals in Cebu');
  saveCanvasField(testId, 'client_growth', 'value_proposition', 'Affordable protection plans');
  saveCanvasSummary(testId, {
    strategy_statement: 'Build a scalable advisory venture',
    year1_goal: 'First 50 clients',
    canvas_schema_version: 'v1',
  });

  const before = service.getCanvasSchemaVersion(testId);
  if (before !== 'v1') fail(`expected v1 before migrate, got ${before}`);

  const result = migration.migrateCanvasV1ToV2(testId);
  if (!result.migrated || result.copied < 2) fail(`migration copied too few fields: ${result.copied}`);

  const after = service.getCanvasSchemaVersion(testId);
  if (after !== 'v2') fail(`expected v2 after migrate, got ${after}`);

  const uvp = service.getFecUnifiedVentureProposition(testId);
  if (!uvp.includes('scalable advisory')) fail('UVP not migrated from strategy_statement');

  const segments = service.getFecField(testId, 'create_value', 'customer_segments');
  if (!segments.includes('Young professionals')) fail('customer_segments not migrated');

  const offering = service.getFecField(testId, 'create_value', 'value_offering');
  if (!offering.includes('Affordable protection')) fail('value_offering not migrated');

  const summary = getCanvasSummary(testId);
  if (summary.roadmap_12mo !== 'First 50 clients') fail('roadmap_12mo not migrated');

  const pct = service.computeFecCanvasCompletionPct(testId);
  if (pct <= 0) fail('FEC completion should be > 0 after migration');

  console.log(
    `smoke:fec-canvas-schema OK — ${entryFields.length} v2 fields, migration copied ${result.copied}, completion ${pct}%`,
  );
} finally {
  await server.close();
}
