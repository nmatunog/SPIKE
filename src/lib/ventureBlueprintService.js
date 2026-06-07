/**
 * Venture Blueprint API facade (Sprint 05 Phase 8).
 * Production data path: these modules + Supabase clients (not Express /api).
 */
export {
  hydrateVentureBlueprint,
  syncSurveyCompletion,
  syncReflectionCompletion,
  syncFnaCompletion,
  syncCoachingNote,
} from './ventureBlueprintSync.js';

export {
  getSectionField,
  getSectionFields,
  setSectionField,
  hydrateBlueprintSectionsFromSupabase,
} from './blueprintSectionStore.js';

export {
  getCanvasField,
  saveCanvasField,
  saveCanvasFieldDebounced,
  hydrateCanvasFromSupabase,
  computeCanvasCompletionPct,
} from './canvasService.js';

export {
  getMarketIntelligenceSummary,
  syncSurveyToMarketIntelligence,
  computeMarketIntelligenceCompletionPct,
} from './marketIntelligenceService.js';

export {
  appendLeadershipJournalEntry,
  listLeadershipJournal,
  hydrateLeadershipJournalFromSupabase,
} from './leadershipJournalService.js';

export {
  computeBlueprintCompletion,
  computeSectionCompletionPct,
} from './blueprintCompletion.js';

export {
  needsCareerTrackSelection,
  saveCareerTrackSelection,
} from './careerTrackService.js';

export { getNextBlueprintAction } from './blueprintRecommendations.js';
