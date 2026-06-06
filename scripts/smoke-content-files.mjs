#!/usr/bin/env node
/**
 * Filesystem smoke check for Sprint 02 content tree (runs without Vite).
 * Validates JSON structure for Segment 1 / Week 1 / Day 1.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DAY_DIR = join(ROOT, 'content/segment-1/week-1/day-1');

const REQUIRED = [
  'day.json',
  'presentation.json',
  'activities.json',
  'worksheets.json',
  'assessment.json',
  'survey.json',
  'contributions.json',
];

for (const file of REQUIRED) {
  const path = join(DAY_DIR, file);
  if (!existsSync(path)) {
    console.error(`smoke:content FAIL — missing ${path}`);
    process.exit(1);
  }
}

const day = JSON.parse(readFileSync(join(DAY_DIR, 'day.json'), 'utf8'));
const presentation = JSON.parse(readFileSync(join(DAY_DIR, 'presentation.json'), 'utf8'));
const contributions = JSON.parse(readFileSync(join(DAY_DIR, 'contributions.json'), 'utf8'));

const checks = [
  [day.learningObjectives?.length > 0, 'learningObjectives'],
  [presentation.slides?.length > 0, 'presentation.slides'],
  [contributions.contributesToPortfolio?.length > 0, 'contributions.contributesToPortfolio'],
  [contributions.contributesToBusinessPlan?.length > 0, 'contributions.contributesToBusinessPlan'],
  [contributions.contributesToCompetencies?.length > 0, 'contributions.contributesToCompetencies'],
];

for (const [ok, label] of checks) {
  if (!ok) {
    console.error(`smoke:content FAIL — invalid ${label}`);
    process.exit(1);
  }
}

console.log('smoke:content OK — Segment 1 / Week 1 / Day 1 files valid');
