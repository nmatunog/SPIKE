/**
 * Venture Portfolio — aggregate intern-created identity artifacts for read-only showcase.
 */
import { DREAM_BOARD_CATEGORIES } from './day1BuilderConstants.js';
import { getBuilderData, isBuilderCompleted } from './day1BuilderService.js';
import { getSectionFields } from './blueprintSectionStore.js';
import { listPortfolioArtifacts } from './blueprintArtifacts.js';
import {
  COACH_VALUE_CARDS,
  VENTURE_DIRECTION_CARDS,
} from './ventureCoachConstants.js';
import { getCoachProgress, getCoachSummaryForMentor } from './ventureCoachService.js';

/** @param {string} participantId */
export function isVenturePortfolioReady(participantId) {
  return getCoachProgress(participantId).percent >= 100;
}

/** @param {string[]} ids */
function valueLabels(ids) {
  return ids
    .map((id) => COACH_VALUE_CARDS.find((card) => card.id === id)?.label)
    .filter(Boolean);
}

/** @param {string} participantId */
export function buildVenturePortfolio(participantId) {
  const coach = getCoachSummaryForMentor(participantId);
  const progress = coach?.progress ?? getCoachProgress(participantId);
  const visionFields = getSectionFields(participantId, 'vision-purpose');

  const dreamBoardData = getBuilderData(participantId, 'dream-board');
  const squadCharterData = getBuilderData(participantId, 'squad-charter');

  const dreamAssets = /** @type {Array<{ id: string, category: string, caption: string, imageUrl: string }>} */ (
    dreamBoardData?.assets ?? []
  );

  const trackId = coach?.ventureDirection ?? '';
  const ventureDirection =
    VENTURE_DIRECTION_CARDS.find((card) => card.id === trackId)?.label ?? trackId;

  const identityArtifacts = listPortfolioArtifacts(participantId, 'portfolio-identity-purpose');

  return {
    ready: progress.percent >= 100,
    progress,
    badges: progress.badges ?? [],
    ambition: coach?.ambition || visionFields.vision_statement || '',
    impact: coach?.impact || visionFields.mission_statement || '',
    valuesProfile: coach?.valuesProfile || visionFields.my_values || '',
    topThreeValues: valueLabels(coach?.topThreeValues ?? []),
    tagline: coach?.tagline || visionFields.personal_tagline || '',
    futureSelf: coach?.futureSelf || visionFields.future_self_narrative || '',
    futureSelfSummary: coach?.futureSelfSummary || visionFields.future_self_summary || '',
    ventureDirection,
    ventureDirectionId: trackId,
    dreamBoard: {
      completed: isBuilderCompleted(participantId, 'dream-board'),
      assets: dreamAssets,
      summary: visionFields.dream_board || '',
    },
    squadCharter: squadCharterData
      ? {
          completed: isBuilderCompleted(participantId, 'squad-charter'),
          squadName: String(squadCharterData.squadName ?? ''),
          mission: String(squadCharterData.mission ?? ''),
          teamMotto: String(squadCharterData.teamMotto ?? ''),
          teamCommitment: String(squadCharterData.teamCommitment ?? ''),
          signatureName: String(squadCharterData.signatureName ?? ''),
          signedAt: squadCharterData.signedAt ? String(squadCharterData.signedAt) : '',
          text: visionFields.squad_charter || '',
        }
      : null,
    identityArtifacts,
  };
}

/** @param {string} categoryId */
export function dreamBoardCategoryMeta(categoryId) {
  return DREAM_BOARD_CATEGORIES.find((category) => category.id === categoryId) ?? {
    id: categoryId,
    label: categoryId,
    color: 'bg-white border-slate-200',
  };
}
