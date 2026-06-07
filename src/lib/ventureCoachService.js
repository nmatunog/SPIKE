/**
 * AI Venture Coach™ — Blueprint sync and completion.
 */
import { setSectionField } from './blueprintSectionStore.js';
import { COACH_SECTIONS } from './ventureCoachConstants.js';
import { ventureDirectionLabel } from './ventureCoachEngine.js';
import {
  completeCoachSection,
  getCoachProgress,
  getCoachProfile,
  getCoachSection,
  markCoachStarted,
  patchCoachSection,
  resetCoachSection,
} from './ventureCoachStorage.js';

export {
  getCoachProgress,
  getCoachProfile,
  getCoachSection,
  markCoachStarted,
  patchCoachSection,
  resetCoachSection,
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
  const draftVersions = [...(section.draftVersions ?? []), finalText];

  patchCoachSection(participantId, sectionId, {
    data: { ...section.data, ...extra, finalText },
    draftVersions,
  });

  syncSectionToBlueprint(participantId, sectionId, finalText, extra);
  completeCoachSection(participantId, sectionId, meta?.badge ?? '');
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
    case 'purpose':
      setSectionField(participantId, 'vision-purpose', 'mission_statement', text, {
        sourceType: 'venture_coach',
        sourceId: 'purpose',
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
    purpose: profile.sections?.purpose?.data?.finalText ?? '',
    topThreeValues: topThree,
    valuesProfile: valuesData.valuesProfile ?? '',
    tagline: profile.sections?.tagline?.data?.finalText ?? '',
    futureSelfSummary: profile.sections?.['future-self']?.data?.futureSelfSummary ?? '',
    futureSelf: profile.sections?.['future-self']?.data?.finalText ?? '',
    ventureDirection: profile.sections?.['venture-direction']?.data?.track ?? '',
  };
}

export { aggregateCoachAnalytics } from './ventureCoachStorage.js';
