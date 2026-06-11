#!/usr/bin/env node
/**
 * Phase 3 prep — Full Week 1 pilot simulation (5 participants, 1 mentor, 1 faculty).
 */
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const CAST = {
  faculty: 'Faculty Coach Reyes',
  mentor: 'Mentor Santos',
  participants: ['Participant A', 'Participant B', 'Participant C', 'Participant D', 'Participant E'],
};

function fail(message) {
  console.error(`simulate:week1 FAIL — ${message}`);
  process.exit(1);
}

const server = await createServer({ root, server: { middlewareMode: true }, logLevel: 'error' });

try {
  const mod = await server.ssrLoadModule('/src/lib/curriculumService.js');
  const bundles = mod.assertSegment1Week1Ready();

  console.log('simulate:week1 — Full Week 1 pilot');
  console.log(`  Faculty: ${CAST.faculty}`);
  console.log(`  Mentor: ${CAST.mentor}`);
  console.log(`  Participants: ${CAST.participants.length}`);
  console.log('');

  let totalSlides = 0;
  let totalActivities = 0;

  for (const bundle of bundles) {
    const day = bundle.day.dayNumber;
    const d1 = bundle.presentation.slides.length;
    const d2 = bundle.presentationDeck02.slides.length;
    const acts = bundle.activities.activities.length;
    totalSlides += d1 + d2;
    totalActivities += acts;

    console.log(`Day ${day}: ${bundle.day.title}`);
    console.log(`  Decks: ${d1}+${d2} slides · ${acts} activities · ${bundle.evaluations.templates.length} evaluations`);
    console.log(`  Theme: ${bundle.day.theme} · Mentor: ${bundle.mentorGuide.theme}`);

    for (const p of CAST.participants) {
      const steps = 2 + acts + 2; // decks + activities + reflection/survey
      console.log(`    ${p}: ${steps} delivery steps`);
    }
    console.log('');
  }

  console.log('simulate:week1 OK');
  console.log(`  ${bundles.length} days · ${totalSlides} slides · ${totalActivities} activities`);
  console.log(`  Ready for Phase 3 live pilot before Week 2`);
} catch (error) {
  fail(error.message);
} finally {
  await server.close();
}
