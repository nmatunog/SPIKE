#!/usr/bin/env node
/**
 * Smoke test for deterministic ambition composer (no AI, no browser).
 */
import {
  composeAmbitionStatement,
  composeAmbitionVariants,
  normalizeCoachStatement,
  statementTokenSimilarity,
} from '../src/lib/ventureCoachComposer.js';

function fail(message) {
  console.error(`smoke:coach-compose FAIL — ${message}`);
  process.exit(1);
}

const ranked = ['leadership', 'building_team', 'legacy'];
const role = 'agency_director';

const internA = composeAmbitionStatement({
  rankedKeywordIds: ranked,
  roleArchetypeId: role,
  variant: 'balanced',
  tone: 'balanced',
  patternSeed: 0,
  participantSeed: 'intern-a',
});

const internB = composeAmbitionStatement({
  rankedKeywordIds: ranked,
  roleArchetypeId: role,
  variant: 'balanced',
  tone: 'balanced',
  patternSeed: 0,
  participantSeed: 'intern-b',
});

if (!internA || internA.length < 20) fail('composed statement too short');
if (internA === internB) fail('different participant seeds should produce different default statements');
if (/typo|asdf|lol/i.test(internA)) fail('composed statement should use curated phrases only');

const variants = composeAmbitionVariants({
  rankedKeywordIds: ranked,
  roleArchetypeId: role,
  tone: 'leadership_forward',
  patternSeed: 1,
  participantSeed: 'intern-a',
});

for (const key of ['short', 'balanced', 'inspirational']) {
  if (!variants[key]) fail(`missing variant ${key}`);
}

const normalized = normalizeCoachStatement(variants.balanced);
if (!normalized.includes('become')) fail('normalized statement missing expected verb');

const similarity = statementTokenSimilarity(internA, internB);
if (similarity > 0.95) fail(`statements too similar (${similarity})`);

console.log('smoke:coach-compose OK');
console.log(`  intern A: ${internA}`);
console.log(`  intern B: ${internB}`);
