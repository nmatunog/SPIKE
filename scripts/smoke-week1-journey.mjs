#!/usr/bin/env node
/**
 * Smoke test — Week 1 participant journey (no browser; avoids JSON import chain).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { WEEK1_DAY_META, WEEK1_MENTOR_OUTCOMES } from '../src/lib/mentorWeek1Constants.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`smoke:week1-journey FAIL — ${message}`);
  process.exit(1);
}

if (WEEK1_DAY_META.length !== 5) fail('expected 5 week 1 days');
if (WEEK1_MENTOR_OUTCOMES.length < 9) fail('expected 9+ mentor outcomes');

const serviceSrc = readFileSync(join(root, 'src/lib/week1JourneyService.js'), 'utf8');
const requiredExports = [
  'getWeek1DeliverableStatus',
  'isWeek1DayComplete',
  'getWeek1DayProgress',
  'getWeek1RequiredOutputs',
  'week1CompletionPct',
  'isWeek1PresentationReady',
];
for (const name of requiredExports) {
  if (!new RegExp(`export function ${name}`).test(serviceSrc)) {
    fail(`missing export ${name}`);
  }
}

const portfolioSrc = readFileSync(join(root, 'src/services/portfolioGenerator.js'), 'utf8');
if (!portfolioSrc.includes('week1Journey')) fail('portfolio model missing week1Journey');

for (let day = 1; day <= 5; day += 1) {
  const meta = WEEK1_DAY_META.find((d) => d.day === day);
  if (!meta?.theme || !meta.expectedOutput) fail(`day ${day} meta incomplete`);
}

console.log('smoke:week1-journey OK');
console.log(`  days: ${WEEK1_DAY_META.map((d) => d.theme).join(' → ')}`);
console.log(`  outcomes: ${WEEK1_MENTOR_OUTCOMES.length}`);
