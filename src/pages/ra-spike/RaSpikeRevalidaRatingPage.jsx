import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';
import { supabase } from '../../supabaseClient.js';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import {
  RA_SPIKE_REVALIDA_ACCESS_PIN,
  readRevalidaGuestSession,
  readRevalidaPanelistToken,
  writeRevalidaGuestSession,
} from '../../lib/raSpikeRevalidaConstants.js';
import {
  fetchRevalidaCohortsRemote,
  fetchRevalidaGuestRatingsRemote,
  fetchRevalidaPanelistRatingsRemote,
  fetchRevalidaSquadMembersRemote,
  fetchRevalidaSquadsRemote,
  finalizeRevalidaGuestRatingsRemote,
  finalizeRevalidaPanelistRatingsRemote,
  revalidaPanelistCheckInRemote,
  submitRevalidaGuestRatingRemote,
} from '../../lib/supabase/revalidaPanel.js';

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

const INPUT_CLASS =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20';

const EMPTY_SQUAD_FIELDS = {
  fvp_score: null,
  business_model_score: null,
  strategy_score: null,
  presentation_score: null,
  investment_score: null,
  greatest_strength: '',
  improvement: '',
  recommendation: '',
  standout_participant_id: '',
};

/** @param {object | null | undefined} data */
function ratingToFormFields(data) {
  if (!data) return { ...EMPTY_SQUAD_FIELDS };
  return {
    fvp_score: data.fvp_score,
    business_model_score: data.business_model_score,
    strategy_score: data.strategy_score,
    presentation_score: data.presentation_score,
    investment_score: data.investment_score,
    greatest_strength: data.greatest_strength || '',
    improvement: data.improvement || '',
    recommendation: data.recommendation || '',
    standout_participant_id: data.standout_participant_id || '',
  };
}

/** @param {Record<string, object>} squadRatings */
function isPortfolioFinalized(squads, squadRatings) {
  if (!squads.length) return false;
  return squads.every((squad) => squadRatings[squad.id]?.finalized);
}

function panelistInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return '?';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

/** @param {{ squads: { id: string, name: string }[], value: string, onChange: (id: string) => void, ratedIds: Set<string> }} props */
function SquadPicker({ squads, value, onChange, ratedIds }) {
  if (!squads.length) {
    return <p className="text-sm text-slate-500">No squads available for this cohort.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {squads.map((squad) => {
        const selected = value === squad.id;
        const rated = ratedIds.has(squad.id);
        return (
          <button
            key={squad.id}
            type="button"
            onClick={() => onChange(squad.id)}
            className={`relative min-h-[52px] flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition active:scale-[0.98] sm:flex-none sm:min-w-[140px] ${
              selected
                ? 'border-spike bg-spike text-white shadow-md'
                : rated
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-900 hover:border-spike/50'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-spike/50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {rated ? <Check size={16} className={selected ? 'text-white' : 'text-emerald-600'} /> : null}
              {squad.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * @param {{ guestMode?: boolean }} props
 */
export function RaSpikeRevalidaRatingPage({ guestMode = false }) {
  const { user } = useAuth();
  const isGuestFlow = guestMode || !user?.id;
  const savedSession = useMemo(() => (isGuestFlow ? readRevalidaGuestSession() : null), [isGuestFlow]);
  const panelistToken = useMemo(
    () => (isGuestFlow ? readRevalidaPanelistToken() : null),
    [isGuestFlow],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [finalizedNotice, setFinalizedNotice] = useState(false);
  const [checkInError, setCheckInError] = useState('');

  const [pin, setPin] = useState('');
  const checkInRef = useRef('');
  const squadIdRef = useRef('');
  const [panelistName, setPanelistName] = useState(() => {
    if (savedSession?.name) return savedSession.name;
    if (!guestMode && user?.name) return user.name;
    return '';
  });
  const [panelistOrg, setPanelistOrg] = useState(() => savedSession?.org ?? '');

  const [cohorts, setCohorts] = useState([]);
  const [squads, setSquads] = useState([]);
  const [squadMembers, setSquadMembers] = useState([]);
  /** @type {[Record<string, object>, Function]} */
  const [squadRatings, setSquadRatings] = useState({});

  const [formData, setFormData] = useState({
    cohort_id: savedSession?.cohortId ?? '',
    squad_id: '',
    ...EMPTY_SQUAD_FIELDS,
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

  const activeCohort = useMemo(() => {
    if (!cohorts.length) return null;
    const match = cohorts.find((c) => String(c.id) === String(formData.cohort_id));
    return match ?? cohorts[0];
  }, [cohorts, formData.cohort_id]);

  const ratedSquadIds = useMemo(
    () => new Set(Object.keys(squadRatings).filter((id) => squadRatings[id])),
    [squadRatings],
  );

  const ratedCount = useMemo(
    () => squads.filter((squad) => ratedSquadIds.has(squad.id)).length,
    [ratedSquadIds, squads],
  );

  const allSquadsRated = squads.length > 0 && ratedCount === squads.length;
  const portfolioFinalized = isPortfolioFinalized(squads, squadRatings);
  const currentSquadRating = formData.squad_id ? squadRatings[formData.squad_id] : null;
  const currentSquadLocked = portfolioFinalized || Boolean(currentSquadRating?.finalized);
  const selectedSquadName = squads.find((s) => s.id === formData.squad_id)?.name ?? 'Squad';

  const loadCohorts = useCallback(async () => {
    if (isGuestFlow) {
      const data = await fetchRevalidaCohortsRemote(pin || RA_SPIKE_REVALIDA_ACCESS_PIN);
      setCohorts(data);
      return;
    }
    if (!supabase) return;
    const { data } = await supabase
      .from('cohorts')
      .select('id, name, code')
      .eq('is_active', true)
      .eq('program_slug', 'ra-spike')
      .order('created_at', { ascending: false });
    setCohorts(data || []);
  }, [isGuestFlow, pin]);

  const loadSquads = useCallback(
    async (cohortId) => {
      if (!cohortId) return;
      if (isGuestFlow) {
        const data = await fetchRevalidaSquadsRemote(cohortId, pin || RA_SPIKE_REVALIDA_ACCESS_PIN);
        setSquads(data);
        return;
      }
      if (!supabase) return;
      const { data } = await supabase
        .from('formation_squads')
        .select('id, name, cohort_id')
        .eq('cohort_id', cohortId)
        .eq('status', 'active')
        .order('name');
      setSquads(data || []);
    },
    [isGuestFlow, pin],
  );

  const loadSquadMembers = useCallback(
    async (squadId) => {
      if (!squadId) return;
      if (isGuestFlow) {
        const data = await fetchRevalidaSquadMembersRemote(squadId, pin || RA_SPIKE_REVALIDA_ACCESS_PIN);
        setSquadMembers(
          data.map((m) => ({
            participant_id: m.participant_id,
            role: m.role,
            profiles: { id: m.participant_id, name: m.name },
          })),
        );
        return;
      }
      if (!supabase) return;
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
    },
    [isGuestFlow, pin],
  );

  const loadAllRatings = useCallback(
    async (cohortId) => {
      if (!cohortId) return {};
      if (isGuestFlow && panelistToken) {
        const rows = await fetchRevalidaGuestRatingsRemote(
          cohortId,
          panelistToken,
          pin || RA_SPIKE_REVALIDA_ACCESS_PIN,
        );
        const next = {};
        for (const row of rows) next[row.squad_id] = row;
        setSquadRatings(next);
        return next;
      }
      if (!supabase || !user?.id) return {};
      const { data, error } = await supabase
        .from('revalida_panel_ratings')
        .select('*')
        .eq('panelist_id', user.id)
        .eq('cohort_id', parseInt(String(cohortId), 10));
      if (error) throw error;
      const next = {};
      for (const row of data || []) next[row.squad_id] = row;
      setSquadRatings(next);
      return next;
    },
    [isGuestFlow, panelistToken, pin, user?.id],
  );

  useEffect(() => {
    loadCohorts()
      .catch(() => setCohorts([]))
      .finally(() => setLoading(false));
  }, [loadCohorts]);

  useEffect(() => {
    if (!cohorts.length || formData.cohort_id) return;
    setFormData((prev) => ({ ...prev, cohort_id: String(cohorts[0].id) }));
  }, [cohorts, formData.cohort_id]);

  useEffect(() => {
    if (isGuestFlow || panelistName.trim() || !user?.name) return;
    setPanelistName(user.name);
  }, [isGuestFlow, panelistName, user?.name]);

  useEffect(() => {
    if (!isGuestFlow) return;
    writeRevalidaGuestSession({
      unlocked: Boolean(panelistName.trim()),
      name: panelistName.trim(),
      org: panelistOrg.trim(),
      cohortId: formData.cohort_id,
    });
  }, [isGuestFlow, panelistName, panelistOrg, formData.cohort_id]);

  useEffect(() => {
    if (!isGuestFlow || !panelistName.trim() || !formData.cohort_id) return;

    const signature = `${panelistName.trim()}|${panelistOrg.trim()}|${formData.cohort_id}|${pin.trim()}`;
    if (checkInRef.current === signature) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const accessPin = pin.trim() || RA_SPIKE_REVALIDA_ACCESS_PIN;
        const result = await revalidaPanelistCheckInRemote({
          pin: accessPin,
          panelistToken,
          name: panelistName.trim(),
          org: panelistOrg.trim(),
          cohortId: formData.cohort_id,
        });
        if (cancelled) return;
        checkInRef.current = signature;
        const cohortId = String(result?.cohort_id ?? formData.cohort_id);
        setCheckInError('');
        setFormData((prev) => ({ ...prev, cohort_id: cohortId || prev.cohort_id }));
      } catch (err) {
        if (!cancelled) {
          setCheckInError(err.message || 'Could not check in. Check your PIN and try again.');
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [formData.cohort_id, isGuestFlow, panelistName, panelistOrg, panelistToken, pin]);

  useEffect(() => {
    squadIdRef.current = formData.squad_id;
  }, [formData.squad_id]);

  useEffect(() => {
    if (formData.cohort_id) {
      loadSquads(formData.cohort_id).catch(() => setSquads([]));
      loadAllRatings(formData.cohort_id)
        .then((next) => {
          const squadId = squadIdRef.current;
          if (!squadId) return;
          setFormData((prev) => ({
            ...prev,
            ...ratingToFormFields(next[squadId]),
          }));
        })
        .catch(() => setSquadRatings({}));
    } else {
      setSquads([]);
      setSquadRatings({});
    }
  }, [formData.cohort_id, loadAllRatings, loadSquads]);

  useEffect(() => {
    if (!saveNotice) return undefined;
    const timer = window.setTimeout(() => setSaveNotice(''), 3000);
    return () => window.clearTimeout(timer);
  }, [saveNotice]);

  const selectSquad = useCallback(
    (squadId) => {
      setSaveNotice('');
      squadIdRef.current = squadId;
      setFormData((prev) => ({
        ...prev,
        squad_id: squadId,
        ...ratingToFormFields(squadRatings[squadId]),
      }));
      loadSquadMembers(squadId).catch(() => setSquadMembers([]));
    },
    [loadSquadMembers, squadRatings],
  );

  const persistSquadRating = async () => {
    const payload = {
      cohortId: formData.cohort_id,
      squadId: formData.squad_id,
      fvpScore: formData.fvp_score,
      businessModelScore: formData.business_model_score,
      strategyScore: formData.strategy_score,
      presentationScore: formData.presentation_score,
      investmentScore: formData.investment_score,
      greatestStrength: formData.greatest_strength.trim(),
      improvement: formData.improvement.trim(),
      recommendation: formData.recommendation,
      standoutParticipantId: formData.standout_participant_id || null,
    };

    if (isGuestFlow && panelistToken) {
      return submitRevalidaGuestRatingRemote({
        ...payload,
        pin: pin.trim() || RA_SPIKE_REVALIDA_ACCESS_PIN,
        panelistToken,
        panelistName: panelistName.trim(),
        panelistOrg: panelistOrg.trim(),
      });
    }

    if (!supabase || !user?.id) throw new Error('Not signed in');

    const row = {
      panelist_id: user.id,
      panelist_name: panelistName.trim() || user.name || user.email || 'Staff panelist',
      cohort_id: parseInt(formData.cohort_id, 10),
      squad_id: formData.squad_id,
      fvp_score: formData.fvp_score,
      business_model_score: formData.business_model_score,
      strategy_score: formData.strategy_score,
      presentation_score: formData.presentation_score,
      investment_score: formData.investment_score,
      greatest_strength: payload.greatestStrength,
      improvement: payload.improvement,
      recommendation: formData.recommendation,
      standout_participant_id: payload.standoutParticipantId,
    };

    const existing = squadRatings[formData.squad_id];
    if (existing?.id) {
      const { data, error } = await supabase
        .from('revalida_panel_ratings')
        .update(row)
        .eq('id', existing.id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase.from('revalida_panel_ratings').insert([row]).select('*').single();
    if (error) throw error;
    return data;
  };

  const handleSaveSquad = async (e) => {
    e.preventDefault();
    if (currentSquadLocked || !formData.squad_id) return;

    setSaving(true);
    try {
      const saved = await persistSquadRating();
      setSquadRatings((prev) => ({ ...prev, [formData.squad_id]: saved }));
      setSaveNotice(`${selectedSquadName} rating saved`);
    } catch (err) {
      alert(err.message || 'Failed to save rating');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeAll = async () => {
    if (!allSquadsRated || portfolioFinalized) return;

    setFinalizing(true);
    try {
      if (isGuestFlow && panelistToken) {
        await finalizeRevalidaGuestRatingsRemote({
          pin: pin.trim() || RA_SPIKE_REVALIDA_ACCESS_PIN,
          panelistToken,
          cohortId: formData.cohort_id,
        });
      } else {
        await finalizeRevalidaPanelistRatingsRemote(formData.cohort_id);
      }
      await loadAllRatings(formData.cohort_id);
      setFinalizedNotice(true);
    } catch (err) {
      alert(err.message || 'Failed to finalize ratings');
    } finally {
      setFinalizing(false);
    }
  };

  const isFormValid = useMemo(
    () =>
      panelistName.trim()
      && formData.cohort_id
      && formData.squad_id
      && formData.fvp_score !== null
      && formData.business_model_score !== null
      && formData.strategy_score !== null
      && formData.presentation_score !== null
      && formData.investment_score !== null
      && formData.greatest_strength.trim()
      && formData.improvement.trim()
      && formData.recommendation,
    [formData, panelistName],
  );

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

        {finalizedNotice || portfolioFinalized ? (
          <div className="mb-8 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-6 text-center">
            <Check className="mx-auto mb-3 text-emerald-600" size={40} />
            <h2 className="text-xl font-bold text-emerald-900">ALL RATINGS SUBMITTED</h2>
            <p className="mt-2 text-sm text-emerald-700">
              Thank you — your evaluations for all squads are locked in.
            </p>
          </div>
        ) : null}

        <form onSubmit={handleSaveSquad} className="space-y-8">
            {isGuestFlow ? (
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <label htmlFor="pin" className="mb-1 block text-sm font-bold text-slate-900">
                  Access PIN
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="text"
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => {
                    checkInRef.current = '';
                    setPin(e.target.value);
                  }}
                  placeholder="Ask the coach for today's PIN"
                  className={INPUT_CLASS}
                />
                <p className="mt-1 text-xs text-slate-500">Default event PIN: REVALIDA</p>
                {checkInError ? (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{checkInError}</p>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-2xl border border-spike/25 bg-gradient-to-br from-spike-muted/40 to-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-spike">Panelist</p>
              <div className="mt-3 flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-spike text-lg font-bold text-white"
                  aria-hidden
                >
                  {panelistInitials(panelistName)}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label htmlFor="rating-panelist-name" className="mb-1 block text-sm font-bold text-slate-900">
                      Your name
                    </label>
                    <input
                      id="rating-panelist-name"
                      type="text"
                      value={panelistName}
                      onChange={(e) => setPanelistName(e.target.value)}
                      placeholder="Full name as panelist"
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="rating-panelist-org" className="mb-1 block text-sm font-bold text-slate-900">
                      Organization <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <input
                      id="rating-panelist-org"
                      type="text"
                      value={panelistOrg}
                      onChange={(e) => setPanelistOrg(e.target.value)}
                      placeholder="Company or role"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-spike">Squad</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Which pitch are you rating?</h2>
                </div>
                {activeCohort ? (
                  <p className="rounded-full bg-spike-muted px-3 py-1 text-xs font-bold text-spike">
                    {activeCohort.name}
                    {activeCohort.code ? ` · ${activeCohort.code}` : ''}
                  </p>
                ) : null}
              </div>

              {squads.length ? (
                <p className="text-sm text-slate-600">
                  {ratedCount} of {squads.length} squads rated
                  {!portfolioFinalized ? ' · switch squads anytime to edit saved ratings' : ''}
                </p>
              ) : null}

              <SquadPicker
                squads={squads}
                value={formData.squad_id}
                onChange={selectSquad}
                ratedIds={ratedSquadIds}
              />

              {saveNotice ? (
                <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  {saveNotice}
                </p>
              ) : null}

              {currentSquadRating && !portfolioFinalized ? (
                <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Saved for {selectedSquadName}. You can update and save again until you submit all ratings.
                </div>
              ) : null}
            </section>

            {formData.squad_id && !currentSquadLocked ? (
              <>
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
                          const isSelected = formData[`${criterion.key}_score`] === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({ ...prev, [`${criterion.key}_score`]: value }))}
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

                {totalScore !== null ? (
                  <div className="sticky top-4 z-10 rounded-2xl border-2 border-spike bg-spike-muted/90 p-5 text-center backdrop-blur-sm">
                    <p className="text-sm font-bold uppercase tracking-wide text-slate-700">TOTAL SCORE</p>
                    <p className="mt-1 text-4xl font-bold text-spike">
                      {totalScore} <span className="text-2xl text-slate-600">/ 100</span>
                    </p>
                  </div>
                ) : null}

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
                        setFormData((prev) => ({ ...prev, greatest_strength: e.target.value }))}
                      rows={3}
                      className={INPUT_CLASS}
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
                        setFormData((prev) => ({ ...prev, improvement: e.target.value }))}
                      rows={3}
                      className={INPUT_CLASS}
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
                              setFormData((prev) => ({ ...prev, recommendation: e.target.value }))}
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
                        setFormData((prev) => ({ ...prev, standout_participant_id: e.target.value }))}
                      className={INPUT_CLASS}
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

                <button
                  type="submit"
                  disabled={!isFormValid || saving}
                  className="w-full min-h-[56px] rounded-xl bg-spike px-6 py-4 text-lg font-bold text-white transition hover:bg-spike/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      SAVING...
                    </span>
                  ) : (
                    `SAVE ${selectedSquadName.toUpperCase()} RATING`
                  )}
                </button>
              </>
            ) : formData.squad_id && currentSquadLocked ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {selectedSquadName} rating is locked.
              </div>
            ) : null}

            {allSquadsRated && !portfolioFinalized ? (
              <section className="rounded-2xl border-2 border-spike bg-spike-muted/30 p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Final submission</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    All squads are rated. Submit once to lock your evaluations — you can still edit any squad until then.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFinalizeAll}
                  disabled={finalizing}
                  className="w-full min-h-[56px] rounded-xl border-2 border-spike bg-white px-6 py-4 text-lg font-bold text-spike transition hover:bg-spike hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {finalizing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      SUBMITTING ALL RATINGS...
                    </span>
                  ) : (
                    'SUBMIT ALL RATINGS'
                  )}
                </button>
              </section>
            ) : null}
          </form>
      </div>
    </PageContainer>
  );
}
