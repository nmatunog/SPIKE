import {
  AMBITION_MOTIVATOR_CARDS,
  COACH_VALUE_CARDS,
  FUTURE_SELF_GOALS,
  IMPACT_AUDIENCES,
  INCOME_SLIDER_LABELS,
} from '../ventureCoachConstants.js';
import { labelFor } from '../ventureCoachEngine.js';
import { pickTopRagExamples } from '../../../shared/coachAi/rag.js';
import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RAG_CACHE_MS = 5 * 60 * 1000;

/** @type {Map<string, { at: number, examples: Array<Record<string, unknown>> }>} */
const ragCache = new Map();

/** @param {string} participantId */
export function isCoachTrainingParticipantId(participantId) {
  return UUID_RE.test(String(participantId ?? ''));
}

/**
 * @param {string} sectionId
 * @param {Record<string, unknown>} extra
 * @param {Record<string, unknown>} sectionData
 */
export function buildCoachTrainingLabels(sectionId, extra = {}, sectionData = {}) {
  switch (sectionId) {
    case 'ambition': {
      const motivatorIds = /** @type {string[]} */ (
        extra.rankedMotivators ?? extra.selectedMotivators ?? sectionData.rankedMotivators ?? []
      );
      const customFields = /** @type {Record<string, string>} */ (
        extra.customFields ?? sectionData.customFields ?? {}
      );
      return {
        motivators: motivatorIds.map((id) => labelFor(id, AMBITION_MOTIVATOR_CARDS)).join(', '),
        role: customFields.role ?? '',
        contribution: customFields.contribution ?? '',
        mark: customFields.mark ?? '',
      };
    }
    case 'impact':
    case 'purpose': {
      const audienceIds = /** @type {string[]} */ (extra.audiences ?? sectionData.audiences ?? []);
      const customFields = /** @type {Record<string, string>} */ (
        extra.customFields ?? sectionData.customFields ?? {}
      );
      return {
        audiences: audienceIds.map((id) => labelFor(id, IMPACT_AUDIENCES)).join(', '),
        audience: customFields.audience ?? '',
        outcome: customFields.outcome ?? '',
      };
    }
    case 'tagline': {
      const customFields = /** @type {Record<string, string>} */ (
        extra.customFields ?? sectionData.customFields ?? {}
      );
      return {
        word1: customFields.word1 ?? '',
        word2: customFields.word2 ?? '',
        word3: customFields.word3 ?? '',
      };
    }
    case 'values': {
      const topThree = /** @type {string[]} */ (extra.topThree ?? sectionData.topThree ?? []);
      return {
        values: topThree.map((id, index) => `${index + 1}. ${labelFor(id, COACH_VALUE_CARDS)}`).join(', '),
      };
    }
    case 'future-self': {
      const goals = /** @type {string[]} */ (extra.goals ?? sectionData.goals ?? []);
      const incomeLevel = Number(extra.incomeLevel ?? sectionData.incomeLevel ?? 3);
      const income =
        INCOME_SLIDER_LABELS.find((item) => item.value === incomeLevel)?.label ?? 'High performer';
      return {
        goals: goals.map((id) => labelFor(id, FUTURE_SELF_GOALS)).join(', '),
        income,
        impact: String(extra.impact ?? sectionData.impact ?? ''),
        successVision: String(extra.successVision ?? sectionData.successVision ?? ''),
      };
    }
    default:
      return {};
  }
}

/** @param {string} sectionId */
export function coachTrainingSectionType(sectionId) {
  if (sectionId === 'purpose') return 'impact';
  if (['ambition', 'impact', 'tagline', 'values', 'future-self'].includes(sectionId)) return sectionId;
  return null;
}

/** @param {string} sectionId */
export function defaultCoachTrainingTask(sectionId) {
  switch (sectionId) {
    case 'ambition':
      return 'generate_ambition';
    case 'impact':
    case 'purpose':
      return 'generate_impact';
    case 'tagline':
      return 'generate_tagline';
    case 'values':
      return 'generate_values';
    case 'future-self':
      return 'generate_future_self';
    default:
      return 'refine_statement';
  }
}

/**
 * @param {string} participantId
 * @param {{
 *   sectionType: string,
 *   eventType?: 'accepted' | 'regenerated',
 *   task?: string,
 *   inputFields?: Record<string, unknown>,
 *   inputLabels?: Record<string, unknown>,
 *   outputText: string,
 *   variant?: string | null,
 * }} event
 */
export async function insertCoachTrainingEvent(participantId, event) {
  if (!isSupabaseConfigured || !supabase || !isCoachTrainingParticipantId(participantId)) return null;

  const { error } = await supabase.from('coach_training_events').insert({
    participant_id: participantId,
    section_type: event.sectionType,
    event_type: event.eventType ?? 'accepted',
    task: event.task ?? defaultCoachTrainingTask(event.sectionType),
    input_fields: event.inputFields ?? {},
    input_labels: event.inputLabels ?? {},
    output_text: event.outputText,
    variant: event.variant ?? null,
  });

  if (error) {
    const missing =
      error.code === 'PGRST202' ||
      error.code === '42P01' ||
      /not find|404|schema cache/i.test(String(error.message ?? ''));
    if (!missing) {
      console.warn('[coachTraining] insert failed:', error.message);
    }
    return null;
  }

  ragCache.delete(event.sectionType);
  return true;
}

/**
 * @param {string} sectionType
 * @param {Record<string, unknown>} queryLabels
 * @param {number} [topK]
 */
export async function fetchCoachRagExamplesForPrompt(sectionType, queryLabels, topK = 3) {
  if (!isSupabaseConfigured || !supabase || !sectionType) return [];

  const cached = ragCache.get(sectionType);
  if (cached && Date.now() - cached.at < RAG_CACHE_MS) {
    return pickTopRagExamples(cached.examples, queryLabels, topK);
  }

  const { data, error } = await supabase.rpc('fetch_coach_rag_examples', {
    p_section_type: sectionType,
    p_limit: 50,
  });

  if (error) {
    const missing =
      error.code === 'PGRST202' ||
      error.code === '42P01' ||
      /not find|404|schema cache/i.test(String(error.message ?? ''));
    if (!missing) {
      console.warn('[coachTraining] RAG fetch failed:', error.message);
    }
    return [];
  }

  const examples = data ?? [];
  ragCache.set(sectionType, { at: Date.now(), examples });
  return pickTopRagExamples(examples, queryLabels, topK);
}

/**
 * @param {{
 *   task: string,
 *   statementType?: string,
 *   fields?: Record<string, string>,
 * }} input
 */
export function buildCoachRagQueryLabels(input) {
  const fields = input.fields ?? {};

  if (input.task === 'generate_ambition' || input.task === 'regenerate_ambition') {
    return {
      motivators: fields.motivators ?? '',
      role: fields.role ?? '',
      contribution: fields.contribution ?? '',
      mark: fields.mark ?? '',
    };
  }

  if (input.task === 'generate_impact' || input.task === 'regenerate_impact' || input.task === 'regenerate_purpose') {
    return {
      audiences: fields.audiences ?? '',
      audience: fields.audience ?? '',
      outcome: fields.outcome ?? '',
    };
  }

  if (input.task === 'generate_tagline' || input.task === 'regenerate_tagline') {
    return {
      ambition: fields.ambition ?? '',
      impact: fields.impact ?? '',
      values: fields.values ?? '',
      word1: fields.word1 ?? '',
      word2: fields.word2 ?? '',
      word3: fields.word3 ?? '',
    };
  }

  if (input.task === 'generate_values') {
    return { values: fields.values ?? '' };
  }

  if (input.task === 'generate_future_self') {
    return {
      goals: fields.goals ?? '',
      income: fields.income ?? '',
      impact: fields.impact ?? '',
      successVision: fields.successVision ?? '',
    };
  }

  return { section: input.statementType ?? '', draft: fields.draft ?? '' };
}

/** @param {{ task: string, statementType?: string }} input */
export function coachRagSectionTypeForTask(input) {
  const { task, statementType } = input;
  if (task === 'generate_ambition' || task === 'regenerate_ambition' || statementType === 'ambition') {
    return 'ambition';
  }
  if (
    task === 'generate_impact' ||
    task === 'regenerate_impact' ||
    task === 'regenerate_purpose' ||
    statementType === 'impact' ||
    statementType === 'purpose'
  ) {
    return 'impact';
  }
  if (task === 'generate_tagline' || task === 'regenerate_tagline' || statementType === 'tagline') {
    return 'tagline';
  }
  if (task === 'generate_values' || statementType === 'values') {
    return 'values';
  }
  if (task === 'generate_future_self' || statementType === 'future-self') {
    return 'future-self';
  }
  return null;
}

/**
 * @param {{
 *   task: string,
 *   statementType?: string,
 *   fields?: Record<string, string>,
 * }} input
 */
export async function loadCoachRagExamples(input) {
  const sectionType = coachRagSectionTypeForTask(input);
  if (!sectionType) return [];

  const queryLabels = buildCoachRagQueryLabels(input);
  return fetchCoachRagExamplesForPrompt(sectionType, queryLabels, 3);
}
