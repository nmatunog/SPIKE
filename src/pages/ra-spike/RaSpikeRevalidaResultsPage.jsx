import { useCallback, useEffect, useState } from 'react';
import { Award, ChevronDown, ChevronUp, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import { supabase } from '../../supabaseClient.js';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { resolveUserRole } from '../../lib/roles.js';

export function RaSpikeRevalidaResultsPage() {
  const { user } = useAuth();
  const userRole = resolveUserRole(user);
  const isAdmin = userRole === 'admin' || userRole === 'superuser';

  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [results, setResults] = useState([]);
  const [expandedSquad, setExpandedSquad] = useState(null);
  const [squadDetails, setSquadDetails] = useState(null);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadCohorts = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('cohorts')
      .select('id, name, code')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setCohorts(data || []);
    if (data?.length) {
      setSelectedCohort(String(data[0].id));
    }
  }, []);

  const loadPublishedStatus = useCallback(async (cohortId) => {
    if (!supabase || !cohortId) return;
    const { data } = await supabase
      .from('revalida_results_published')
      .select('published')
      .eq('cohort_id', cohortId)
      .maybeSingle();
    setPublished(data?.published ?? false);
  }, []);

  const loadResults = useCallback(async (cohortId) => {
    if (!supabase || !cohortId) return;

    const { data: ratings } = await supabase
      .from('revalida_panel_ratings')
      .select(`
        *,
        squads:squad_id (
          id,
          name
        )
      `)
      .eq('cohort_id', cohortId);

    if (!ratings?.length) {
      setResults([]);
      return;
    }

    // Group by squad
    const squadMap = new Map();
    ratings.forEach((r) => {
      const squadId = r.squad_id;
      if (!squadMap.has(squadId)) {
        squadMap.set(squadId, {
          squad_id: squadId,
          squad_name: r.squads?.name || 'Unknown Squad',
          ratings: [],
        });
      }
      squadMap.get(squadId).ratings.push(r);
    });

    // Calculate averages
    const resultsList = Array.from(squadMap.values()).map((squad) => {
      const count = squad.ratings.length;
      const totals = squad.ratings.reduce(
        (acc, r) => ({
          fvp: acc.fvp + r.fvp_score,
          business: acc.business + r.business_model_score,
          strategy: acc.strategy + r.strategy_score,
          presentation: acc.presentation + r.presentation_score,
          investment: acc.investment + r.investment_score,
          total: acc.total + r.total_score,
        }),
        { fvp: 0, business: 0, strategy: 0, presentation: 0, investment: 0, total: 0 }
      );

      const recommendations = squad.ratings.reduce(
        (acc, r) => {
          if (r.recommendation === 'ready') acc.ready++;
          else if (r.recommendation === 'ready_with_revisions') acc.ready_with_revisions++;
          else if (r.recommendation === 'needs_development') acc.needs_development++;
          return acc;
        },
        { ready: 0, ready_with_revisions: 0, needs_development: 0 }
      );

      return {
        squad_id: squad.squad_id,
        squad_name: squad.squad_name,
        panelist_count: count,
        avg_fvp: (totals.fvp / count).toFixed(1),
        avg_business: (totals.business / count).toFixed(1),
        avg_strategy: (totals.strategy / count).toFixed(1),
        avg_presentation: (totals.presentation / count).toFixed(1),
        avg_investment: (totals.investment / count).toFixed(1),
        avg_total: (totals.total / count).toFixed(1),
        recommendations,
      };
    });

    // Sort by average total score descending
    resultsList.sort((a, b) => parseFloat(b.avg_total) - parseFloat(a.avg_total));

    // Add rank
    resultsList.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    setResults(resultsList);
  }, []);

  const loadSquadDetails = useCallback(async (squadId) => {
    if (!supabase || !squadId) return;

    const { data: ratings } = await supabase
      .from('revalida_panel_ratings')
      .select(`
        *,
        panelist:panelist_id (
          id,
          name
        ),
        standout:standout_participant_id (
          id,
          name
        )
      `)
      .eq('squad_id', squadId)
      .order('submitted_at', { ascending: false });

    setSquadDetails(ratings || []);
  }, []);

  useEffect(() => {
    loadCohorts().finally(() => setLoading(false));
  }, [loadCohorts]);

  useEffect(() => {
    if (selectedCohort) {
      loadPublishedStatus(selectedCohort);
      loadResults(selectedCohort);
    }
  }, [selectedCohort, loadPublishedStatus, loadResults]);

  const handleToggleSquad = (squadId) => {
    if (expandedSquad === squadId) {
      setExpandedSquad(null);
      setSquadDetails(null);
    } else {
      setExpandedSquad(squadId);
      loadSquadDetails(squadId);
    }
  };

  const handlePublish = async () => {
    if (!supabase || !isAdmin || !selectedCohort) return;
    if (!window.confirm('Publish results? Panelists and participants will be able to view them.')) {
      return;
    }

    setPublishing(true);
    try {
      const { error } = await supabase
        .from('revalida_results_published')
        .upsert({
          cohort_id: parseInt(selectedCohort, 10),
          published: true,
          published_at: new Date().toISOString(),
          published_by: user.id,
        });

      if (error) throw error;
      setPublished(true);
      alert('Results published successfully!');
    } catch (err) {
      alert(err.message || 'Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin text-spike" size={32} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-5xl pb-12">
        <header className="mb-8 space-y-2 border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">RA-SPIKE</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            REVALIDA RESULTS
          </h1>
          <p className="text-sm text-slate-600">
            View aggregated panel ratings and individual feedback per squad.
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cohort" className="mb-2 block text-sm font-bold text-slate-900">
              Cohort
            </label>
            <select
              id="cohort"
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || published}
              className="min-h-[44px] rounded-xl bg-spike px-6 py-3 text-sm font-bold text-white transition hover:bg-spike/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Publishing...
                </span>
              ) : published ? (
                '✓ Results Published'
              ) : (
                'PUBLISH RESULTS'
              )}
            </button>
          )}
        </div>

        {published && (
          <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            ✓ Results are published and visible to all authorized users.
          </div>
        )}

        {results.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-600">
            <p className="font-medium">No ratings submitted yet for this cohort.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((squad) => (
              <div
                key={squad.squad_id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 bg-gradient-to-r from-spike-muted/30 to-white px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-spike text-sm font-bold text-white">
                          {squad.rank}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">{squad.squad_name}</h3>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {squad.panelist_count} panelist{squad.panelist_count !== 1 ? 's' : ''} rated
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-spike">{squad.avg_total}</p>
                      <p className="text-xs text-slate-500">/ 100</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">FVP</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {squad.avg_fvp} <span className="text-xs text-slate-500">/ 20</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Business Model</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {squad.avg_business} <span className="text-xs text-slate-500">/ 25</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Strategy</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {squad.avg_strategy} <span className="text-xs text-slate-500">/ 20</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Presentation</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {squad.avg_presentation} <span className="text-xs text-slate-500">/ 20</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Investment</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {squad.avg_investment} <span className="text-xs text-slate-500">/ 15</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      Ready: {squad.recommendations.ready}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                      w/ Revisions: {squad.recommendations.ready_with_revisions}
                    </span>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                      Needs Dev: {squad.recommendations.needs_development}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSquad(squad.squad_id)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-spike hover:text-spike"
                  >
                    <Eye size={16} />
                    {expandedSquad === squad.squad_id ? 'Hide' : 'View'} Individual Ratings
                    {expandedSquad === squad.squad_id ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  {expandedSquad === squad.squad_id && (
                    <div className="mt-4 space-y-4">
                      {!squadDetails ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="animate-spin text-spike" size={24} />
                        </div>
                      ) : squadDetails.length === 0 ? (
                        <p className="py-4 text-center text-sm text-slate-600">
                          No ratings found.
                        </p>
                      ) : (
                        squadDetails.map((rating) => (
                          <div
                            key={rating.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-slate-900">
                                  {rating.panelist?.name || 'Anonymous'}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(rating.submitted_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-spike">
                                  {rating.total_score}
                                </p>
                                <p className="text-xs text-slate-500">/ 100</p>
                              </div>
                            </div>

                            <div className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                              <div>
                                <p className="text-xs text-slate-500">FVP</p>
                                <p className="font-bold text-slate-700">{rating.fvp_score}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Business</p>
                                <p className="font-bold text-slate-700">
                                  {rating.business_model_score}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Strategy</p>
                                <p className="font-bold text-slate-700">{rating.strategy_score}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Presentation</p>
                                <p className="font-bold text-slate-700">
                                  {rating.presentation_score}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Investment</p>
                                <p className="font-bold text-slate-700">
                                  {rating.investment_score}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="font-bold text-slate-700">Greatest Strength:</p>
                                <p className="text-slate-600">{rating.greatest_strength}</p>
                              </div>
                              <div>
                                <p className="font-bold text-slate-700">Most Important Improvement:</p>
                                <p className="text-slate-600">{rating.improvement}</p>
                              </div>
                              <div>
                                <p className="font-bold text-slate-700">Recommendation:</p>
                                <p className="text-slate-600">
                                  {rating.recommendation === 'ready'
                                    ? 'Ready for Segment 2'
                                    : rating.recommendation === 'ready_with_revisions'
                                    ? 'Ready with Minor Revisions'
                                    : 'Needs Further Development'}
                                </p>
                              </div>
                              {rating.standout && (
                                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                                  <Award className="text-amber-600" size={16} />
                                  <p className="text-xs font-bold text-amber-900">
                                    Standout: {rating.standout?.name}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
