/**
 * One-time migration: legacy individual assessments → Squad XP reviews + intern notes.
 */
import { getParticipantSquad } from '../cohortFormationService.js';
import { listCoachingNotesForParticipant } from '../coachingService.js';
import { loadSquadDesignRecord } from '../ventureDesignStudioService.js';
import { groupInternsBySquad } from '../facultyMentorFrameworkService.js';
import { MENTOR_REVIEW_DIMENSIONS } from './squadXpConstants.js';
import {
  generateSquadCoachingSummary,
  getSquadMentorReview,
  getSquadStageGateDecision,
  saveSquadMentorReview,
  saveSquadStageGateDecision,
} from './squadXpService.js';
import { appendSquadInternNote, buildSquadInternNotesAppendix } from './squadInternNotesService.js';

const MIGRATION_MARKER = 'spike_squad_assessment_migration_v2';
const LEGACY_ASSESSMENTS_KEY = 'spike_weekly_mentor_assessments';
const LEGACY_RATINGS_KEY = 'spike_squad_ratings_v1';
const LEGACY_ENCODING_KEY = 'spike_mentor_encoding_responses';

/** @type {Record<string, keyof typeof DIMENSION_BUCKETS>} */
const CATEGORY_TO_DIMENSION = {
  identity_clarity: 'quality_of_learning',
  engagement: 'collaboration',
  coachability: 'professionalism',
  communication: 'professionalism',
  leadership_potential: 'collaboration',
};

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}

/** @param {Record<string, number>} scores */
export function mapLegacyScoresToDimensions(scores) {
  /** @type {Record<string, number[]>} */
  const buckets = {
    quality_of_learning: [],
    collaboration: [],
    professionalism: [],
    readiness_for_stage_gate: [],
  };

  for (const [cat, raw] of Object.entries(scores ?? {})) {
    const score = Number(raw);
    if (!Number.isFinite(score) || score <= 0) continue;
    if (cat === 'overall') {
      buckets.readiness_for_stage_gate.push(score);
      continue;
    }
    const dim = CATEGORY_TO_DIMENSION[cat];
    if (dim) buckets[dim].push(score);
  }

  /** @type {Record<string, number>} */
  const ratings = {};
  for (const dim of MENTOR_REVIEW_DIMENSIONS) {
    const vals = buckets[dim.id] ?? [];
    if (vals.length) {
      ratings[dim.id] = Math.min(
        5,
        Math.max(1, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)),
      );
    }
  }

  const overall = Number(scores?.overall ?? 0);
  if (overall > 0) {
    for (const dim of MENTOR_REVIEW_DIMENSIONS) {
      if (!ratings[dim.id]) ratings[dim.id] = Math.min(5, Math.max(1, Math.round(overall)));
    }
  }

  return ratings;
}

/** @param {string | undefined} recommendation @param {number} avgScore */
function recommendationToGate(recommendation, avgScore) {
  if (recommendation === 'needs_coaching' || avgScore < 2.5) return 'not_ready';
  if (recommendation === 'monitor_closely' || avgScore < 3.5) return 'almost_ready';
  if (recommendation === 'future_leader' || avgScore >= 4) return 'ready';
  return avgScore >= 3 ? 'almost_ready' : 'not_ready';
}

/** @param {string} participantId @param {object} assessment */
function migrateAssessmentNotes(participantId, assessment) {
  if (assessment.notes?.trim()) {
    appendSquadInternNote(participantId, {
      week: assessment.week ?? 1,
      source: 'Legacy weekly assessment',
      text: assessment.notes.trim(),
      mentorId: assessment.mentorId,
      migratedFrom: 'weekly_assessment',
      savedAt: assessment.updatedAt ?? assessment.createdAt,
    });
  }

  const rec = assessment.recommendation;
  if (rec && rec !== 'continue_normally') {
    const label =
      rec === 'needs_coaching'
        ? 'Mentor flagged: needs additional coaching'
        : rec === 'monitor_closely'
          ? 'Mentor flagged: monitor closely'
          : rec === 'future_leader'
            ? 'Mentor flagged: potential future leader'
            : rec;
    appendSquadInternNote(participantId, {
      week: assessment.week ?? 1,
      source: 'Mentor recommendation',
      text: label,
      mentorId: assessment.mentorId,
      migratedFrom: 'weekly_assessment_recommendation',
    });
  }
}

function migratePulseAndEncodingNotes() {
  const ratings = readJson(LEGACY_RATINGS_KEY);
  for (const [key, entry] of Object.entries(ratings)) {
    if (!key.startsWith('pulse:')) continue;
    const parts = key.split(':');
    const participantId = parts[2];
    const week = Number.parseInt(parts[3]?.replace('w', '') ?? '1', 10) || 1;
    if (entry.standoutNote?.trim()) {
      appendSquadInternNote(participantId, {
        week,
        source: 'Daily pulse note',
        text: entry.standoutNote.trim(),
        mentorId: entry.ratedBy,
        migratedFrom: 'participant_pulse',
        savedAt: entry.savedAt,
      });
    }
  }

  const encodings = readJson(LEGACY_ENCODING_KEY);
  for (const entry of Object.values(encodings)) {
    if (!entry?.participantId || entry.formType !== 'observation') continue;
    const answers = entry.answers ?? {};
    const note = String(answers.coaching_note ?? answers.notes ?? '').trim();
    if (note) {
      appendSquadInternNote(entry.participantId, {
        week: entry.week ?? 1,
        source: 'Observation note',
        text: note,
        mentorId: entry.staffId,
        migratedFrom: 'mentor_encoding',
        savedAt: entry.updatedAt ?? entry.createdAt,
      });
    }
  }
}

function migrateCoachingNotesToArchive() {
  const coaching = readJson('spike_coaching_sessions');
  for (const [participantId, sessions] of Object.entries(coaching)) {
    for (const session of sessions ?? []) {
      const text =
        session.discussionSummary?.trim()
        || session.notes?.trim()
        || session.strengths?.trim()
        || session.growthAreas?.trim();
      if (!text) continue;
      appendSquadInternNote(participantId, {
        week: session.week ?? 1,
        source: session.topic ? `Coaching: ${session.topic}` : 'Coaching session',
        text,
        mentorId: session.mentorId,
        migratedFrom: 'coaching_session',
        savedAt: session.createdAt,
      });
    }
  }
}

/** Also index coaching via service for hydrated data */
function migrateCoachingServiceArchive(participantIds) {
  for (const id of participantIds) {
    const notes = listCoachingNotesForParticipant(id);
    for (const session of notes) {
      if (session.discussionSummary?.trim() && session.discussionSummary !== session.notes) {
        appendSquadInternNote(id, {
          week: session.week ?? 1,
          source: 'Coaching summary',
          text: session.discussionSummary.trim(),
          mentorId: session.mentorId,
          migratedFrom: 'coaching_summary',
          savedAt: session.createdAt,
        });
      }
    }
  }
}

/**
 * @param {Array<{ id: string, name: string, squad?: string }>} [interns]
 */
export function migrateLegacyAssessmentsToSquadSystem(interns = []) {
  const assessments = readJson(LEGACY_ASSESSMENTS_KEY);
  /** @type {Map<string, { squadName: string, week: number, members: Array<{ id: string, name: string }>, ratings: Record<string, number[]>, mentorId: string, recommendations: string[] }>} */
  const squadWeeks = new Map();

  for (const [key, assessment] of Object.entries(assessments)) {
    if (!assessment?.participantId) continue;
    const week = assessment.week ?? (Number.parseInt(key.split(':w')[1] ?? '1', 10) || 1);
    migrateAssessmentNotes(assessment.participantId, assessment);

    const squadName =
      interns.find((i) => i.id === assessment.participantId)?.squad
      ?? getParticipantSquad(assessment.participantId)?.name
      ?? 'Unassigned';
    if (squadName === 'Unassigned') continue;

    const mapKey = `${squadName}:w${week}`;
    if (!squadWeeks.has(mapKey)) {
      squadWeeks.set(mapKey, {
        squadName,
        week,
        members: [],
        ratings: Object.fromEntries(MENTOR_REVIEW_DIMENSIONS.map((d) => [d.id, []])),
        mentorId: assessment.mentorId ?? '',
        recommendations: [],
      });
    }

    const bucket = squadWeeks.get(mapKey);
    const dims = mapLegacyScoresToDimensions(assessment.scores ?? {});
    for (const dim of MENTOR_REVIEW_DIMENSIONS) {
      if (dims[dim.id]) bucket.ratings[dim.id].push(dims[dim.id]);
    }
    if (assessment.recommendation) bucket.recommendations.push(assessment.recommendation);
    if (assessment.mentorId) bucket.mentorId = assessment.mentorId;
    if (!bucket.members.some((m) => m.id === assessment.participantId)) {
      bucket.members.push({
        id: assessment.participantId,
        name: interns.find((i) => i.id === assessment.participantId)?.name ?? assessment.participantId.slice(0, 8),
      });
    }
  }

  for (const squad of groupInternsBySquad(interns)) {
    for (const week of [1, 2, 3, 4, 5]) {
      const mapKey = `${squad.name}:w${week}`;
      if (squadWeeks.has(mapKey)) continue;
      const design = loadSquadDesignRecord(getParticipantSquad(squad.members[0]?.id)?.id ?? squad.name);
      if (!design?.mentorRating && !design?.mentorNotes?.trim()) continue;
      squadWeeks.set(mapKey, {
        squadName: squad.name,
        week,
        members: (squad.members ?? []).map((m) => ({ id: m.id, name: m.name })),
        ratings: Object.fromEntries(MENTOR_REVIEW_DIMENSIONS.map((d) => [d.id, []])),
        mentorId: '',
        recommendations: [],
        ventureRating: design.mentorRating,
        ventureNotes: design.mentorNotes ?? design.coachSummary ?? '',
      });
    }
  }

  for (const bucket of squadWeeks.values()) {
    if (getSquadMentorReview(bucket.squadName, bucket.week)) continue;

    /** @type {Record<string, number>} */
    const ratings = {};
    for (const dim of MENTOR_REVIEW_DIMENSIONS) {
      const vals = bucket.ratings[dim.id] ?? [];
      if (vals.length) {
        ratings[dim.id] = Math.min(
          5,
          Math.max(1, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)),
        );
      }
    }

    if (bucket.ventureRating && !ratings.readiness_for_stage_gate) {
      ratings.readiness_for_stage_gate = Math.min(5, Math.max(1, Math.round(bucket.ventureRating)));
    }
    if (Object.keys(ratings).length < MENTOR_REVIEW_DIMENSIONS.length && bucket.ventureRating) {
      for (const dim of MENTOR_REVIEW_DIMENSIONS) {
        if (!ratings[dim.id]) {
          ratings[dim.id] = Math.min(5, Math.max(1, Math.round(bucket.ventureRating)));
        }
      }
    }

    if (!Object.values(ratings).some((v) => v > 0)) continue;

    let aiSummary = generateSquadCoachingSummary(ratings, bucket.squadName);
    const appendix = buildSquadInternNotesAppendix(bucket.members, bucket.week);
    if (appendix) {
      aiSummary = `${aiSummary}\n\nIndividual notes (migrated):\n${appendix}`;
    }
    if (bucket.ventureNotes?.trim()) {
      aiSummary = `${aiSummary}\n\nVenture design notes: ${bucket.ventureNotes.trim()}`;
    }

    saveSquadMentorReview(bucket.mentorId || 'migration', bucket.squadName, bucket.week, {
      ratings,
      aiSummary,
    });

    if (!getSquadStageGateDecision(bucket.squadName, bucket.week)) {
      const avg =
        Object.values(ratings).reduce((a, b) => a + b, 0) / MENTOR_REVIEW_DIMENSIONS.length;
      const rec = bucket.recommendations[bucket.recommendations.length - 1];
      saveSquadStageGateDecision(
        bucket.mentorId || 'migration',
        bucket.squadName,
        bucket.week,
        recommendationToGate(rec, avg),
      );
    }
  }

  migratePulseAndEncodingNotes();
  migrateCoachingNotesToArchive();
  migrateCoachingServiceArchive(interns.map((i) => i.id));

  return squadWeeks.size;
}

/** @param {Array<{ id: string, name: string, squad?: string }>} [interns] */
export function ensureSquadAssessmentMigration(interns = []) {
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem(MIGRATION_MARKER) === 'done') return false;
  migrateLegacyAssessmentsToSquadSystem(interns);
  localStorage.setItem(MIGRATION_MARKER, 'done');
  return true;
}

export function isSquadAssessmentMigrationComplete() {
  try {
    return localStorage.getItem(MIGRATION_MARKER) === 'done';
  } catch {
    return false;
  }
}
