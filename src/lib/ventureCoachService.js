/**
 * AI Venture Coach™ — Blueprint sync and completion.
 */
import { setSectionField } from './blueprintSectionStore.js';
import { DAY1_ID } from './day1BuilderConstants.js';
import { writeBuilderEntry } from './day1BuilderStorage.js';
import { markActivityCompleted } from './playbookProgress.js';
import { COACH_SECTIONS } from './ventureCoachConstants.js';
import { ventureDirectionLabel } from './ventureCoachEngine.js';
import {
  completeCoachSection,
  getCoachProgress,
  getCoachProfile,
  getCoachSection,
  isCoachSectionEditLocked,
  markCoachStarted,
  patchCoachSection,
  reopenCoachSectionForRefinement,
  resetCoachSection,
} from './ventureCoachStorage.js';
import { polishCoachStatement, recordCoachLearning } from './ventureCoachLearning.js';
import {
  buildCoachTrainingLabels,
  coachTrainingSectionType,
  defaultCoachTrainingTask,
  insertCoachTrainingEvent,
} from './supabase/coachTraining.js';

export {
  getCoachProgress,
  getCoachProfile,
  getCoachSection,
  isCoachSectionEditLocked,
  markCoachStarted,
  patchCoachSection,
  resetCoachSection,
  reopenCoachSectionForRefinement,
};

/** @param {string} participantId @param {string} sectionId @param {Record<string, unknown>} data */
export function saveCoachSectionDraft(participantId, sectionId, data) {
  return patchCoachSection(participantId, sectionId, { data });
}

/**
 * @param {string} participantId
 * @param {string} sectionId
 * @param {string} finalText
 * @param {Record<string, unknown>} [extra]
 */
export function acceptCoachSection(participantId, sectionId, finalText, extra = {}) {
  const meta = COACH_SECTIONS.find((s) => s.id === sectionId);
  const section = getCoachSection(participantId, sectionId);
  const statementType = sectionId === 'purpose' ? 'impact' : sectionId;
  const polished =
    statementType === 'values' || statementType === 'venture-direction'
      ? finalText.trim()
      : polishCoachStatement(finalText, /** @type {'ambition' | 'impact' | 'tagline' | 'future-self'} */ (statementType));
  const draftVersions = [...(section.draftVersions ?? []), polished];

  patchCoachSection(participantId, sectionId, {
    data: { ...section.data, ...extra, finalText: polished },
    draftVersions,
  });

  if (['ambition', 'impact', 'purpose', 'tagline'].includes(sectionId)) {
    recordCoachLearning(participantId, sectionId, {
      fields: /** @type {Record<string, string>} */ (extra.customFields ?? section.data.customFields ?? {}),
      acceptedText: polished,
    });
  }

  syncSectionToBlueprint(participantId, sectionId, polished, extra);
  syncCoachSectionToDay1(participantId, sectionId, polished, extra);
  completeCoachSection(participantId, sectionId, meta?.badge ?? '');

  const trainingSection = coachTrainingSectionType(sectionId);
  if (trainingSection) {
    void insertCoachTrainingEvent(participantId, {
      sectionType: trainingSection,
      eventType: 'accepted',
      task: defaultCoachTrainingTask(sectionId),
      inputFields: {
        ...section.data,
        ...extra,
        customFields: extra.customFields ?? section.data.customFields ?? {},
      },
      inputLabels: buildCoachTrainingLabels(sectionId, extra, section.data),
      outputText: polished,
      variant: extra.selectedVariant ? String(extra.selectedVariant) : null,
    });
  }

  return getCoachProgress(participantId);
}

/** @param {string} participantId @param {string} sectionId @param {string} text @param {Record<string, unknown>} extra */
function syncSectionToBlueprint(participantId, sectionId, text, extra) {
  switch (sectionId) {
    case 'ambition':
      setSectionField(participantId, 'vision-purpose', 'vision_statement', text, {
        sourceType: 'venture_coach',
        sourceId: 'ambition',
      });
      break;
    case 'impact':
    case 'purpose':
      setSectionField(participantId, 'vision-purpose', 'mission_statement', text, {
        sourceType: 'venture_coach',
        sourceId: 'impact',
      });
      break;
    case 'values':
      setSectionField(participantId, 'vision-purpose', 'my_values', text, {
        sourceType: 'venture_coach',
        sourceId: 'values',
      });
      break;
    case 'tagline':
      setSectionField(participantId, 'vision-purpose', 'personal_tagline', text, {
        sourceType: 'venture_coach',
        sourceId: 'tagline',
      });
      break;
    case 'future-self':
      setSectionField(participantId, 'vision-purpose', 'future_self_narrative', text, {
        sourceType: 'venture_coach',
        sourceId: 'future-self',
      });
      if (extra.futureSelfSummary) {
        setSectionField(participantId, 'vision-purpose', 'future_self_summary', String(extra.futureSelfSummary), {
          sourceType: 'venture_coach',
          sourceId: 'future-self',
        });
      }
      break;
    case 'venture-direction': {
      const track = String(extra.track ?? 'undecided');
      setSectionField(participantId, 'career-accelerator', 'career_interest_explored', ventureDirectionLabel(track), {
        sourceType: 'venture_coach',
        sourceId: 'venture-direction',
      });
      break;
    }
    default:
      break;
  }
}

const DAY1_COACH_BUILDERS = {
  ambition: 'ambition-builder',
  impact: 'impact-builder',
  purpose: 'impact-builder',
  values: 'values-builder',
  tagline: 'tagline-builder',
  'future-self': 'future-self',
  'venture-direction': 'future-venture',
};

const DAY1_COACH_ACTIVITIES = {
  ambition: {
    id: 'activity-day-1-ambition-builder',
    title: 'Ambition Builder — Venture Coach™',
    outputs: ['Submitted ambition statement in Venture Blueprint'],
  },
  impact: {
    id: 'activity-day-1-impact-builder',
    title: 'Impact Builder — Venture Coach™',
    outputs: ['Submitted impact statement in Venture Blueprint'],
  },
  purpose: {
    id: 'activity-day-1-impact-builder',
    title: 'Impact Builder — Venture Coach™',
    outputs: ['Submitted impact statement in Venture Blueprint'],
  },
  values: {
    id: 'activity-day-1-values-builder',
    title: 'Values Builder — Venture Coach™',
    outputs: ['Submitted values profile in Venture Blueprint'],
  },
};

/** @param {string} participantId @param {string} sectionId @param {string} text @param {Record<string, unknown>} extra */
function syncCoachSectionToDay1(participantId, sectionId, text, extra) {
  const builderId = DAY1_COACH_BUILDERS[sectionId];
  if (!builderId) return;

  writeBuilderEntry(
    participantId,
    builderId,
    {
      via: 'ai_venture_coach',
      sectionId,
      finalText: text,
      ...extra,
    },
    true,
    { force: true },
  );

  const activity = DAY1_COACH_ACTIVITIES[sectionId];
  if (activity) {
    markActivityCompleted(participantId, activity.id, DAY1_ID, {
      title: activity.title,
      outputs: activity.outputs,
    });
  }
}

/** @param {string} participantId */
export function getCoachSummaryForMentor(participantId) {
  const profile = getCoachProfile(participantId);
  if (!profile) return null;
  const progress = getCoachProgress(participantId);
  const valuesData = profile.sections?.values?.data ?? {};
  const topThree = valuesData.topThree ?? [];
  return {
    progress,
    ambition: profile.sections?.ambition?.data?.finalText ?? '',
    impact:
      profile.sections?.impact?.data?.finalText ?? profile.sections?.purpose?.data?.finalText ?? '',
    /** @deprecated Use impact */
    purpose:
      profile.sections?.impact?.data?.finalText ?? profile.sections?.purpose?.data?.finalText ?? '',
    topThreeValues: topThree,
    valuesProfile: valuesData.valuesProfile ?? '',
    tagline: profile.sections?.tagline?.data?.finalText ?? '',
    futureSelfSummary: profile.sections?.['future-self']?.data?.futureSelfSummary ?? '',
    futureSelf: profile.sections?.['future-self']?.data?.finalText ?? '',
    ventureDirection: profile.sections?.['venture-direction']?.data?.track ?? '',
  };
}

export { aggregateCoachAnalytics } from './ventureCoachStorage.js';
