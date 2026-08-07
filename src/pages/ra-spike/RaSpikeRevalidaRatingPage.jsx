import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import { supabase } from '../../supabaseClient.js';
import { PageContainer } from '../../components/layout/PageContainer.jsx';

const RATING_OPTIONS = {
  fvp: [12, 14, 16, 18, 20],
  business_model: [15, 17.5, 20, 22.5, 25],
  strategy: [12, 14, 16, 18, 20],
  presentation: [12, 14, 16, 18, 20],
  investment: [9, 10.5, 12, 13.5, 15],
};

const CRITERIA = [
  {
    key: 'fvp',
    title: 'Financial Value Proposition',
    description: 'Clear, relevant, customer-focused and compelling.',
    max: 20,
  },
  {
    key: 'business_model',
    title: 'Business Model',
    description: 'Revenue Engine and Leadership Engine are practical, executable and scalable.',
    max: 25,
  },
  {
    key: 'strategy',
    title: 'Strategy & Planning',
    description: 'MAPA projections, milestones and monitoring system are realistic and aligned.',
    max: 20,
  },
  {
    key: 'presentation',
    title: 'Presentation & Defense',
    description: 'Clear, confident, cohesive, and demonstrates understanding of the business.',
    max: 20,
  },
  {
    key: 'investment',
    title: 'Investment Potential',
    description: 'Overall entrepreneurial viability — would you back this venture?',
    max: 15,
  },
];

export function RaSpikeRevalidaRatingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cohorts, setCohorts] = useState([]);
  const [squads, setSquads] = useState([]);
  const [squadMembers, setSquadMembers] = useState([]);
  const [existingRating, setExistingRating] = useState(null);

  const [formData, setFormData] = useState({
    cohort_id: '',
    squad_id: '',
    fvp_score: null,
    business_model_score: null,
    strategy_score: null,
    presentation_score: null,
    investment_score: null,
    greatest_strength: '',
    improvement: '',
    recommendation: '',
    standout_participant_id: '',
  });

  const totalScore = useMemo(() => {
    const scores = [
      formData.fvp_score,
      formData.business_model_score,
      formData.strategy_score,
      formData.presentation_score,
      formData.investment_score,
    ];
    if (scores.some((s) => s === null)) return null;
    return scores.reduce((sum, score) => sum + score, 0);
  }, [formData]);

  const loadCohorts = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('cohorts')
      .select('id, name, code')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setCohorts(data || []);
  }, []);

  const loadSquads = useCallback(async (cohortId) => {
    if (!supabase || !cohortId) return;
    const { data } = await supabase
      .from('formation_squads')
      .select('id, name, cohort_id')
      .eq('cohort_id', cohortId)
      .eq('status', 'active')
      .order('name');
    setSquads(data || []);
  }, []);

  const loadSquadMembers = useCallback(async (squadId) => {
    if (!supabase || !squadId) return;
    const { data } = await supabase
      .from('formation_squad_members')
      .select(`
        participant_id,
        role,
        profiles:participant_id (
          id,
          name
        )
      `)
      .eq('squad_id', squadId)
      .order('role');
    setSquadMembers(data || []);
  }, []);

  const loadExistingRating = useCallback(async (squadId) => {
    if (!supabase || !squadId || !user?.id) return;
    const { data } = await supabase
      .from('revalida_panel_ratings')
      .select('*')
      .eq('panelist_id', user.id)
      .eq('squad_id', squadId)
      .maybeSingle();

    if (data) {
      setExistingRating(data);
      setFormData({
        cohort_id: String(data.cohort_id),
        squad_id: data.squad_id,
        fvp_score: data.fvp_score,
        business_model_score: data.business_model_score,
        strategy_score: data.strategy_score,
        presentation_score: data.presentation_score,
        investment_score: data.investment_score,
        greatest_strength: data.greatest_strength || '',
        improvement: data.improvement || '',
        recommendation: data.recommendation || '',
        standout_participant_id: data.standout_participant_id || '',
      });
      setSubmitted(false);
    } else {
      setExistingRating(null);
    }
  }, [user]);

  useEffect(() => {
    loadCohorts().finally(() => setLoading(false));
  }, [loadCohorts]);

  useEffect(() => {
    if (formData.cohort_id) {
      loadSquads(formData.cohort_id);
    } else {
      setSquads([]);
    }
  }, [formData.cohort_id, loadSquads]);

  useEffect(() => {
    if (formData.squad_id) {
      loadSquadMembers(formData.squad_id);
      loadExistingRating(formData.squad_id);
    } else {
      setSquadMembers([]);
      setExistingRating(null);
    }
  }, [formData.squad_id, loadSquadMembers, loadExistingRating]);

  const handleCohortChange = (cohortId) => {
    setFormData((prev) => ({
      ...prev,
      cohort_id: cohortId,
      squad_id: '',
    }));
  };

  const handleSquadChange = (squadId) => {
    setFormData((prev) => ({
      ...prev,
      squad_id: squadId,
    }));
  };

  const handleScoreSelect = (criterion, value) => {
    setFormData((prev) => ({
      ...prev,
      [`${criterion}_score`]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase || !user?.id || existingRating?.finalized) return;

    setSaving(true);
    try {
      const payload = {
        panelist_id: user.id,
        cohort_id: parseInt(formData.cohort_id, 10),
        squad_id: formData.squad_id,
        fvp_score: formData.fvp_score,
        business_model_score: formData.business_model_score,
        strategy_score: formData.strategy_score,
        presentation_score: formData.presentation_score,
        investment_score: formData.investment_score,
        greatest_strength: formData.greatest_strength.trim(),
        improvement: formData.improvement.trim(),
        recommendation: formData.recommendation,
        standout_participant_id: formData.standout_participant_id || null,
      };

      if (existingRating) {
        const { error } = await supabase
          .from('revalida_panel_ratings')
          .update(payload)
          .eq('id', existingRating.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('revalida_panel_ratings')
          .insert([payload]);
        if (error) throw error;
      }

      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          cohort_id: formData.cohort_id,
          squad_id: '',
          fvp_score: null,
          business_model_score: null,
          strategy_score: null,
          presentation_score: null,
          investment_score: null,
          greatest_strength: '',
          improvement: '',
          recommendation: '',
          standout_participant_id: '',
        });
        setSubmitted(false);
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to submit rating');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = useMemo(() => {
    return (
      formData.cohort_id &&
      formData.squad_id &&
      formData.fvp_score !== null &&
      formData.business_model_score !== null &&
      formData.strategy_score !== null &&
      formData.presentation_score !== null &&
      formData.investment_score !== null &&
      formData.greatest_strength.trim() &&
      formData.improvement.trim() &&
      formData.recommendation
    );
  }, [formData]);

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
    <PageContainer>
      <div className="mx-auto max-w-2xl pb-12">
        <header className="mb-8 space-y-2 border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">RA-SPIKE</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            REVALIDA PANEL RATING
          </h1>
        </header>

        {submitted ? (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-8 text-center">
            <Check className="mx-auto mb-3 text-emerald-600" size={48} />
            <h2 className="text-xl font-bold text-emerald-900">RATING SUBMITTED ✓</h2>
            <p className="mt-2 text-sm text-emerald-700">
              {existingRating ? 'Your rating has been updated.' : 'Thank you for your evaluation.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Cohort & Squad Selection */}
            <section className="space-y-4">
              <div>
                <label htmlFor="cohort" className="mb-2 block text-sm font-bold text-slate-900">
                  Cohort
                </label>
                <select
                  id="cohort"
                  value={formData.cohort_id}
                  onChange={(e) => handleCohortChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                  required
                >
                  <option value="">Select cohort</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="squad" className="mb-2 block text-sm font-bold text-slate-900">
                  Squad
                </label>
                <select
                  id="squad"
                  value={formData.squad_id}
                  onChange={(e) => handleSquadChange(e.target.value)}
                  disabled={!formData.cohort_id}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                  required
                >
                  <option value="">Select squad</option>
                  {squads.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {existingRating && (
                <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  {existingRating.finalized
                    ? '✓ You previously rated this squad. Ratings are finalized and cannot be edited.'
                    : '✓ You previously rated this squad. You can update your rating below.'}
                </div>
              )}
            </section>

            {formData.squad_id && !existingRating?.finalized && (
              <>
                {/* Scoring */}
                <section className="space-y-6">
                  <h2 className="text-lg font-bold text-slate-900">SCORING</h2>

                  {CRITERIA.map((criterion) => (
                    <div key={criterion.key} className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {criterion.title}
                          <span className="ml-2 text-sm font-normal text-slate-500">
                            (Max: {criterion.max})
                          </span>
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{criterion.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {RATING_OPTIONS[criterion.key].map((value) => {
                          const isSelected =
                            formData[`${criterion.key}_score`] === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleScoreSelect(criterion.key, value)}
                              className={`min-h-[52px] min-w-[68px] flex-1 rounded-xl border-2 px-4 py-3 text-lg font-bold transition sm:flex-none ${
                                isSelected
                                  ? 'border-spike bg-spike text-white'
                                  : 'border-slate-300 bg-white text-slate-700 hover:border-spike/50'
                              }`}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>NEEDS WORK</span>
                        <span>OUTSTANDING</span>
                      </div>
                    </div>
                  ))}
                </section>

                {/* Total Score */}
                {totalScore !== null && (
                  <div className="sticky top-4 z-10 rounded-2xl border-2 border-spike bg-spike-muted/90 p-5 text-center backdrop-blur-sm">
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-700">
                      TOTAL SCORE
                    </p>
                    <p className="mt-1 text-4xl font-bold text-spike">
                      {totalScore} <span className="text-2xl text-slate-600">/ 100</span>
                    </p>
                  </div>
                )}

                {/* Feedback */}
                <section className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900">FEEDBACK</h2>

                  <div>
                    <label htmlFor="strength" className="mb-2 block text-sm font-bold text-slate-900">
                      Greatest Strength
                    </label>
                    <textarea
                      id="strength"
                      value={formData.greatest_strength}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, greatest_strength: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="improvement" className="mb-2 block text-sm font-bold text-slate-900">
                      Most Important Improvement
                    </label>
                    <textarea
                      id="improvement"
                      value={formData.improvement}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, improvement: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-900">
                      Final Recommendation
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'ready', label: 'Ready for Segment 2' },
                        { value: 'ready_with_revisions', label: 'Ready with Minor Revisions' },
                        { value: 'needs_development', label: 'Needs Further Development' },
                      ].map((option) => (
                        <label
                          key={option.value}
                          className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 transition hover:border-spike/50"
                        >
                          <input
                            type="radio"
                            name="recommendation"
                            value={option.value}
                            checked={formData.recommendation === option.value}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, recommendation: e.target.value }))
                            }
                            className="h-5 w-5 text-spike focus:ring-spike"
                            required
                          />
                          <span className="text-base font-medium text-slate-900">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="standout" className="mb-2 block text-sm font-bold text-slate-900">
                      Standout Participant <span className="font-normal text-slate-500">(Optional)</span>
                    </label>
                    <select
                      id="standout"
                      value={formData.standout_participant_id}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, standout_participant_id: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
                    >
                      <option value="">Select participant</option>
                      {squadMembers.map((m) => (
                        <option key={m.participant_id} value={m.participant_id}>
                          {m.profiles?.name || 'Unknown'} ({m.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isFormValid || saving}
                  className="w-full min-h-[56px] rounded-xl bg-spike px-6 py-4 text-lg font-bold text-white transition hover:bg-spike/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      SUBMITTING...
                    </span>
                  ) : (
                    'SUBMIT RATING'
                  )}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </PageContainer>
  );
}
