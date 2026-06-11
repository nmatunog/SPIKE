#!/usr/bin/env node
/**
 * Generate minimal Week 1 Day 2–5 playbook content bundles.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'content', 'segment-1', 'week-1');

const DAYS = [
  {
    slug: 'day-2',
    dayNumber: 2,
    title: 'Discover The Industry',
    theme: 'Opportunity',
    outputs: ['Opportunity Reflection', 'Industry Insights'],
    portfolio: 'portfolio-market-intelligence',
  },
  {
    slug: 'day-3',
    dayNumber: 3,
    title: 'Discover The Market',
    theme: 'Customer',
    outputs: ['Customer Persona', 'Market Insights'],
    portfolio: 'portfolio-market-intelligence',
  },
  {
    slug: 'day-4',
    dayNumber: 4,
    title: 'Financial Entrepreneurship',
    theme: 'Entrepreneur',
    outputs: ['Canvas v1', 'Career Direction'],
    portfolio: 'portfolio-financial-blueprint',
  },
  {
    slug: 'day-5',
    dayNumber: 5,
    title: 'My Venture Direction',
    theme: 'Commitment',
    outputs: ['Venture Blueprint Draft', 'Week 1 Portfolio Presentation'],
    portfolio: 'portfolio-identity-purpose',
  },
];

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

for (const day of DAYS) {
  const dir = join(ROOT, day.slug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const dayId = `day-segment-1-week-1-${day.slug}`;

  writeJson(join(dir, 'day.json'), {
    id: dayId,
    segmentId: 'segment-1',
    weekId: 'week-segment-1-1',
    dayNumber: day.dayNumber,
    title: day.title,
    theme: day.theme,
    durationHours: 4,
    learningObjectives: [`Complete ${day.theme} objectives for Week 1`],
    expectedOutputs: day.outputs,
    portfolioDeliverables: day.outputs,
    businessPlanIntegration: `Week 1 Day ${day.dayNumber} — ${day.theme}`,
    presentations: [`presentation-${day.slug}`],
    activities: [`activity-${day.slug}`],
    worksheets: [`worksheet-${day.slug}`],
    assessments: [`assessment-${day.slug}`],
  });

  writeJson(join(dir, 'presentation.json'), {
    presentation: { id: `presentation-${day.slug}`, dayId, title: day.title, slideIds: [`slide-${day.slug}-01`] },
    slides: [{
      id: `slide-${day.slug}-01`,
      presentationId: `presentation-${day.slug}`,
      sortOrder: 1,
      title: day.title,
      body: `Week 1 Day ${day.dayNumber}: ${day.theme}`,
      speakerNotes: 'Facilitate per faculty day template.',
      discussionQuestions: ['What stood out today?', 'How does this connect to your ambition?'],
    }],
  });

  writeJson(join(dir, 'activities.json'), {
    activities: [{ id: `activity-${day.slug}`, dayId, title: `${day.theme} workshop`, format: 'squad', durationMinutes: 90 }],
  });

  writeJson(join(dir, 'worksheets.json'), {
    worksheets: [{ id: `worksheet-${day.slug}`, dayId, title: `${day.theme} reflection`, type: 'reflection' }],
    questions: [{ id: `wq-${day.slug}-1`, worksheetId: `worksheet-${day.slug}`, prompt: `Reflect on ${day.theme}.`, type: 'long_text', required: true, sortOrder: 1 }],
  });

  writeJson(join(dir, 'assessment.json'), {
    assessment: { id: `assessment-${day.slug}`, dayId, title: `Day ${day.dayNumber} check-in`, type: 'reflection' },
    rubric: null,
  });

  writeJson(join(dir, 'survey.json'), {
    survey: { id: `survey-${day.slug}`, dayId, title: `Day ${day.dayNumber} pulse`, description: 'Week 1 progress check', status: 'active' },
    questions: [{ id: `sq-${day.slug}-01`, surveyId: `survey-${day.slug}`, prompt: 'Rate your clarity after today.', type: 'rating', required: true, sortOrder: 1 }],
  });

  writeJson(join(dir, 'contributions.json'), {
    dayId,
    contributesToPortfolio: [day.portfolio],
    contributesToBusinessPlan: ['bp-chapter-1'],
    contributesToCompetencies: ['competency-visioning'],
  });

  console.log(`wrote ${day.slug}`);
}

console.log('generate-week1-day-content OK');
