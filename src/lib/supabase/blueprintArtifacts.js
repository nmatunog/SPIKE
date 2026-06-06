import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * @param {string} userId
 * @param {{
 *   sectionId: string,
 *   title: string,
 *   content: string,
 *   sourceType: string,
 *   sourceId: string,
 *   status?: string,
 * }} artifact
 */
export async function upsertPortfolioArtifactDraft(userId, artifact) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { error } = await supabase.from('portfolio_artifacts').upsert(
    {
      user_id: userId,
      section_slug: artifact.sectionId,
      title: artifact.title,
      content: artifact.content,
      source_type: artifact.sourceType,
      source_id: artifact.sourceId,
      status: artifact.status ?? 'draft',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,section_slug,source_id' },
  );

  if (error) {
    console.warn('[blueprintArtifacts] portfolio upsert failed:', error.message);
    return null;
  }

  return true;
}

/**
 * @param {string} userId
 * @param {{
 *   chapterId: string,
 *   title: string,
 *   content: string,
 *   sourceType: string,
 *   sourceId: string,
 * }} artifact
 */
export async function upsertBusinessPlanArtifactDraft(userId, artifact) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { error } = await supabase.from('business_plan_artifacts').upsert(
    {
      user_id: userId,
      chapter_slug: artifact.chapterId,
      title: artifact.title,
      content: artifact.content,
      source_type: artifact.sourceType,
      source_id: artifact.sourceId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,chapter_slug,source_id' },
  );

  if (error) {
    console.warn('[blueprintArtifacts] business plan upsert failed:', error.message);
    return null;
  }

  return true;
}

/**
 * @param {string} userId
 * @param {object} portfolio
 * @param {object} businessPlan
 */
export async function syncBlueprintDraftsToSupabase(userId, portfolio, businessPlan) {
  const results = await Promise.all([
    upsertPortfolioArtifactDraft(userId, portfolio),
    upsertBusinessPlanArtifactDraft(userId, businessPlan),
  ]);
  return results.some(Boolean);
}
