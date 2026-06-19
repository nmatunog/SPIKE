#!/usr/bin/env node
import { getStageGateDefinition, STAGE_GATE_BY_CLOSING_WEEK } from '../src/lib/stageGateCeremonyConstants.js';
import { stageGateKey, isStageGateUnlocked } from '../src/lib/stageGateCeremonyStorage.js';

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

const gate = getStageGateDefinition(1);
if (gate.nextWeek !== 2 || gate.stageLabel !== 'DISCOVER') {
  fail('week 1 gate definition mismatch');
}

if (!STAGE_GATE_BY_CLOSING_WEEK[2]?.stageLabel) {
  fail('week 2 gate definition missing');
}

if (stageGateKey(1, 1) !== '1-1') fail('stage gate key mismatch');
if (isStageGateUnlocked(1, 99)) fail('unexpected unlock for missing gate');

console.log('smoke-stage-gate-ceremony: ok');
