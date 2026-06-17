#!/usr/bin/env node
/**
 * Phase 2 — Generate full Week 1 Day 2–5 content (matches Day 1 structure).
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'content', 'segment-1', 'week-1');

/** @param {string} path @param {unknown} data */
function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

/**
 * @param {string} daySlug
 * @param {number} dayNumber
 * @param {Record<string, unknown>} spec
 */
function writeDayBundle(daySlug, dayNumber, spec) {
  const dir = join(ROOT, daySlug);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const dayId = `day-segment-1-week-1-${daySlug}`;

  writeJson(join(dir, 'day.json'), {
    id: dayId,
    segmentId: 'segment-1',
    weekId: 'week-segment-1-1',
    dayNumber,
    title: spec.title,
    theme: spec.theme,
    durationHours: 4,
    learningObjectives: spec.learningObjectives,
    expectedOutputs: spec.expectedOutputs,
    portfolioDeliverables: spec.portfolioDeliverables,
    businessPlanIntegration: spec.businessPlanIntegration,
    presentations: [`presentation-${daySlug}-deck-01`, `presentation-${daySlug}-deck-02`],
    activities: spec.activities.map((a) => a.id),
    worksheets: spec.worksheets.map((w) => w.id),
    assessments: [spec.assessment.id],
  });

  writeJson(join(dir, 'presentation.json'), {
    presentation: {
      id: `presentation-${daySlug}-deck-01`,
      dayId,
      title: spec.deck01.title,
      slideIds: spec.deck01.slides.map((s) => s.id),
    },
    slides: spec.deck01.slides.map((s, i) => ({
      ...s,
      presentationId: `presentation-${daySlug}-deck-01`,
      sortOrder: i + 1,
    })),
  });

  writeJson(join(dir, 'presentation-deck-02.json'), {
    presentation: {
      id: `presentation-${daySlug}-deck-02`,
      dayId,
      title: spec.deck02.title,
      slideIds: spec.deck02.slides.map((s) => s.id),
    },
    slides: spec.deck02.slides.map((s, i) => ({
      ...s,
      presentationId: `presentation-${daySlug}-deck-02`,
      sortOrder: i + 1,
    })),
  });

  writeJson(join(dir, 'activities.json'), {
    activities: spec.activities.map((a) => ({ ...a, dayId })),
  });

  writeJson(join(dir, 'worksheets.json'), {
    worksheets: spec.worksheets.map((w) => ({ id: w.id, dayId, title: w.title, questionIds: w.questionIds })),
    questions: spec.worksheetQuestions,
  });

  writeJson(join(dir, 'assessment.json'), {
    assessment: { ...spec.assessment, dayId },
    rubric: { ...spec.rubric, assessmentId: spec.assessment.id },
  });

  writeJson(join(dir, 'survey.json'), {
    survey: {
      id: `survey-${daySlug}`,
      dayId,
      title: `Day ${dayNumber} pulse survey`,
      description: spec.surveyDescription,
      status: 'active',
    },
    questions: spec.surveyQuestions.map((q, i) => ({
      ...q,
      surveyId: `survey-${daySlug}`,
      sortOrder: i + 1,
    })),
  });

  writeJson(join(dir, 'contributions.json'), {
    dayId,
    contributesToPortfolio: spec.contributesToPortfolio,
    contributesToBusinessPlan: spec.contributesToBusinessPlan,
    contributesToCompetencies: spec.contributesToCompetencies,
  });

  writeJson(join(dir, 'facilitator-guide.json'), {
    dayId,
    title: spec.facilitator.title,
    durationHours: 4,
    prepChecklist: spec.facilitator.prepChecklist,
    sessionFlow: spec.facilitator.sessionFlow,
    debriefQuestions: spec.facilitator.debriefQuestions,
    commonPitfalls: spec.facilitator.commonPitfalls,
    coachingTips: spec.facilitator.coachingTips,
  });

  writeJson(join(dir, 'sessions.json'), { sessions: spec.sessions.map((s) => ({ ...s, dayId })) });

  writeJson(join(dir, 'reflections.json'), {
    reflections: [
      {
        id: `reflection-${daySlug}-close`,
        dayId,
        title: `Day ${dayNumber} closing reflection`,
        prompts: spec.reflectionPrompts,
      },
    ],
  });

  writeJson(join(dir, 'evaluations.json'), {
    templates: spec.evaluations.map((t) => ({ ...t, dayId })),
  });

  writeJson(join(dir, 'mentor-guide.json'), {
    dayId,
    theme: spec.theme,
    title: spec.mentorGuide.title,
    coachingObjective: spec.mentorGuide.coachingObjective,
    timing: spec.mentorGuide.timing,
    discussionQuestions: spec.mentorGuide.discussionQuestions,
    observationAreas: spec.mentorGuide.observationAreas,
    coachingTips: spec.mentorGuide.coachingTips,
    warningSigns: spec.mentorGuide.warningSigns,
    reflectionPrompts: spec.mentorGuide.reflectionPrompts,
    expectedOutcomes: spec.mentorGuide.expectedOutcomes,
    activityCoachingNotes: spec.mentorGuide.activityCoachingNotes,
    debriefWithFaculty: spec.mentorGuide.debriefWithFaculty,
  });

  console.log(`wrote ${daySlug} — ${spec.deck01.slides.length}+${spec.deck02.slides.length} slides, ${spec.activities.length} activities`);
}

/** @param {string} prefix @param {string} title @param {string} body @param {string} notes @param {string[]} questions */
function slide(prefix, title, body, notes, questions = []) {
  return { id: `slide-${prefix}`, title, body, speakerNotes: notes, discussionQuestions: questions };
}

/** @param {string} id @param {string} title @param {number} mins @param {string[]} instructions @param {string[]} debrief */
function activity(id, title, mins, instructions, debrief, materials = [], outputs = []) {
  return {
    id,
    title,
    durationMinutes: mins,
    materials,
    instructions,
    outputs,
    debriefQuestions: debrief,
  };
}

const mentorTiming = {
  preSession: '10 min — review deck speaker notes and observation form',
  duringSession: 'Circulate during squad activities; coach individuals at transitions',
  postSession: '15 min — complete observation forms and coaching notes',
};

// ─── DAY 2 ───────────────────────────────────────────────────────────────────
writeDayBundle('day-2', 2, {
  title: 'Day 2 — Discover The Industry',
  theme: 'Opportunity',
  learningObjectives: [
    'Map the financial services and insurance landscape in the Philippines',
    'Connect industry opportunity to personal ambition from Day 1',
    'Prepare for practitioner interviews and squad research',
    'Draft opportunity reflection for portfolio and business plan',
  ],
  expectedOutputs: ['Interview Notes', 'Industry Insights', 'Research Plan', 'Opportunity Reflection'],
  portfolioDeliverables: ['Industry insights summary', 'Opportunity reflection'],
  businessPlanIntegration: 'Business Plan Chapter 1 — Market Context & Opportunity',
  contributesToPortfolio: ['portfolio-market-intelligence'],
  contributesToBusinessPlan: ['bp-chapter-1', 'bp-chapter-2'],
  contributesToCompetencies: ['competency-industry-knowledge', 'competency-research'],
  surveyDescription: 'Day 2 industry immersion pulse check',
  surveyQuestions: [
    { id: 'sq-day-2-01', prompt: 'How clearly does the industry connect to your ambition?', type: 'rating', required: true },
    { id: 'sq-day-2-02', prompt: 'What is your biggest open question about financial services?', type: 'long_text', required: true },
  ],
  assessment: {
    id: 'assessment-day-2-industry',
    title: 'Day 2 Industry Comprehension Check',
    description: 'Faculty and mentor observation of industry immersion engagement and interview prep quality.',
    rubricId: 'rubric-day-2-industry',
  },
  rubric: {
    id: 'rubric-day-2-industry',
    title: 'Industry Immersion Rubric',
    criteria: [
      'Demonstrates understanding of protection vs investment basics',
      'Connects industry trends to personal ambition',
      'Prepares thoughtful interview questions',
      'Contributes meaningfully to squad industry debrief',
    ],
  },
  worksheets: [{ id: 'worksheet-day-2-interview-notes', title: 'Practitioner Interview Notes', questionIds: ['wq-d2-1', 'wq-d2-2', 'wq-d2-3'] }],
  worksheetQuestions: [
    { id: 'wq-d2-1', worksheetId: 'worksheet-day-2-interview-notes', prompt: 'Who did you interview or observe today — role and context?', type: 'short_text', required: true, sortOrder: 1 },
    { id: 'wq-d2-2', worksheetId: 'worksheet-day-2-interview-notes', prompt: 'What industry insight surprised you most?', type: 'long_text', required: true, sortOrder: 2 },
    { id: 'wq-d2-3', worksheetId: 'worksheet-day-2-interview-notes', prompt: 'How does this connect to your Day 1 ambition?', type: 'long_text', required: true, sortOrder: 3 },
  ],
  deck01: {
    title: 'Faculty Deck 01 — The Financial Services Landscape',
    slides: [
      slide('d2-01-01', 'Day 2 Opening — From Identity to Industry', 'Yesterday you defined who you are becoming.\nToday we ask: what industry will you build in?\n\nFinancial services is one of the largest, most stable, and most impact-driven sectors in the Philippines.', 'Bridge from Day 1 identity. Reference participant ambition statements. 3 min.', ['How does your ambition connect to an industry — not just a job?']),
      slide('d2-01-02', 'Financial Services Ecosystem', 'Banks · Insurance · Investments · Financial Planning · Fintech\n\nProtection products (life, health, VUL) fund education, retirement, and legacy.\nAdvisors and agency builders are entrepreneurs within this ecosystem.', 'Use local examples. Avoid product pitch — this is landscape. 6 min.', ['Which part of the ecosystem interests you most?']),
      slide('d2-01-03', 'Insurance & Protection Story', 'Insurance is not a transaction — it is a promise.\n\nAIA\'s protection mission: help people live Healthier, Longer, Better Lives.\n\nThe opportunity: millions of Filipinos are underinsured. Financial entrepreneurs close the protection gap.', 'Connect to AIA Day 1 story. 5 min.', ['Would you personally buy protection today? Why or why not?']),
      slide('d2-01-04', 'Career Opportunities in Financial Entrepreneurship', 'Advisor → Unit Manager → Agency Director\nSpecialist Consultant → Practice Owner\n\nSPIKE prepares you for both agency building and specialist consulting paths.', 'Link to Day 1 career direction exploration. 4 min.', ['Where do you see yourself adding value in this industry?']),
      slide('d2-01-05', 'Deck 01 Close — Industry Immersion Begins', 'Next: Deck 02 — Connecting Industry to Your Ambition.\nThen: practitioner interviews, squad debrief, and research plan.', 'Transition to Deck 02. 2 min.', ['What do you want to learn from a practitioner today?']),
    ],
  },
  deck02: {
    title: 'Faculty Deck 02 — Connecting Industry to Your Ambition',
    slides: [
      slide('d2-02-01', 'Ambition Meets Industry', 'Your ambition statement is not abstract — it lives in a real market.\n\nToday you will:\n• Interview or observe a practitioner\n• Capture industry insights for your squad\n• Draft your opportunity reflection', 'Show example connection: ambition → industry niche. 4 min.', ['Read your ambition — what industry segment fits?']),
      slide('d2-02-02', 'Interview & Observation Protocol', 'Prepare 5 questions before you speak to a practitioner.\nListen for: client problems, career path, daily habits, industry changes.\nCapture quotes — your business plan will use this evidence.', 'Distribute interview worksheet. 5 min.', ['What is one question you are afraid to ask?']),
      slide('d2-02-03', 'Squad Research Plan', 'Squads will research a market segment this week.\nDocument: target segment, key questions, interview schedule, roles.\nLead presents research plan at debrief.', 'Squad breakout follows. 4 min.', ['What segment will your squad investigate?']),
      slide('d2-02-04', 'Day 2 Deliverables', '✓ Interview notes\n✓ Industry insights (squad)\n✓ Research plan\n✓ Opportunity reflection → Portfolio', 'Close with deliverable checklist. 3 min.', ['What is one action before Day 3 market observation?']),
    ],
  },
  activities: [
    activity('activity-day-2-industry-immersion', 'Industry Immersion Session', 60,
      ['Faculty delivers Deck 01 with discussion after slides 2–4.', 'Participants take structured notes in interview worksheet.', 'Facilitate Q&A on financial services landscape.'],
      ['What surprised you about the industry today?', 'What assumption from yesterday changed?', 'How does protection connect to your impact statement?'],
      ['Faculty Deck 01', 'Interview notes worksheet'],
      ['Industry insight notes']),
    activity('activity-day-2-practitioner-interview', 'Practitioner Interview / Observation', 45,
      ['Pairs or triads interview a practitioner, mentor, or faculty guest.', 'Use worksheet prompts — minimum 3 substantive answers.', 'Record key quotes for business plan evidence.'],
      ['What quote will you remember from today?', 'What career path did the practitioner describe?', 'What habit could you adopt this week?'],
      ['Interview notes worksheet', 'Practitioner guest or mentor'],
      ['Completed interview notes']),
    activity('activity-day-2-squad-industry-debrief', 'Squad Industry Debrief', 30,
      ['Squads share top 3 industry insights.', 'Identify overlap with research market segment.', 'Assign scribe to compile squad insight summary.'],
      ['Where did squad insights align or diverge?', 'What is your squad\'s research priority for Week 1?', 'Who presents at Day 3 persona workshop?'],
      ['Squad workspace', 'Shared doc or app'],
      ['Squad industry insight summary']),
    activity('activity-day-2-opportunity-reflection', 'Opportunity Reflection', 25,
      ['Individual reflection linking industry to Day 1 ambition.', 'Complete worksheet question 3 and survey.', 'Sync to Portfolio market intelligence section.'],
      ['How did today change your 3-year picture?', 'What opportunity excites you most?', 'What concern remains about this industry?'],
      ['Venture Portfolio', 'Business Plan draft'],
      ['Opportunity reflection artifact']),
  ],
  sessions: [
    {
      id: 'session-day-2-morning',
      sessionNumber: 1,
      title: 'Industry Landscape & Immersion',
      durationMinutes: 135,
      presentationIds: ['presentation-day-2-deck-01', 'presentation-day-2-deck-02'],
      activityIds: ['activity-day-2-industry-immersion', 'activity-day-2-practitioner-interview'],
      worksheetIds: ['worksheet-day-2-interview-notes'],
      assessmentIds: [],
      reflectionIds: [],
      surveyIds: [],
    },
    {
      id: 'session-day-2-afternoon',
      sessionNumber: 2,
      title: 'Squad Debrief & Opportunity Reflection',
      durationMinutes: 105,
      presentationIds: [],
      activityIds: ['activity-day-2-squad-industry-debrief', 'activity-day-2-opportunity-reflection'],
      worksheetIds: [],
      assessmentIds: ['assessment-day-2-industry'],
      reflectionIds: ['reflection-day-2-close'],
      surveyIds: ['survey-day-2'],
    },
  ],
  reflectionPrompts: [
    'What industry insight most connects to your ambition?',
    'What will your squad research this week?',
    'What is one question you will answer before Day 3?',
  ],
  facilitator: {
    title: 'Facilitator Guide — Day 2: Industry & Opportunity',
    prepChecklist: ['Confirm practitioner guests or mentor stand-ins', 'Load Deck 01 and Deck 02 with speaker notes', 'Print interview worksheets', 'Brief mentors on observation form'],
    sessionFlow: [
      { time: '0:00–0:30', activity: 'Deck 01 — Financial services landscape', notes: 'Tell stories, not bullet reads.' },
      { time: '0:30–0:45', activity: 'Deck 02 — Ambition + interview protocol', notes: 'Launch interview activity.' },
      { time: '0:45–1:30', activity: 'Practitioner interviews', notes: 'Mentors circulate with observation form.' },
      { time: '1:30–2:00', activity: 'Squad industry debrief', notes: 'Compile squad insights.' },
      { time: '2:00–2:25', activity: 'Opportunity reflection + assessment', notes: 'Close with Day 2 deliverables.' },
    ],
    debriefQuestions: ['Which squads connected industry to ambition most clearly?', 'Where did participants show curiosity vs skepticism?', 'What coaching is needed before Day 3?'],
    commonPitfalls: ['Treating day as product training', 'Skipping interview debrief', 'Generic industry notes without personal connection'],
    coachingTips: ['Link every insight back to Day 1 ambition', 'Push for named practitioners and real quotes'],
  },
  evaluations: [
    { id: 'rubric-day-2-participation', type: 'rubric', title: 'Day 2 Participation Rubric', audience: 'faculty', description: 'Engagement in immersion and interviews.', criteria: [{ label: 'Interview quality', indicators: ['Thoughtful questions', 'Captured quotes', 'Personal reflection'] }], scale: ['Needs coaching', 'Developing', 'Proficient', 'Exemplary'] },
    { id: 'rubric-day-2-interview-prep', type: 'rubric', title: 'Interview Preparation Rubric', audience: 'faculty', description: 'Quality of interview prep and notes.', criteria: [{ label: 'Preparation', indicators: ['5 questions prepared', 'Notes completed', 'Ambition connection'] }], scale: ['Not ready', 'Emerging', 'Ready', 'Exemplary'] },
    { id: 'observation-day-2-faculty', type: 'observation_form', title: 'Faculty Day 2 Observation', audience: 'faculty', fields: [{ id: 'curiosity', label: 'Shows industry curiosity', type: 'rating', max: 5 }, { id: 'notes', label: 'Notes', type: 'long_text' }] },
    { id: 'observation-day-2-mentor', type: 'observation_form', title: 'Mentor Day 2 Observation', audience: 'mentor', observationAreas: ['Curiosity', 'Industry Understanding', 'Business Awareness'], fields: [{ id: 'curiosity', label: 'Curiosity', type: 'rating', max: 5 }, { id: 'coaching_note', label: 'Coaching note', type: 'long_text' }] },
  ],
  mentorGuide: {
    title: 'Mentor Guide — Day 2: Opportunity',
    coachingObjective: 'Connect industry opportunity to personal goals from Day 1.',
    timing: mentorTiming,
    discussionQuestions: ['What surprised you about the industry?', 'What assumptions changed today?', 'Would you personally buy insurance today? Why?', 'Where do you see opportunity?'],
    observationAreas: [
      { area: 'Curiosity', lookFor: ['Asks follow-up questions', 'Takes detailed notes'], warningSigns: ['Dismissing industry as irrelevant'] },
      { area: 'Industry Understanding', lookFor: ['Uses correct terminology', 'Connects protection to clients'], warningSigns: ['Overconfidence without evidence'] },
      { area: 'Business Awareness', lookFor: ['Sees entrepreneurship in practitioner stories'], warningSigns: ['Employee mindset only'] },
    ],
    coachingTips: ['Link industry facts to Day 1 ambition', 'Ask for one quote from interview that stuck'],
    warningSigns: ['Dismissing industry', 'Copying generic insights'],
    reflectionPrompts: ['How does today change your 3-year picture?'],
    expectedOutcomes: ['Opportunity Reflection', 'Interview Notes'],
    activityCoachingNotes: [{ activityId: 'activity-day-2-practitioner-interview', note: 'Ensure they ask at least one question about daily habits of top performers.' }],
    debriefWithFaculty: ['Who needs follow-up before market observation?', 'Are research plans realistic?'],
  },
});

// ─── DAY 3 ───────────────────────────────────────────────────────────────────
writeDayBundle('day-3', 3, {
  title: 'Day 3 — Discover The Market',
  theme: 'Customer',
  learningObjectives: [
    'Identify customer problems through observation and conversation',
    'Build evidence-based customer personas',
    'Map unmet needs to venture opportunity',
    'Launch squad needs-analysis research plan',
  ],
  expectedOutputs: ['Customer Persona', 'Market Insights', 'Needs Analysis Survey Plan'],
  portfolioDeliverables: ['Customer persona canvas', 'Market insight log'],
  businessPlanIntegration: 'Business Plan Chapter 2 — Target Market & Customer',
  contributesToPortfolio: ['portfolio-market-intelligence'],
  contributesToBusinessPlan: ['bp-chapter-2'],
  contributesToCompetencies: ['competency-research', 'competency-empathy'],
  surveyDescription: 'Day 3 customer discovery pulse',
  surveyQuestions: [
    { id: 'sq-day-3-01', prompt: 'How confident are you in your squad persona?', type: 'rating', required: true },
    { id: 'sq-day-3-02', prompt: 'What customer problem will you investigate first?', type: 'long_text', required: true },
  ],
  assessment: { id: 'assessment-day-3-persona', title: 'Day 3 Persona Presentation Assessment', description: 'Squad persona quality and evidence.', rubricId: 'rubric-day-3-persona' },
  rubric: { id: 'rubric-day-3-persona', title: 'Customer Persona Rubric', criteria: ['Persona based on real observation', 'Named problems and needs', 'Clear target segment', 'Squad presentation clarity'] },
  worksheets: [{ id: 'worksheet-day-3-persona', title: 'Customer Persona Canvas', questionIds: ['wq-d3-1', 'wq-d3-2', 'wq-d3-3', 'wq-d3-4'] }],
  worksheetQuestions: [
    { id: 'wq-d3-1', worksheetId: 'worksheet-day-3-persona', prompt: 'Persona name and segment (e.g., Gen Z freelancer)', type: 'short_text', required: true, sortOrder: 1 },
    { id: 'wq-d3-2', worksheetId: 'worksheet-day-3-persona', prompt: 'Top 3 problems this persona faces', type: 'long_text', required: true, sortOrder: 2 },
    { id: 'wq-d3-3', worksheetId: 'worksheet-day-3-persona', prompt: 'What unmet need could financial planning address?', type: 'long_text', required: true, sortOrder: 3 },
    { id: 'wq-d3-4', worksheetId: 'worksheet-day-3-persona', prompt: 'Evidence source (interview, observation, survey)', type: 'short_text', required: true, sortOrder: 4 },
  ],
  deck01: {
    title: 'Faculty Deck 01 — Problems, Needs & Segments',
    slides: [
      slide('d3-01-01', 'Day 3 — Customer Discovery', 'Entrepreneurs do not start with products.\nThey start with problems.\n\nToday: observe, listen, persona — then opportunity.', 'Set empathy tone. 3 min.', ['What customer did you think about on the way in today?']),
      slide('d3-01-02', 'Problems Before Solutions', 'Great ventures solve painful problems.\n\nListen for: frequency, intensity, willingness to pay for relief.\n\nAvoid solution-first thinking until problems are clear.', 'Use squad examples from Day 2 research plan. 5 min.', ['What problem did you hear repeatedly yesterday?']),
      slide('d3-01-03', 'Customer Segments', 'Demographics + psychographics + behavior.\n\nExamples: young parents, freelancers, SME owners, OFW families.\n\nYour squad segment should match your research market.', 'Connect to squad formation Day 1. 5 min.', ['Who is most affected by the problems you identified?']),
      slide('d3-01-04', 'Needs Analysis Mindset', 'Needs analysis is not a form — it is a conversation.\n\nSPIKE squads conduct real surveys this week.\nToday you design the persona that guides those conversations.', 'Preview survey activity in app. 4 min.', ['What question will you ask in your first survey?']),
      slide('d3-01-05', 'Deck 01 Close', 'Next: Deck 02 — Persona Workshop.\nThen: market observation and squad presentations.', '2 min transition.', ['What will you observe in the next hour?']),
    ],
  },
  deck02: {
    title: 'Faculty Deck 02 — Persona & Opportunity Workshop',
    slides: [
      slide('d3-02-01', 'Building Evidence-Based Personas', 'A persona is not fiction — it is compressed evidence.\n\nInclude: name, segment, problems, goals, fears, financial behaviors.', 'Show exemplar persona on screen. 5 min.', ['What evidence do you already have?']),
      slide('d3-02-02', 'Market Observation Protocol', 'Observe in pairs: public spaces, campus, community.\nNote exact language people use — not your interpretation.', 'Safety and ethics reminder. 4 min.', ['Where will your squad observe today?']),
      slide('d3-02-03', 'Persona Presentation Format', 'Each squad presents: persona, top problem, opportunity hypothesis.\n3 minutes present + 2 minutes faculty/mentor feedback.', 'Set presentation rubric expectations. 3 min.', ['Who presents for your squad?']),
      slide('d3-02-04', 'Day 3 Deliverables', '✓ Customer persona canvas\n✓ Market insight log\n✓ Needs analysis survey plan\n✓ Portfolio market intelligence update', '3 min close.', ['What survey will you launch before Day 4?']),
    ],
  },
  activities: [
    activity('activity-day-3-market-observation', 'Market Observation Walk', 50,
      ['Squads conduct structured observation in assigned area.', 'Capture verbatim quotes and behaviors.', 'No selling — listen and learn only.'],
      ['What exact words did customers use?', 'What surprised you in the field?', 'What problem appeared most urgent?'],
      ['Observation worksheet', 'Squad pairs'],
      ['Field observation notes']),
    activity('activity-day-3-persona-workshop', 'Customer Persona Workshop', 60,
      ['Squads build persona canvas from observation + Day 2 insights.', 'Complete worksheet in app.', 'Peer review within squad for evidence quality.'],
      ['Is your persona based on evidence or assumption?', 'What is the persona\'s biggest unmet need?', 'How does persona connect to your impact statement?'],
      ['Persona canvas worksheet'],
      ['Customer persona artifact']),
    activity('activity-day-3-squad-research-plan', 'Squad Research Planning', 35,
      ['Finalize needs-analysis survey questions (5–8).', 'Assign survey roles and targets for Week 1.', 'Set completion goal before Day 5.'],
      ['How many surveys will your squad complete this week?', 'What could bias your results?', 'How will you share findings in portfolio?'],
      ['Survey builder in app'],
      ['Research plan document']),
    activity('activity-day-3-persona-presentation', 'Squad Persona Presentations', 40,
      ['Each squad presents persona + opportunity hypothesis.', 'Faculty scores with persona rubric.', 'Mentors note coaching opportunities.'],
      ['Which persona was most convincing — and why?', 'What feedback will improve your persona?', 'What opportunity will you test next?'],
      ['Presentation rubric'],
      ['Persona presentation complete']),
  ],
  sessions: [
    { id: 'session-day-3-morning', sessionNumber: 1, title: 'Customer Discovery & Observation', durationMinutes: 130, presentationIds: ['presentation-day-3-deck-01', 'presentation-day-3-deck-02'], activityIds: ['activity-day-3-market-observation', 'activity-day-3-persona-workshop'], worksheetIds: ['worksheet-day-3-persona'], assessmentIds: [], reflectionIds: [], surveyIds: [] },
    { id: 'session-day-3-afternoon', sessionNumber: 2, title: 'Research Plan & Presentations', durationMinutes: 110, presentationIds: [], activityIds: ['activity-day-3-squad-research-plan', 'activity-day-3-persona-presentation'], worksheetIds: [], assessmentIds: ['assessment-day-3-persona'], reflectionIds: ['reflection-day-3-close'], surveyIds: ['survey-day-3'] },
  ],
  reflectionPrompts: ['Who is one person you want to help and why?', 'What problem will your squad investigate first?', 'What did you learn about empathy today?'],
  facilitator: {
    title: 'Facilitator Guide — Day 3: Customer Discovery',
    prepChecklist: ['Confirm observation locations and permissions', 'Load persona exemplar', 'Brief mentors on empathy coaching'],
    sessionFlow: [
      { time: '0:00–0:25', activity: 'Decks 01–02', notes: 'Problems before solutions.' },
      { time: '0:25–1:15', activity: 'Market observation', notes: 'Safety briefing first.' },
      { time: '1:15–2:15', activity: 'Persona workshop', notes: 'Push for evidence.' },
      { time: '2:15–3:00', activity: 'Research plan + presentations', notes: 'Use persona rubric.' },
    ],
    debriefQuestions: ['Which personas lacked evidence?', 'What problems appeared across squads?', 'Are survey plans realistic?'],
    commonPitfalls: ['Fictional personas', 'Solution-first thinking', 'Skipping observation'],
    coachingTips: ['Demand verbatim quotes', 'Link persona to Day 1 impact audience'],
  },
  evaluations: [
    { id: 'rubric-day-3-research-quality', type: 'rubric', title: 'Research Quality Rubric', audience: 'faculty', description: 'Evidence quality in persona and observation.', criteria: [{ label: 'Evidence', indicators: ['Real quotes', 'Named segment', 'Clear problem'] }], scale: ['Weak', 'Developing', 'Strong', 'Exemplary'] },
    { id: 'rubric-day-3-persona-present', type: 'rubric', title: 'Persona Presentation Rubric', audience: 'faculty', criteria: [{ label: 'Presentation', indicators: ['Clear persona', 'Problem stated', 'Opportunity hypothesis'] }], scale: ['Not ready', 'Emerging', 'Ready', 'Exemplary'] },
    { id: 'observation-day-3-mentor', type: 'observation_form', title: 'Mentor Day 3 Observation', audience: 'mentor', observationAreas: ['Listening Skills', 'Empathy', 'Problem Identification'], fields: [{ id: 'empathy', label: 'Empathy', type: 'rating', max: 5 }] },
  ],
  mentorGuide: {
    title: 'Mentor Guide — Day 3: Customer',
    coachingObjective: 'Develop empathy and customer awareness.',
    timing: mentorTiming,
    discussionQuestions: ['What concerns did people talk about?', 'What needs appeared repeatedly?', 'What surprised you?', 'What opportunities did you discover?'],
    observationAreas: [
      { area: 'Listening Skills', lookFor: ['Captures exact language', 'Asks follow-ups'], warningSigns: ['Interrupts or assumes'] },
      { area: 'Empathy', lookFor: ['Names customer feelings'], warningSigns: ['Judgmental language'] },
      { area: 'Problem Identification', lookFor: ['Prioritizes problems'], warningSigns: ['Jumps to product solutions'] },
    ],
    coachingTips: ['Push for evidence from conversations', 'Ask who they want to help by name or type'],
    warningSigns: ['Generic personas', 'Solution-first thinking'],
    reflectionPrompts: ['Who is one person you want to help and why?'],
    expectedOutcomes: ['Customer Understanding Assessment', 'Customer Persona'],
    activityCoachingNotes: [{ activityId: 'activity-day-3-market-observation', note: 'Debrief in field — what did you hear before you interpreted?' }],
    debriefWithFaculty: ['Which squads need persona rework?', 'Survey plans ready?'],
  },
});

// ─── DAY 4 ───────────────────────────────────────────────────────────────────
writeDayBundle('day-4', 4, {
  title: 'Day 4 — Financial Entrepreneurship',
  theme: 'Entrepreneur',
  learningObjectives: [
    'Distinguish advisor, practice owner, and agency builder paths',
    'Draft Financial Entrepreneurship Canvas v1 (30%+ completion)',
    'Align canvas engines to career direction',
    'Prepare for Day 5 venture commitment',
  ],
  expectedOutputs: ['FE Canvas v1', 'Career Direction checkpoint', 'Canvas presentation notes'],
  portfolioDeliverables: ['Financial canvas summary', 'Career direction update'],
  businessPlanIntegration: 'Business Plan Chapter 3 — Operating Model & Canvas',
  contributesToPortfolio: ['portfolio-financial-blueprint'],
  contributesToBusinessPlan: ['bp-chapter-3'],
  contributesToCompetencies: ['competency-financial-planning', 'competency-entrepreneurship'],
  surveyDescription: 'Day 4 canvas workshop pulse',
  surveyQuestions: [
    { id: 'sq-day-4-01', prompt: 'How clear is your venture path after today?', type: 'rating', required: true },
    { id: 'sq-day-4-02', prompt: 'Which canvas engine was hardest to complete?', type: 'short_text', required: true },
  ],
  assessment: { id: 'assessment-day-4-canvas', title: 'Day 4 Canvas Completeness Check', description: 'Canvas v1 threshold and presentation.', rubricId: 'rubric-day-4-canvas' },
  rubric: { id: 'rubric-day-4-canvas', title: 'Canvas Presentation Rubric', criteria: ['30%+ canvas completion', 'Strategy statement drafted', 'Three priorities identified', 'Career direction linked to canvas'] },
  worksheets: [{ id: 'worksheet-day-4-canvas-reflection', title: 'Canvas Workshop Reflection', questionIds: ['wq-d4-1', 'wq-d4-2'] }],
  worksheetQuestions: [
    { id: 'wq-d4-1', worksheetId: 'worksheet-day-4-canvas-reflection', prompt: 'Which pathway energizes you today — Agency Builder or Specialist Consultant?', type: 'long_text', required: true, sortOrder: 1 },
    { id: 'wq-d4-2', worksheetId: 'worksheet-day-4-canvas-reflection', prompt: 'What is the first engine you will complete on your canvas this week?', type: 'short_text', required: true, sortOrder: 2 },
  ],
  deck01: {
    title: 'Faculty Deck 01 — Advisor vs Entrepreneur',
    slides: [
      slide('d4-01-01', 'Day 4 — Financial Entrepreneurship', 'You have identity (Day 1), industry context (Day 2), and customer insight (Day 3).\n\nToday: choose how you will BUILD — and draft your operating model.', '3 min open.', ['What kind of entrepreneur do you want to become?']),
      slide('d4-01-02', 'Advisor vs Entrepreneur', 'Advisor mindset: execute someone else\'s system.\nEntrepreneur mindset: design your own venture system.\n\nSPIKE trains financial entrepreneurs — owners of their blueprint.', 'Contrast examples. 5 min.', ['Where have you been an advisor vs entrepreneur in your life?']),
      slide('d4-01-03', 'Agency Builder Path', 'Build a team · Recruit · Develop leaders · Scale organization.\nCanvas engines: talent, leadership, recruitment, culture.', 'Use district exemplar. 5 min.', ['What excites you about building a team?']),
      slide('d4-01-04', 'Specialist Consultant Path', 'Build deep expertise · Premium practice · Niche authority.\nCanvas engines: expertise, client experience, reputation.', '5 min.', ['What niche could you own in 3 years?']),
      slide('d4-01-05', 'Deck 01 Close', 'Deck 02 introduces the Financial Entrepreneurship Canvas.', '2 min.', ['Which path will you explore first today?']),
    ],
  },
  deck02: {
    title: 'Faculty Deck 02 — FE Canvas Workshop',
    slides: [
      slide('d4-02-01', 'Financial Entrepreneurship Canvas', 'Your canvas is your operating model — not a one-page plan.\n\nEngines: financial, client, talent, leadership, marketing, operations.\n\nDay 4 goal: 30%+ completion = FE Canvas v1.', 'Show canvas in app. 5 min.', ['Which engine feels most unfamiliar?']),
      slide('d4-02-02', 'Strategy Statement & Priorities', 'Draft your strategy statement: who you serve + how you win.\nSet priority 1–3 for Week 2 execution.', 'Workshop begins after slide. 4 min.', ['What is priority #1 on your canvas?']),
      slide('d4-02-03', 'Canvas Peer Review', 'Dyads review each other\'s canvas for clarity and gaps.\nMentors coach — do not grade.', '4 min intro then activity.', ['What gap did your partner identify?']),
      slide('d4-02-04', 'Day 4 Deliverables', '✓ Canvas v1 (30%+)\n✓ Career direction checkpoint\n✓ Portfolio canvas section updated', '3 min.', ['What will you present on Day 5?']),
    ],
  },
  activities: [
    activity('activity-day-4-track-clinic', 'Career Track Exploration Clinic', 40,
      ['Review Agency Builder vs Specialist Consultant in Venture Coach.', 'Dyads discuss evidence for each path.', 'Update career direction checkpoint — exploration or preference.'],
      ['Which pathway energizes you today?', 'What evidence supports that?', 'What would change your mind?'],
      ['Venture Direction builder'],
      ['Career direction checkpoint']),
    activity('activity-day-4-canvas-workshop', 'FE Canvas Workshop', 75,
      ['Participants complete canvas engines in Venture Blueprint.', 'Faculty targets 30% completion minimum.', 'Mentors help with strategy statement clarity.'],
      ['What engine was hardest?', 'Does canvas match your ambition?', 'What will you finish before Day 5?'],
      ['Canvas editor in app'],
      ['FE Canvas v1 in portfolio']),
    activity('activity-day-4-canvas-peer-review', 'Canvas Peer Review', 35,
      ['Dyads exchange canvas summaries.', 'Give one strength and one gap feedback.', 'Revise strategy statement if needed.'],
      ['What feedback was most useful?', 'What gap will you close this week?', 'How does canvas connect to your persona?'],
      ['Canvas summary view'],
      ['Revised canvas fields']),
    activity('activity-day-4-canvas-presentation', 'Canvas Snapshot Presentations', 30,
      ['Volunteers share 2-minute canvas snapshot.', 'Faculty uses canvas rubric.', 'Mentors note coaching priorities for Day 5.'],
      ['Which presentation showed clearest venture model?', 'What will you add before Day 5?', 'How does canvas support your future self?'],
      ['Canvas rubric'],
      ['Presentation notes']),
  ],
  sessions: [
    { id: 'session-day-4-morning', sessionNumber: 1, title: 'Entrepreneur Paths & Canvas', durationMinutes: 140, presentationIds: ['presentation-day-4-deck-01'], activityIds: ['activity-day-4-track-clinic', 'activity-day-4-canvas-workshop'], worksheetIds: [], assessmentIds: [], reflectionIds: [], surveyIds: [] },
    { id: 'session-day-4-afternoon', sessionNumber: 2, title: 'Peer Review & Presentations', durationMinutes: 100, presentationIds: [], activityIds: ['activity-day-4-canvas-peer-review', 'activity-day-4-canvas-presentation'], worksheetIds: ['worksheet-day-4-canvas-reflection'], assessmentIds: ['assessment-day-4-canvas'], reflectionIds: ['reflection-day-4-close'], surveyIds: ['survey-day-4'] },
  ],
  reflectionPrompts: ['Which track feels most like you today?', 'What is one canvas gap you will close before Day 5?', 'How does your canvas serve your customer persona?'],
  facilitator: {
    title: 'Facilitator Guide — Day 4: Financial Entrepreneurship',
    prepChecklist: ['Test canvas editor access', 'Load both decks', 'Prepare canvas exemplar at 30%'],
    sessionFlow: [
      { time: '0:00–0:25', activity: 'Decks 01–02 intro', notes: 'No path prescription.' },
      { time: '0:25–0:65', activity: 'Track clinic', notes: 'Honest exploration.' },
      { time: '0:65–2:00', activity: 'Canvas workshop', notes: 'Target 30% completion.' },
      { time: '2:00–2:40', activity: 'Peer review + presentations', notes: 'Coach gaps not grades.' },
    ],
    debriefQuestions: ['Who reached 30% canvas?', 'Which path drew most energy?', 'Day 5 presentation prep?'],
    commonPitfalls: ['Choosing path to please others', 'Empty canvas fields', 'Skipping strategy statement'],
    coachingTips: ['Use canvas gaps as coaching prompts', 'Link engines to persona and ambition'],
  },
  evaluations: [
    { id: 'rubric-day-4-canvas-complete', type: 'rubric', title: 'Canvas Completeness Rubric', audience: 'faculty', criteria: [{ label: 'Canvas v1', indicators: ['30%+ complete', 'Strategy drafted', 'Priorities set'] }], scale: ['Below v1', 'v1', 'Strong v1', 'Exemplary'] },
    { id: 'observation-day-4-mentor', type: 'observation_form', title: 'Mentor Day 4 Observation', audience: 'mentor', observationAreas: ['Ownership', 'Entrepreneurial Thinking', 'Leadership Interest'], fields: [{ id: 'ownership', label: 'Ownership', type: 'rating', max: 5 }] },
  ],
  mentorGuide: {
    title: 'Mentor Guide — Day 4: Entrepreneur',
    coachingObjective: 'Explore venture paths and canvas ownership.',
    timing: mentorTiming,
    discussionQuestions: ['What type of business excites you?', 'Would you rather build a Practice, Team, or Agency? Why?', 'What would you build first on your canvas?'],
    observationAreas: [
      { area: 'Ownership', lookFor: ['Takes canvas seriously', 'Revises based on feedback'], warningSigns: ['Minimal effort fields'] },
      { area: 'Entrepreneurial Thinking', lookFor: ['Connects engines to market'], warningSigns: ['Employee language'] },
      { area: 'Leadership Interest', lookFor: ['Curiosity about team building'], warningSigns: ['Avoids leadership engines'] },
    ],
    coachingTips: ['Use canvas gaps as prompts not grades', 'Do not prescribe track — explore'],
    warningSigns: ['Choosing track to please others', 'Avoiding commitment entirely'],
    reflectionPrompts: ['Which track feels most like you today?'],
    expectedOutcomes: ['Career Track Assessment', 'FE Canvas v1'],
    activityCoachingNotes: [{ activityId: 'activity-day-4-canvas-workshop', note: 'Stand behind participant during strategy statement — ask who they serve.' }],
    debriefWithFaculty: ['Who is below 30% canvas?', 'Day 5 presentation pairs?'],
  },
});

// ─── DAY 5 ───────────────────────────────────────────────────────────────────
writeDayBundle('day-5', 5, {
  title: 'Day 5 — My Venture Direction',
  theme: 'Commitment',
  learningObjectives: [
    'Articulate 3-year venture vision with evidence from Week 1',
    'Present Venture Portfolio in Day 5 review format',
    'Commit to venture direction and Week 2 priorities',
    'Complete Week 1 mentor coaching summary',
  ],
  expectedOutputs: ['Venture Portfolio presentation', 'Venture Blueprint Week 1 draft', 'Week 1 Coaching Summary', 'Week 2 commitment'],
  portfolioDeliverables: ['Full Week 1 portfolio presentation', 'Venture identity + canvas + research'],
  businessPlanIntegration: 'Business Plan Chapter 1–3 synthesis — Week 1 draft',
  contributesToPortfolio: ['portfolio-identity-purpose', 'portfolio-financial-blueprint', 'portfolio-market-intelligence'],
  contributesToBusinessPlan: ['bp-chapter-1', 'bp-chapter-2', 'bp-chapter-3'],
  contributesToCompetencies: ['competency-visioning', 'competency-communication', 'competency-commitment'],
  surveyDescription: 'Week 1 closing pulse survey',
  surveyQuestions: [
    { id: 'sq-day-5-01', prompt: 'Rate your Week 1 clarity (1–5).', type: 'rating', required: true },
    { id: 'sq-day-5-02', prompt: 'What commitment are you making for Week 2?', type: 'long_text', required: true },
    { id: 'sq-day-5-03', prompt: 'What support do you need from your mentor?', type: 'long_text', required: true },
  ],
  assessment: { id: 'assessment-day-5-week1', title: 'Week 1 Venture Board Readiness', description: 'Portfolio presentation and Week 1 output completeness.', rubricId: 'rubric-day-5-presentation' },
  rubric: { id: 'rubric-day-5-presentation', title: 'Week 1 Portfolio Presentation Rubric', criteria: ['Identity complete (ambition, impact, values, future self)', 'Dream board and canvas present', 'Customer/market evidence shown', 'Clear commitment and Week 2 priority', 'Professional delivery'] },
  worksheets: [{ id: 'worksheet-day-5-commitment', title: 'Week 1 Commitment & Week 2 Priorities', questionIds: ['wq-d5-1', 'wq-d5-2', 'wq-d5-3'] }],
  worksheetQuestions: [
    { id: 'wq-d5-1', worksheetId: 'worksheet-day-5-commitment', prompt: 'In one sentence: what are you building?', type: 'short_text', required: true, sortOrder: 1 },
    { id: 'wq-d5-2', worksheetId: 'worksheet-day-5-commitment', prompt: 'Who do you serve — be specific?', type: 'short_text', required: true, sortOrder: 2 },
    { id: 'wq-d5-3', worksheetId: 'worksheet-day-5-commitment', prompt: 'What is your #1 priority for Week 2?', type: 'long_text', required: true, sortOrder: 3 },
  ],
  deck01: {
    title: 'Faculty Deck 01 — Week 1 Synthesis',
    slides: [
      slide('d5-01-01', 'Day 5 — Week 1 Commitment Day', 'Five days ago you heard three stories.\nYou built identity, discovered industry and customer, drafted your canvas.\n\nToday: present, commit, and launch Week 2.', 'Celebrate energy. 3 min.', ['What are you most proud of from Week 1?']),
      slide('d5-01-02', '3-Year Vision Review', 'Future self · Ambition · Impact · Career direction.\n\nYour presentation must show coherence — one venture story.', 'Reference portfolio presentation mode. 5 min.', ['Does your portfolio tell one story?']),
      slide('d5-01-03', 'Opportunity Mapping', 'Connect persona problems → canvas priorities → Week 2 research.\n\nVenture entrepreneurs show evidence, not hope.', '5 min.', ['What evidence supports your direction?']),
      slide('d5-01-04', 'Hour 200 Venture Board Preview', 'Segment 1 ends at Hour 200 Venture Board.\nWeek 1 is foundation — not the finish line.\n\nToday\'s presentation is practice for that gate.', '4 min.', ['What will Hour 200 look like for you?']),
      slide('d5-01-05', 'Deck 01 Close', 'Deck 02: presentation protocol and coaching summary.', '2 min.', ['Who presents first from your squad?']),
    ],
  },
  deck02: {
    title: 'Faculty Deck 02 — Portfolio Presentation & Commitment',
    slides: [
      slide('d5-02-01', 'Venture Portfolio Presentation Format', 'Use /my-venture-portfolio/present mode.\nSlides: Cover · Identity · Dream Board · Career · Canvas · Future Self · Commitment.\n\n5–7 minutes per participant or squad representative.', 'Demo presentation mode if possible. 5 min.', ['Which section is your strongest?']),
      slide('d5-02-02', 'Presentation Rubric', 'Faculty evaluates: identity, evidence, canvas, commitment, delivery.\nMentors complete Week 1 coaching summary during presentations.', 'Share rubric. 4 min.', ['What will you improve before Hour 200?']),
      slide('d5-02-03', 'Squad Pitch Rehearsal', 'Squads rehearse 3-minute squad story: market + persona + direction.', 'Squad breakout. 3 min intro.', ['What is your squad\'s unified thesis?']),
      slide('d5-02-04', 'Week 1 Commitment Ceremony', 'Each participant states one commitment aloud.\nMentor records in coaching summary.\n\nWeek 2 begins — industry execution, not more setup.', 'Close Week 1 with accountability. 5 min.', ['What commitment are you making today?']),
      slide('d5-02-05', 'Week 1 Close', '✓ Portfolio presented\n✓ Blueprint Week 1 draft\n✓ Mentor coaching summary\n✓ Week 2 priority set\n\nCongratulations — you are venture builders.', '3 min celebration.', ['What will you do in the next 24 hours?']),
    ],
  },
  activities: [
    activity('activity-day-5-portfolio-rehearsal', 'Venture Portfolio Rehearsal', 45,
      ['Participants run presentation mode individually.', 'Dyad feedback on clarity and pacing.', 'Faculty checks presentation-ready threshold.'],
      ['What slide needs the most work?', 'Is your story coherent in 5 minutes?', 'What question might faculty ask?'],
      ['Portfolio presentation mode'],
      ['Presentation-ready portfolio']),
    activity('activity-day-5-venture-presentations', 'Week 1 Portfolio Presentations', 90,
      ['Each participant or squad rep presents Venture Portfolio.', 'Faculty scores with presentation rubric.', 'Audience provides structured peer feedback.'],
      ['What presentation inspired you?', 'What evidence was most convincing?', 'What will you strengthen in Week 2?'],
      ['Presentation rubric', 'Timer'],
      ['Completed presentation']),
    activity('activity-day-5-squad-pitch', 'Squad Week 1 Pitch', 35,
      ['3-minute squad pitch: segment, persona, direction.', 'Mentor gives squad-level feedback.', 'Capture squad photo for portfolio.'],
      ['What is your squad\'s unified market thesis?', 'Where does squad need to improve collaboration?', 'What research continues in Week 2?'],
      ['Squad charter reference'],
      ['Squad pitch complete']),
    activity('activity-day-5-commitment-ceremony', 'Week 1 Commitment Ceremony', 30,
      ['Each participant states commitment aloud.', 'Complete commitment worksheet.', 'Mentor saves Week 1 coaching summary in app.'],
      ['What commitment will you keep?', 'Who will hold you accountable?', 'What do you need from your mentor in Week 2?'],
      ['Commitment worksheet', 'Mentor coaching summary form'],
      ['Week 1 Coaching Summary', 'Week 2 priority']),
  ],
  sessions: [
    { id: 'session-day-5-morning', sessionNumber: 1, title: 'Synthesis & Rehearsal', durationMinutes: 120, presentationIds: ['presentation-day-5-deck-01', 'presentation-day-5-deck-02'], activityIds: ['activity-day-5-portfolio-rehearsal'], worksheetIds: [], assessmentIds: [], reflectionIds: [], surveyIds: [] },
    { id: 'session-day-5-afternoon', sessionNumber: 2, title: 'Presentations & Commitment', durationMinutes: 120, presentationIds: [], activityIds: ['activity-day-5-venture-presentations', 'activity-day-5-squad-pitch', 'activity-day-5-commitment-ceremony'], worksheetIds: ['worksheet-day-5-commitment'], assessmentIds: ['assessment-day-5-week1'], reflectionIds: ['reflection-day-5-close'], surveyIds: ['survey-day-5'] },
  ],
  reflectionPrompts: ['What are you building?', 'Who do you serve?', 'What commitment are you making for Week 2?'],
  facilitator: {
    title: 'Facilitator Guide — Day 5: Commitment & Presentations',
    prepChecklist: ['Test portfolio presentation mode for all', 'Print presentation rubrics', 'Schedule presentation order', 'Brief mentors on coaching summary'],
    sessionFlow: [
      { time: '0:00–0:20', activity: 'Decks 01–02', notes: 'Celebrate Week 1.' },
      { time: '0:20–1:05', activity: 'Portfolio rehearsal', notes: 'Fix blockers before afternoon.' },
      { time: '1:05–2:35', activity: 'Presentations + squad pitches', notes: 'Use rubric.' },
      { time: '2:35–3:00', activity: 'Commitment ceremony + survey', notes: 'Mentor summaries due today.' },
    ],
    debriefQuestions: ['Who is portfolio-ready for Hour 200 trajectory?', 'Which squads need Week 2 intervention?', 'Mentor summaries complete?'],
    commonPitfalls: ['Rushing presentations', 'Vague commitments', 'Incomplete mentor summaries'],
    coachingTips: ['End with accountability', 'Link commitment to canvas priority #1'],
  },
  evaluations: [
    { id: 'rubric-day-5-venture-direction', type: 'rubric', title: 'Venture Direction Rubric', audience: 'faculty', criteria: [{ label: 'Direction clarity', indicators: ['Clear who they serve', 'Evidence-based', 'Committed path'] }], scale: ['Unclear', 'Emerging', 'Clear', 'Compelling'] },
    { id: 'rubric-day-5-portfolio-present', type: 'rubric', title: 'Portfolio Presentation Rubric', audience: 'faculty', criteria: [{ label: 'Presentation', indicators: ['Identity', 'Dream board', 'Canvas', 'Commitment', 'Delivery'] }], scale: ['Not ready', 'Developing', 'Ready', 'Exemplary'] },
    { id: 'observation-day-5-mentor', type: 'observation_form', title: 'Mentor Day 5 Final Observation', audience: 'mentor', observationAreas: ['Clarity', 'Confidence', 'Commitment', 'Direction'], fields: [{ id: 'commitment', label: 'Commitment', type: 'rating', max: 5 }, { id: 'summary', label: 'Week 1 summary note', type: 'long_text' }] },
    { id: 'reflection-day-5-mentor-summary', type: 'reflection_form', title: 'Mentor Week 1 Coaching Summary Template', audience: 'mentor', prompts: ['Participant ambition in their words', 'Greatest growth this week', 'Primary risk for Week 2', 'Recommended mentor action', 'Overall Week 1 recommendation'] },
  ],
  mentorGuide: {
    title: 'Mentor Guide — Day 5: Commitment',
    coachingObjective: 'Create clarity and commitment. Complete Week 1 coaching summary.',
    timing: { preSession: '15 min — review presentation order and rubric', duringSession: 'Observe presentations; take summary notes', postSession: '30 min — complete Week 1 coaching summary for each participant' },
    discussionQuestions: ['What are you building?', 'Who do you want to help?', 'What would success look like in three years?', 'What is your next step?', 'What commitment are you making?'],
    observationAreas: [
      { area: 'Clarity', lookFor: ['Coherent venture story'], warningSigns: ['Vague vision'] },
      { area: 'Confidence', lookFor: ['Presents without reading slides'], warningSigns: ['Fear of presenting'] },
      { area: 'Commitment', lookFor: ['Specific Week 2 action'], warningSigns: ['No accountability'] },
      { area: 'Direction', lookFor: ['Path aligned with evidence'], warningSigns: ['Contradictions across outputs'] },
    ],
    coachingTips: ['End with accountability: one action before next session', 'Complete Week 1 coaching summary in app', 'Celebrate specificity'],
    warningSigns: ['Vague vision with no measurable outcome', 'Fear of presenting to squad', 'Incomplete portfolio'],
    reflectionPrompts: ['What is one commitment you will keep this week?'],
    expectedOutcomes: ['Week 1 Coaching Summary', 'Venture Portfolio presentation', 'Week 2 commitment'],
    activityCoachingNotes: [
      { activityId: 'activity-day-5-venture-presentations', note: 'Note one strength and one gap per participant for summary.' },
      { activityId: 'activity-day-5-commitment-ceremony', note: 'Record exact commitment language participant uses aloud.' },
    ],
    debriefWithFaculty: ['All coaching summaries submitted?', 'Who needs Week 2 intensive support?', 'Squad health flags?'],
  },
});

console.log('generate-week1-phase2-content OK');
