/**
 * Isolated sample data for Program Coach / Mentor SPIKE Studio preview.
 * Uses a mock participant id — never synced to Supabase.
 */
import { ensureFormationStore, writeFormationStore } from '../cohortFormationStorage.js';
import { saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { DEFAULT_INTERVIEW_QUESTIONS } from './week2Constants.js';

export const COACH_WEEK2_STUDIO_PREVIEW_PARTICIPANT_ID = 'mock-coach-week2-studio-preview';
export const COACH_WEEK2_STUDIO_PREVIEW_SQUAD = 'Squad Catalyst';

const SEED_MARKER = 'spike_coach_week2_studio_preview_seed';
const SEED_VERSION = 'v1';

/** @param {string | null | undefined} id */
export function isCoachWeek2StudioPreviewParticipantId(id) {
  return id === COACH_WEEK2_STUDIO_PREVIEW_PARTICIPANT_ID;
}

/** @param {string} participantId @param {number} day */
export function isCoachWeek2StudioPreviewDayUnlocked(participantId, day) {
  if (!isCoachWeek2StudioPreviewParticipantId(participantId)) return null;
  return day >= 1 && day <= 5;
}

function seedPreviewSquadMembership(participantId) {
  const store = ensureFormationStore();
  const squadId = 'squad-coach-week2-preview';
  const existing = store.squads?.find((s) => s.id === squadId);
  if (!existing) {
    store.squads = [
      ...(store.squads ?? []),
      {
        id: squadId,
        name: COACH_WEEK2_STUDIO_PREVIEW_SQUAD,
        motto: 'Spark innovation. Execute with purpose.',
        members: [{ participantId, name: 'Preview Builder', joinedAt: new Date().toISOString() }],
        capacity: 6,
      },
    ];
  } else if (!existing.members?.some((m) => m.participantId === participantId)) {
    existing.members = [
      ...(existing.members ?? []),
      { participantId, name: 'Preview Builder', joinedAt: new Date().toISOString() },
    ];
  }
  writeFormationStore(store);
}

function seedPreviewDiscovery(participantId) {
  const now = new Date().toISOString();
  saveWeek2Discovery(participantId, {
    missionAcknowledged: true,
    assumptionsCompletedAt: now,
    guideCompletedAt: now,
    researchPlanSubmittedAt: now,
    squadAlignedAt: now,
    assumptions: [
      { id: 'a-1', belief: 'Young professionals will pay for bundled protection reviews.', priority: 'High' },
      { id: 'a-2', belief: 'Trust matters more than price in first conversations.', priority: 'Medium' },
    ],
    questions: DEFAULT_INTERVIEW_QUESTIONS.map((q, i) => ({
      ...q,
      text: q.text || `Sample interview question ${i + 1}`,
    })),
    fieldResearchPlan:
      'Tuesday AM: mall intercepts near BGC. PM: alumni network calls. Target 3 encodes per member.',
    squadDiscussionNotes: 'Agreed to test trust-first messaging before pitching products.',
    thinkingShifts: [
      {
        id: 'ts-preview',
        promptId: 'surprise',
        response: 'Customers want clarity on fees before discussing coverage amounts.',
      },
    ],
    interviews: [
      {
        id: 'iv-preview-1',
        alias: 'Jordan M.',
        occupation: 'BPO team lead',
        answers: [
          'Wants protection but confused by policy jargon.',
          'Prefers a friend referral over cold outreach.',
          'Would meet on weekends near home.',
          'Biggest fear is being oversold.',
          'Would share contact if follow-up is simple.',
        ],
        reflection: 'Trust and plain language beat feature lists.',
        encoded: true,
      },
      { id: 'iv-preview-2', alias: '', occupation: '', answers: [], reflection: '', encoded: false },
      { id: 'iv-preview-3', alias: '', occupation: '', answers: [], reflection: '', encoded: false },
    ],
    updatedAt: now,
  });
}

/** Seed local sample portfolio for coach SPIKE Studio walkthrough. */
export function ensureCoachWeek2StudioPreviewSeeded() {
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem(SEED_MARKER) === SEED_VERSION) return true;

  const participantId = COACH_WEEK2_STUDIO_PREVIEW_PARTICIPANT_ID;
  seedPreviewSquadMembership(participantId);
  seedPreviewDiscovery(participantId);
  localStorage.setItem(SEED_MARKER, SEED_VERSION);
  return true;
}

/** Clear and re-seed preview sandbox data. */
export function resetCoachWeek2StudioPreview() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SEED_MARKER);
  try {
    const key = 'spike_week2_discovery_v2';
    const raw = localStorage.getItem(key);
    if (raw) {
      const data = JSON.parse(raw);
      delete data[COACH_WEEK2_STUDIO_PREVIEW_PARTICIPANT_ID];
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch {
    /* ignore */
  }
  ensureCoachWeek2StudioPreviewSeeded();
}
