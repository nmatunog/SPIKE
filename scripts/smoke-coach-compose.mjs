#!/usr/bin/env node
/**
 * Smoke test for deterministic ambition composer (no AI, no browser).
 */
import {
  composeAmbitionStatement,
  composeAmbitionVariants,
  composeFutureSelfSummary,
  composeImpactStatement,
  normalizeCoachStatement,
  statementTokenSimilarity,
} from '../src/lib/ventureCoachComposer.js';
import { CUSTOM_ROLE_ARCHETYPE_ID, sanitizeCustomRolePhrase } from '../src/lib/ventureCoachPhraseBank.js';

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
if (!normalized.includes('ambition') || !/\bbe\b/.test(normalized)) {
  fail('normalized statement missing expected ambition framing');
}

const similarity = statementTokenSimilarity(internA, internB);
if (similarity > 0.95) fail(`statements too similar (${similarity})`);

const customRole = sanitizeCustomRolePhrase('Wealth Strategist');
if (!customRole.valid) fail('custom role phrase should validate');
const customStatement = composeAmbitionStatement({
  rankedKeywordIds: ranked,
  roleArchetypeId: CUSTOM_ROLE_ARCHETYPE_ID,
  customRolePhrase: customRole.phrase,
  variant: 'balanced',
  tone: 'balanced',
  patternSeed: 0,
  participantSeed: 'intern-custom',
});
if (!customStatement.toLowerCase().includes('wealth strategist')) {
  fail('custom role should appear in composed ambition statement');
}

const impact = composeImpactStatement({
  audienceIds: ['families', 'young_professionals'],
  variant: 'balanced',
  patternSeed: 0,
  participantSeed: 'intern-a',
});
if (!impact || impact.length < 15) fail('impact statement too short');

const futureSummary = composeFutureSelfSummary({
  goals: ['leading_team', 'financially_independent'],
  incomeLevel: 4,
  impact: 'help families plan for the future',
  patternSeed: 0,
  participantSeed: 'intern-a',
});
if (!futureSummary || futureSummary.length < 20) fail('future self summary too short');

console.log('smoke:coach-compose OK');
console.log(`  intern A: ${internA}`);
console.log(`  intern B: ${internB}`);
console.log(`  custom role: ${customStatement}`);
console.log(`  impact: ${impact}`);
console.log(`  future summary: ${futureSummary}`);
