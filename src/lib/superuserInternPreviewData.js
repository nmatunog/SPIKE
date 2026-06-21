/**
 * Sample venture portfolio data for superuser intern preview.
 * Stored under a stable mock participant id (skipped by Supabase hydration).
 */
import { CANVAS_ENGINES } from './blueprintSectionConstants.js';
import { createPortfolioArtifactDraft } from './blueprintArtifacts.js';
import { setSectionField } from './blueprintSectionStore.js';
import { ensureFormationStore, writeFormationStore } from './cohortFormationStorage.js';
import { saveCanvasField } from './canvasService.js';
import { saveCanvasSummary } from './canvasSummaryService.js';
import { clearBuilderEntry, writeBuilderEntry } from './day1BuilderStorage.js';
import { savePortfolioSettings } from './portfolioStorage.js';
import { saveSurveyResponseLocal } from './surveyService.js';
import {
  completeCoachSection,
  markCoachStarted,
  patchCoachSection,
} from './ventureCoachStorage.js';
import { COACH_SECTIONS } from './ventureCoachConstants.js';

export const SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID = 'mock-superuser-intern-preview';
export const SUPERUSER_INTERN_PREVIEW_SEED_VERSION = 'v3';
const SEEDED_MARKER_KEY = 'spike_superuser_intern_preview_seed';
const PROGRESS_PATCH_KEY = 'spike_superuser_intern_preview_progress';

/** @param {string | null | undefined} userId */
export function isSuperuserInternPreviewParticipantId(userId) {
  return userId === SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID;
}

export function readSuperuserInternPreviewProgressPatch() {
  try {
    const raw = localStorage.getItem(PROGRESS_PATCH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** @param {Record<string, unknown>} patch */
export function updateSuperuserInternPreviewProgress(patch) {
  if (typeof localStorage === 'undefined') return null;
  const merged = {
    ...SUPERUSER_INTERN_PREVIEW_PROGRESS,
    ...readSuperuserInternPreviewProgressPatch(),
    ...patch,
  };
  localStorage.setItem(PROGRESS_PATCH_KEY, JSON.stringify(merged));
  return merged;
}

export function clearSuperuserInternPreviewProgressPatch() {
  try {
    localStorage.removeItem(PROGRESS_PATCH_KEY);
  } catch {
    /* ignore */
  }
}

export const SUPERUSER_INTERN_PREVIEW_PROGRESS = {
  segment: 1,
  hours: 12,
  licensed: false,
  squad: 'Squad Catalyst',
  university: 'SPIKE Founding Cohort 2026',
  career_track: 'undecided',
  career_track_selected_at: null,
  current_week: 1,
  current_day: null,
  onboarding_complete: true,
  onboarding_welcomed_at: '2026-02-01T08:00:00.000Z',
  cohort_id: 'cohort-sample-2026',
};

const SAMPLE_NAME = 'Alex Rivera';
const SAMPLE_TAGLINE = 'Protect. Grow. Lead.';

const SAMPLE_AMBITION =
  'Build a thriving financial services agency that helps Filipino families achieve lasting protection and wealth.';

const SAMPLE_IMPACT =
  'Empower young professionals and families with clarity, confidence, and customized financial plans.';

const SAMPLE_VALUES_PROFILE =
  'Integrity guides every recommendation. Service means listening first. Growth is a commitment to learning and leading.';

const SAMPLE_FUTURE_SELF = `By 2030 I lead a district agency of twelve advisors serving more than four hundred families across Metro Manila and Cavite. My team is known for ethical advice, consistent follow-through, and community workshops that make insurance literacy accessible.

I balance field work with mentorship — developing two unit managers who run their own squads. My income is diversified across protection, investments, and agency bonuses. I travel twice a year with my family and sponsor two scholars annually.

This future is built on the SPIKE habits I practiced as an intern: daily prospecting, structured FNAs, squad research discipline, and a Financial Entrepreneurship Canvas that keeps strategy visible every quarter.`;

const SAMPLE_FUTURE_SELF_SUMMARY = 'District agency director serving 400+ families by 2030.';

const CANVAS_SAMPLE = {
  client_growth: {
    customer_segments:
      'Young professionals (25–35) in BPO and tech; newly married couples; first-time parents in Cavite and Laguna.',
    value_proposition:
      'Holistic protection reviews with plain-language education, annual check-ins, and digital follow-up between meetings.',
    channels:
      'Employee benefits introductions, LinkedIn content, alumni networks, squad referral circles, and weekend community seminars.',
    client_relationships:
      'Trusted advisor model — quarterly reviews, milestone celebrations, and proactive policy servicing.',
    revenue_streams:
      'Life and health protection premiums, VUL allocations, rider upgrades, and referral partnerships with allied professionals.',
  },
  talent_growth: {
    talent_segments:
      'Career shifters, fresh graduates, and part-time entrepreneurs seeking flexible income with mentorship.',
    recruit_value_proposition:
      'Structured SPIKE training, squad accountability, and a clear path from intern to unit manager within 36 months.',
    recruitment_channels:
      'University partnerships, intern peer referrals, social proof campaigns, and advisor shadow days.',
    talent_development_system:
      'Weekly skill labs, FNA practice pairs, field ride-alongs, and milestone boards at hours 200, 400, and 600.',
  },
  leadership_growth: {
    culture_statement:
      'We lead with integrity, celebrate small wins, and protect client trust above short-term volume.',
    leadership_system:
      'Monday huddles, monthly business reviews, peer coaching triads, and transparent KPI dashboards.',
    expansion_strategy:
      'Open a satellite office in South Luzon after two stable unit managers graduate; recruit in cohorts of four.',
    growth_multipliers:
      'Digital prospecting playbooks, client advocacy referrals, and cross-sell triggers tied to life milestones.',
  },
  foundation: {
    resources:
      'CRM pipeline, illustration software, SPIKE playbook library, squad research repository, mentor office hours.',
    partners:
      'Program coaches, compliance officers, underwriting specialists, and community organization co-hosts.',
    cost_structure:
      'Office stipend, marketing fund, training subscriptions, travel for field visits, and technology tools.',
  },
};

const RESEARCH_ARTIFACTS = [
  {
    sectionId: 'portfolio-market-intelligence',
    title: 'Young Professionals Market Interview Summary',
    content:
      '12 interviews surfaced three themes: income volatility, low insurance literacy, and desire for advisor-led education rather than product pitches. Top pain point: confusion between investment and protection products.',
    sourceId: 'sample-interview-summary',
  },
  {
    sectionId: 'portfolio-market-intelligence',
    title: 'Gen Z Financial Anxiety Insight Report',
    content:
      'Survey of 24 respondents: 71% worry about emergency funds; 58% want starter protection under ₱2,000/month; 63% prefer digital scheduling with in-person FNA for major decisions.',
    sourceId: 'sample-insight-report',
  },
  {
    sectionId: 'portfolio-market-intelligence',
    title: 'Customer Persona — First-Time Policyholder',
    content:
      'Persona: 28-year-old BPO team lead, ₱35k monthly income, supporting parents. Needs: hospitalization cover, starter investment, clear comparison of options. Trust drivers: transparency and follow-up.',
    sourceId: 'sample-persona-1',
  },
  {
    sectionId: 'portfolio-identity-purpose',
    title: 'Venture Identity Statement',
    content:
      'I am building an agency brand centered on education-first advice for emerging professionals — combining protection, disciplined savings, and leadership development.',
    sourceId: 'sample-identity-artifact',
  },
];

/** @param {string} participantId */
function seedCoachProfile(participantId) {
  markCoachStarted(participantId);

  const sections = {
    ambition: {
      data: {
        rankedMotivators: ['entrepreneurship', 'leadership', 'financial_freedom'],
        finalText: SAMPLE_AMBITION,
      },
    },
    impact: {
      data: {
        audiences: ['families', 'young_professionals', 'communities'],
        finalText: SAMPLE_IMPACT,
      },
    },
    values: {
      data: {
        topThree: ['integrity', 'service', 'growth'],
        valuesProfile: SAMPLE_VALUES_PROFILE,
      },
    },
    tagline: {
      data: { finalText: SAMPLE_TAGLINE },
    },
    'future-self': {
      data: {
        finalText: SAMPLE_FUTURE_SELF,
        futureSelfSummary: SAMPLE_FUTURE_SELF_SUMMARY,
        goals: ['leading_team', 'building_business', 'supporting_family'],
        incomeGoal: '250000',
      },
    },
    'venture-direction': {
      data: { track: 'agency_builder', finalText: 'Agency Builder' },
    },
  };

  for (const section of COACH_SECTIONS) {
    const payload = sections[section.id];
    if (!payload) continue;
    patchCoachSection(participantId, section.id, payload);
    completeCoachSection(participantId, section.id, section.badge);
  }
}

/** @param {string} participantId */
function seedBlueprintSections(participantId) {
  setSectionField(participantId, 'vision-purpose', 'vision_statement', SAMPLE_AMBITION);
  setSectionField(participantId, 'vision-purpose', 'mission_statement', SAMPLE_IMPACT);
  setSectionField(participantId, 'vision-purpose', 'my_values', SAMPLE_VALUES_PROFILE);
  setSectionField(participantId, 'vision-purpose', 'personal_tagline', SAMPLE_TAGLINE);
  setSectionField(participantId, 'vision-purpose', 'future_self_narrative', SAMPLE_FUTURE_SELF);
  setSectionField(participantId, 'vision-purpose', 'future_self_summary', SAMPLE_FUTURE_SELF_SUMMARY);
  setSectionField(
    participantId,
    'vision-purpose',
    'cohort_identity',
    'Cohort: SPIKE Founding Cohort 2026 · Theme: Entrepreneurship · Motto: Build Better.',
  );
  setSectionField(
    participantId,
    'vision-purpose',
    'squad_preferences',
    'Ranked: Catalyst, Nexus, Momentum — selected Catalyst for innovation focus.',
  );
  setSectionField(
    participantId,
    'vision-purpose',
    'squad_charter',
    'Squad Catalyst — We research boldly, present clearly, and support every member\'s Hour 200 milestone.',
  );
  setSectionField(
    participantId,
    'vision-purpose',
    'growth_reflections',
    'Week 4 reflection: Client conversations improved after simplifying FNA language and using visual summaries.',
  );

  setSectionField(participantId, 'market-intelligence', 'survey_count', '3');
  setSectionField(
    participantId,
    'market-intelligence',
    'research_findings',
    'Young professionals prioritize affordable hospitalization and starter investment clarity. Trust increases with structured annual reviews.',
  );
  setSectionField(
    participantId,
    'market-intelligence',
    'market_segment_insights',
    'BPO segment shows high digital engagement; couples segment values joint planning sessions on weekends.',
  );
  setSectionField(
    participantId,
    'market-intelligence',
    'opportunity_notes',
    'Opportunity: employer lunch-and-learn series co-hosted with squad research deliverables.',
  );

  setSectionField(participantId, 'client-growth', 'completed_fnas', '4');
  setSectionField(
    participantId,
    'client-growth',
    'client_profiles_summary',
    'Four FNAs completed — two young professionals, one newlywed couple, one single parent. Common gap: emergency fund before investment allocation.',
  );
  setSectionField(
    participantId,
    'client-growth',
    'protection_gaps_summary',
    'Recurring gaps: inadequate hospitalization cover, no income protection, outdated beneficiary designations.',
  );

  setSectionField(
    participantId,
    'recruitment-growth',
    'talent_segments',
    'University graduates and career shifters seeking mentorship-based agency entry.',
  );
  setSectionField(
    participantId,
    'leadership-growth',
    'culture_statement',
    'Education-first culture with measurable follow-up and peer accountability.',
  );
  setSectionField(participantId, 'career-accelerator', 'current_position', 'Advisor');
  setSectionField(participantId, 'career-accelerator', 'next_milestone', 'Associate Unit Manager');
}

/** @param {string} participantId */
function seedCanvas(participantId) {
  for (const [engineKey, engine] of Object.entries(CANVAS_ENGINES)) {
    const values = CANVAS_SAMPLE[engineKey] ?? {};
    for (const field of engine.fields) {
      const value = values[field.key];
      if (value) saveCanvasField(participantId, engineKey, field.key, value);
    }
  }

  saveCanvasSummary(participantId, {
    strategy_statement:
      'Grow a protection-first agency for young professionals through squad-led research, disciplined FNAs, and referral flywheels.',
    strategy_is_auto: false,
    priority_1: 'Complete Hour 200 Venture Board with 6 validated client conversations',
    priority_2: 'Recruit first associate advisor from university pipeline',
    priority_3: 'Launch monthly community literacy workshop series',
    year1_goal: '120 active clients · ₱1.2M annualized premium · 2 recruits',
    year2_goal: 'Unit manager promotion · satellite team of 6 advisors',
    year3_goal: 'District agency recognition · 400+ families served',
  });
}

/** @param {string} participantId */
function seedDay1Builders(participantId) {
  writeBuilderEntry(
    participantId,
    'squad-charter',
    {
      squadName: 'Squad Catalyst',
      mission: 'Research young professional markets and deliver board-ready venture insights.',
      teamMotto: 'Spark innovation. Execute with purpose.',
      signatureName: SAMPLE_NAME,
    },
    true,
  );
}

/** @param {string} participantId */
function seedResearchArtifacts(participantId) {
  for (const artifact of RESEARCH_ARTIFACTS) {
    createPortfolioArtifactDraft({
      participantId,
      sectionId: artifact.sectionId,
      title: artifact.title,
      content: artifact.content,
      sourceType: 'preview_seed',
      sourceId: artifact.sourceId,
    });
  }

  saveSurveyResponseLocal(
    participantId,
    'week1-market-survey',
    { q1: 'High anxiety about emergency funds', q2: 'Prefer advisor education first' },
    'day-2',
  );
  saveSurveyResponseLocal(
    participantId,
    'gen-z-protection-survey',
    { q1: 'Starter cover under 2000', q2: 'Digital scheduling preferred' },
    'day-3',
  );
  saveSurveyResponseLocal(
    participantId,
    'family-planning-survey',
    { q1: 'Joint planning sessions valued', q2: 'Hospitalization is top priority' },
    'day-4',
  );
}

/** @param {string} participantId */
function seedFnaRecords(participantId) {
  const records = [
    {
      id: 'fna-sample-1',
      participantId,
      clientName: 'Miguel Santos',
      status: 'completed',
      completedAt: '2026-03-01T10:00:00.000Z',
      protectionScore: 62,
      notes: 'Starter hospitalization and income protection package presented.',
    },
    {
      id: 'fna-sample-2',
      participantId,
      clientName: 'Grace & Paolo Reyes',
      status: 'completed',
      completedAt: '2026-03-08T11:30:00.000Z',
      protectionScore: 71,
      notes: 'Joint plan with education fund allocation and term cover.',
    },
  ];

  const all = JSON.parse(localStorage.getItem('spike_fna_records') || '{}');
  all[participantId] = records;
  localStorage.setItem('spike_fna_records', JSON.stringify(all));
}

/** @param {string} participantId */
function seedSquadMembership(participantId) {
  const store = ensureFormationStore();
  const squadId = 'squad-sample-catalyst';
  const existing = store.squads?.find((s) => s.id === squadId);
  if (!existing) {
    store.squads = [
      ...(store.squads ?? []),
      {
        id: squadId,
        cohortId: 'cohort-sample-2026',
        themeItemId: 'catalyst',
        name: 'Squad Catalyst',
        researchMarket: 'young_professionals',
        status: 'active',
        members: [
          { participantId, name: SAMPLE_NAME, role: 'Leader' },
          { participantId: 'mock-peer-1', name: 'Jamie Cruz', role: 'Research Lead' },
          { participantId: 'mock-peer-2', name: 'Sam Dela Rosa', role: 'Presentation Lead' },
        ],
      },
    ];
  } else if (!existing.members?.some((m) => m.participantId === participantId)) {
    existing.members = [
      ...(existing.members ?? []),
      { participantId, name: SAMPLE_NAME, role: 'Leader' },
    ];
  }

  store.charters = {
    ...(store.charters ?? {}),
    [squadId]: {
      squadId,
      motto: 'Spark innovation. Execute with purpose.',
      commitment_statement:
        'We commit to rigorous research, clear presentations, and supporting every member through Hour 200.',
      status: 'complete',
      signatures: [{ participantId, name: SAMPLE_NAME, signedAt: '2026-02-04T09:00:00.000Z' }],
    },
  };

  store.officialCohort = store.officialCohort ?? {
    id: 'cohort-sample-2026',
    name: 'SPIKE Founding Cohort 2026',
    theme_statement: 'Entrepreneurship',
    motto: 'Build Better.',
    year: 2026,
    batch: 'A',
    status: 'approved',
    approvedAt: '2026-02-01T08:00:00.000Z',
  };

  writeFormationStore(store);
}

/** @param {string} participantId */
function seedPortfolioSettings(participantId) {
  savePortfolioSettings(participantId, {
    privacy: 'share_link',
    slug: 'alex-rivera-sample',
    photoUrl: '',
  });
}

/** @param {string} [participantId] */
export function seedSuperuserInternPortfolio(
  participantId = SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
) {
  if (typeof localStorage === 'undefined') return false;

  seedCoachProfile(participantId);
  seedBlueprintSections(participantId);
  seedCanvas(participantId);
  seedDay1Builders(participantId);
  seedResearchArtifacts(participantId);
  seedFnaRecords(participantId);
  seedSquadMembership(participantId);
  seedPortfolioSettings(participantId);

  localStorage.setItem(SEEDED_MARKER_KEY, SUPERUSER_INTERN_PREVIEW_SEED_VERSION);
  return true;
}

export function ensureSuperuserInternPreviewSeeded() {
  if (typeof localStorage === 'undefined') return;
  const marker = localStorage.getItem(SEEDED_MARKER_KEY);
  if (marker === SUPERUSER_INTERN_PREVIEW_SEED_VERSION) return;
  clearSuperuserInternPreviewProgressPatch();
  seedSuperuserInternPortfolio();
}

export function isSuperuserInternPreviewSeeded() {
  try {
    return localStorage.getItem(SEEDED_MARKER_KEY) === SUPERUSER_INTERN_PREVIEW_SEED_VERSION;
  } catch {
    return false;
  }
}

/** Clear Alex Rivera sample dream board so the builder can be demoed fresh. */
export function resetSuperuserInternDreamBoard(
  participantId = SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID,
) {
  if (typeof localStorage === 'undefined') return false;
  clearBuilderEntry(participantId, 'dream-board');
  setSectionField(participantId, 'vision-purpose', 'dream_board', '', {
    sourceType: 'day1_builder',
    sourceId: 'dream-board',
  });
  return true;
}
