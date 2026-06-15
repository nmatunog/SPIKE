/**
 * Score how much substantive work an intern has in browser localStorage.
 */
import { getDay1MissionProgress } from './day1BuilderService.js';
import { getCoachProgress } from './ventureCoachService.js';
import { readBlueprintStore } from './blueprintSectionStore.js';
import { readDay1BuilderStore } from './day1BuilderStorage.js';
import { readCoachStore } from './ventureCoachStorage.js';
import { computeCanvasCompletionPct } from './canvasService.js';
import { builderEntryHasContent, fieldHasContent } from './syncMergeUtils.js';
import { COACH_SECTIONS } from './ventureCoachConstants.js';

/** @param {string} participantId */
export function assessLocalInternWork(participantId) {
  if (!participantId) {
    return emptyLocalAssessment();
  }

  const progress = getDay1MissionProgress(participantId);
  const coachProgress = getCoachProgress(participantId);

  let blueprintFields = 0;
  const blueprint = readBlueprintStore()[participantId] ?? {};
  for (const section of Object.values(blueprint)) {
    for (const field of Object.values(section ?? {})) {
      if (fieldHasContent(field?.value)) blueprintFields += 1;
    }
  }

  let builderWithContent = 0;
  const builders = readDay1BuilderStore()[participantId]?.builders ?? {};
  for (const entry of Object.values(builders)) {
    if (builderEntryHasContent(entry)) builderWithContent += 1;
  }

  let coachSectionsWithContent = 0;
  const coach = readCoachStore()[participantId];
  for (const section of COACH_SECTIONS) {
    const data = coach?.sections?.[section.id]?.data ?? {};
    if (fieldHasContent(data)) coachSectionsWithContent += 1;
  }

  const canvasPct = computeCanvasCompletionPct(participantId);
  const substantiveScore =
    builderWithContent * 12
    + coachSectionsWithContent * 12
    + blueprintFields * 4
    + Math.round(progress.percent / 4)
    + Math.round(coachProgress.percent / 4)
    + Math.round(canvasPct / 5);

  const isSparse =
    progress.percent < 15
    && coachProgress.percent < 15
    && blueprintFields < 2
    && builderWithContent < 2
    && coachSectionsWithContent < 2
    && canvasPct < 10;

  return {
    day1Percent: progress.percent,
    coachPercent: coachProgress.percent,
    blueprintFields,
    builderWithContent,
    coachSectionsWithContent,
    canvasPct,
    substantiveScore,
    isSparse,
  };
}

function emptyLocalAssessment() {
  return {
    day1Percent: 0,
    coachPercent: 0,
    blueprintFields: 0,
    builderWithContent: 0,
    coachSectionsWithContent: 0,
    canvasPct: 0,
    substantiveScore: 0,
    isSparse: true,
  };
}
