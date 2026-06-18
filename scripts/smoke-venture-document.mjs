#!/usr/bin/env node
import {
  emptyVentureDocument,
  mergeVentureDocument,
  normalizeVentureDocument,
  ventureDocumentFromRow,
  ventureDocumentToRowPayload,
} from '../src/lib/ventureDocument.js';

function fail(message) {
  console.error(`smoke:venture-document FAIL — ${message}`);
  process.exit(1);
}

const empty = emptyVentureDocument();
if (!empty.identity || !empty.research || !empty.fec || !empty.pitch || !empty.stage) {
  fail('emptyVentureDocument should include all sections');
}

const merged = mergeVentureDocument(empty, {
  identity: { ventureName: 'Shield Squad Financial' },
  pitch: { readinessScore: 72 },
});
if (merged.identity.ventureName !== 'Shield Squad Financial' || merged.pitch.readinessScore !== 72) {
  fail('mergeVentureDocument should deep-merge sections');
}

const row = ventureDocumentFromRow({
  schema_version: '1',
  identity: { ventureName: 'From row' },
  research: { insights: [{ id: '1', text: 'Insight' }] },
});
if (row.identity.ventureName !== 'From row' || row.research.insights.length !== 1) {
  fail('ventureDocumentFromRow should normalize DB rows');
}

const payload = ventureDocumentToRowPayload(merged);
if (!payload.schema_version || !payload.identity) {
  fail('ventureDocumentToRowPayload should produce row columns');
}

const deduped = normalizeVentureDocument({
  research: { insights: 'not-an-array' },
  stage: { completedMilestones: null },
});
if (!Array.isArray(deduped.research.insights) || !Array.isArray(deduped.stage.completedMilestones)) {
  fail('normalizeVentureDocument should coerce array fields');
}

console.log('smoke:venture-document OK');
