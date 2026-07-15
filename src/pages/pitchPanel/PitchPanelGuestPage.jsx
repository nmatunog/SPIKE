import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, Lock, Wallet } from 'lucide-react';
import {
  PITCH_PANEL_ACCESS_PIN,
  PITCH_PANEL_INVESTMENT_CRITERIA,
  PITCH_PANEL_TOKEN_STORAGE_KEY,
  PITCH_PANEL_CAPITAL,
  computeRemainingCapital,
  buildInvestmentLeaderboard,
  isValidInvestmentIncrement,
} from '../../lib/staff/pitchPanelConstants.js';
import {
  fetchPitchPanelSquads,
  fetchPitchPanelistPortfolioRemote,
  finalizePitchPanelistPortfolioRemote,
  submitPitchPanelInvestmentRemote,
  submitPitchPanelTieVoteRemote,
} from '../../lib/supabase/pitchPanel.js';
import { readFinalizedPanelCache } from '../../lib/staff/pitchPanelService.js';
import { isSupabaseConfigured } from '../../supabaseClient.js';
import { ConfettiCelebration } from '../../components/pitchPanel/PitchPanelCelebration.jsx';
import {
  InvestmentAllocationPanel,
  InvestmentPortfolioReview,
  PitchFundingResults,
  VentureCapitalHeader,
} from '../../components/pitchPanel/PitchPanelInvestmentUI.jsx';
import { PanelistIdentityCard } from '../../components/pitchPanel/PitchPanelistCard.jsx';

const INPUT_CLASS =
  'mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';
const BTN_PRIMARY =
  'flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-spike px-4 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-60';

function readToken() {
  try {
    let token = localStorage.getItem(PITCH_PANEL_TOKEN_STORAGE_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(PITCH_PANEL_TOKEN_STORAGE_KEY, token);
    }
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

/** @param {string[]} squads */
function SquadPicker({ squads, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {squads.map((s) => {
        const selected = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`shrink-0 rounded-full border px-5 py-3 text-sm font-bold transition active:scale-95 ${
              selected ? 'border-spike bg-spike text-white shadow-md' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

/** Public guest VC investment — PIN W2PITCH */
export function PitchPanelGuestPage() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [squads, setSquads] = useState([]);
  const [squadName, setSquadName] = useState('');
  const [view, setView] = useState('invest');
  const [amount, setAmount] = useState(0);
  const [comment, setComment] = useState('');
  /** @type {[Record<string, { amount: number, comment: string, isFinal?: boolean }>, Function]} */
  const [allocations, setAllocations] = useState({});
  const [panelistFinalized, setPanelistFinalized] = useState(false);
  const [sessionFinalized, setSessionFinalized] = useState(false);
  const [tieSquads, setTieSquads] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const token = useMemo(() => readToken(), []);
  /** Keep draft amount/comment while typing — poll must not wipe unsaved edits. */
  const editingDraftRef = useRef(false);
  const prevSquadRef = useRef('');

  const remaining = useMemo(
    () => computeRemainingCapital(Object.fromEntries(Object.entries(allocations).map(([k, v]) => [k, v.amount]))),
    [allocations],
  );

  const leaderboard = useMemo(() => {
    const finalized = readFinalizedPanelCache();
    if (finalized?.leaderboard?.length) return finalized.leaderboard;
    return buildInvestmentLeaderboard(
      squads.map((s) => ({ squadName: s, totalInvestment: allocations[s]?.amount ?? 0 })),
    );
  }, [squads, allocations, sessionFinalized]);

  const loadPortfolio = useCallback(async () => {
    if (!isSupabaseConfigured) return null;
    try {
      const data = await fetchPitchPanelistPortfolioRemote(PITCH_PANEL_ACCESS_PIN, token);
      if (!data) return null;
      setSessionFinalized(Boolean(data.sessionFinalized));
      const next = {};
      for (const row of data.allocations ?? []) {
        next[row.squadName] = {
          amount: Number(row.amount) || 0,
          comment: row.comment ?? '',
          isFinal: Boolean(row.isFinal),
        };
      }
      setAllocations(next);
      const finalized = Boolean(data.capital?.isFinalized);
      setPanelistFinalized(finalized);
      if (!finalized) {
        setView((current) => (current === 'finalized' ? 'invest' : current));
      }
      if (data.capital?.panelistName) setName(data.capital.panelistName);
      if (data.capital?.panelistOrg) setOrg(data.capital.panelistOrg);
      return data;
    } catch {
      return null;
    }
  }, [token]);

  useEffect(() => {
    document.title = 'SPIKE Venture Capital';
    document.documentElement.classList.add('pitch-panel-guest');
    return () => document.documentElement.classList.remove('pitch-panel-guest');
  }, []);

  useEffect(() => {
    if (unlocked) void loadPortfolio();
  }, [unlocked, loadPortfolio]);

  // Poll cloud so coach reopen / session changes reach panelists without a full reload.
  useEffect(() => {
    if (!unlocked || sessionFinalized || !isSupabaseConfigured) return undefined;
    const timer = window.setInterval(() => {
      void loadPortfolio();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [unlocked, sessionFinalized, loadPortfolio]);

  useEffect(() => {
    const squadChanged = prevSquadRef.current !== squadName;
    if (squadChanged) {
      prevSquadRef.current = squadName;
      editingDraftRef.current = false;
    }
    // Poll/sync may rebuild `allocations` every few seconds — only hydrate the form
    // when switching squads or when the panelist is not mid-edit.
    if (!squadChanged && editingDraftRef.current) return;
    const row = squadName ? allocations[squadName] : null;
    setAmount(row?.amount ?? 0);
    setComment(row?.comment ?? '');
  }, [squadName, allocations]);

  function setAmountDraft(next) {
    editingDraftRef.current = true;
    setSaved(false);
    setAmount(next);
  }

  function setCommentDraft(next) {
    editingDraftRef.current = true;
    setSaved(false);
    setComment(next);
  }

  async function handleUnlock(e) {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured) {
      setError('Cloud sync is not available. Ask the program coach to run Demo Day from the faculty tablet.');
      return;
    }
    if (pin.trim().toUpperCase() !== PITCH_PANEL_ACCESS_PIN) {
      setError('Invalid access PIN.');
      return;
    }
    setBusy(true);
    try {
      const list = await fetchPitchPanelSquads(pin.trim());
      setSquads(list);
      setSquadName(list[0] ?? '');
      setUnlocked(true);
      await loadPortfolio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load squads.');
    } finally {
      setBusy(false);
    }
  }

  async function saveAllocation(targetSquad = squadName, targetAmount = amount, targetComment = comment) {
    if (!name.trim()) {
      setError('Enter your name.');
      return false;
    }
    if (!isValidInvestmentIncrement(targetAmount)) {
      setError('Use ₱10,000 increments (₱0 allowed).');
      return false;
    }
    const otherTotal = Object.entries(allocations)
      .filter(([k]) => k !== targetSquad)
      .reduce((sum, [, v]) => sum + (v.amount || 0), 0);
    if (otherTotal + targetAmount > 1_000_000) {
      setError('Total allocation cannot exceed ₱1,000,000.');
      return false;
    }

    setBusy(true);
    setError('');
    try {
      await submitPitchPanelInvestmentRemote({
        pin: PITCH_PANEL_ACCESS_PIN,
        panelistToken: token,
        panelistName: name.trim(),
        panelistOrg: org.trim(),
        squadName: targetSquad,
        amount: targetAmount,
        comment: targetComment,
      });
      setAllocations((prev) => ({
        ...prev,
        [targetSquad]: { amount: targetAmount, comment: targetComment, isFinal: false },
      }));
      editingDraftRef.current = false;
      setSaved(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save investment.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveCurrent(e) {
    e?.preventDefault?.();
    await saveAllocation();
  }

  async function handlePortfolioChange(squad, newAmount) {
    const row = allocations[squad] ?? { amount: 0, comment: '' };
    const ok = await saveAllocation(squad, newAmount, row.comment ?? '');
    if (ok) setAllocations((prev) => ({ ...prev, [squad]: { ...row, amount: newAmount, isFinal: false } }));
  }

  async function handleFinalizePortfolio() {
    setBusy(true);
    setError('');
    try {
      await finalizePitchPanelistPortfolioRemote(PITCH_PANEL_ACCESS_PIN, token);
      setPanelistFinalized(true);
      await loadPortfolio();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not finalize portfolio.');
    } finally {
      setBusy(false);
    }
  }

  async function handleResumeInvesting() {
    setBusy(true);
    setError('');
    try {
      const data = await loadPortfolio();
      if (data?.capital?.isFinalized) {
        setError('Portfolio is still locked. Ask the coach to reopen it, then tap Continue again.');
        return;
      }
      setView('invest');
      setSaved(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleTieVote(squad) {
    setBusy(true);
    try {
      await submitPitchPanelTieVoteRemote(PITCH_PANEL_ACCESS_PIN, token, squad);
      setTieSquads(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vote failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-slate-900 to-slate-800 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] text-white">
        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-400">SPIKE Venture Capital</p>
          <h1 className="mt-2 text-3xl font-black leading-tight">Demo Day Investor</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-300">
            You receive ₱1,000,000 to allocate across presenting squads. Enter your invite PIN to begin.
          </p>
          <form onSubmit={handleUnlock} className="mt-8 space-y-4 rounded-3xl border border-slate-700 bg-slate-800/80 p-5 sm:p-6">
            <label className="block text-sm font-semibold text-slate-300">
              Access PIN
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                className={`${INPUT_CLASS} text-center text-xl font-bold tracking-[0.25em]`}
                placeholder="W2PITCH"
                autoComplete="off"
              />
            </label>
            {error ? <p className="rounded-xl bg-red-900/50 px-4 py-3 text-sm text-red-200">{error}</p> : null}
            <button type="submit" disabled={busy || !pin.trim()} className={BTN_PRIMARY}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              Enter Demo Day
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (sessionFinalized) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white px-4 py-8">
        <ConfettiCelebration active={leaderboard[0]?.totalInvestment > 0} />
        <div className="mx-auto max-w-3xl">
          <PitchFundingResults leaderboard={leaderboard} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {!panelistFinalized && view === 'portfolio' ? (
              <button
                type="button"
                onClick={() => setView('invest')}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Back to squad investment"
              >
                <ChevronLeft size={18} aria-hidden />
                Back
              </button>
            ) : null}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">SPIKE VC</p>
              <h1 className="truncate text-lg font-bold text-slate-900">
                {panelistFinalized ? 'Portfolio locked' : view === 'portfolio' ? 'Investment Committee' : squadName}
              </h1>
            </div>
          </div>
          <Wallet size={20} className="shrink-0 text-orange-500" aria-hidden />
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-28">
        <PanelistIdentityCard
          panelistName={name}
          panelistOrg={org}
          remainingCapital={remaining}
          allocatedCapital={PITCH_PANEL_CAPITAL - remaining}
          isFinalized={panelistFinalized}
          readOnly={panelistFinalized}
          showCapitalBar={false}
          onNameChange={setName}
          onOrgChange={setOrg}
        />

        <VentureCapitalHeader remaining={remaining} />

        {panelistFinalized ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
            <Lock size={20} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Investment portfolio finalized</p>
              <p className="mt-1 text-sm">Awaiting program coach to lock Demo Day results.</p>
              <button
                type="button"
                onClick={() => void handleResumeInvesting()}
                disabled={busy}
                className="mt-3 min-h-[44px] rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-bold text-emerald-900"
              >
                {busy ? 'Checking…' : 'Continue allocating'}
              </button>
            </div>
          </div>
        ) : null}

        {!panelistFinalized && view !== 'invest' && view !== 'portfolio' ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
            <p className="font-semibold">Ready to invest again</p>
            <p className="mt-1 text-sm">Your portfolio was reopened — continue allocating across squads.</p>
            <button
              type="button"
              onClick={() => setView('invest')}
              className="mt-3 min-h-[44px] rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white"
            >
              Start investing
            </button>
          </div>
        ) : null}

        {saved && !panelistFinalized ? (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <span>Provisional investment saved for {squadName}.</span>
          </div>
        ) : null}

        {!panelistFinalized && view === 'invest' ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Squad presenting now</h2>
              <div className="mt-3">
                <SquadPicker squads={squads} value={squadName} onChange={(s) => { setSquadName(s); setSaved(false); }} />
              </div>
            </section>

            <InvestmentAllocationPanel
              squadName={squadName}
              amount={amount}
              comment={comment}
              remaining={remaining}
              onAmountChange={setAmountDraft}
              onCommentChange={setCommentDraft}
            />

            <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <summary className="cursor-pointer font-semibold text-slate-800">What to evaluate</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {PITCH_PANEL_INVESTMENT_CRITERIA.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </details>
          </>
        ) : null}

        {!panelistFinalized && view === 'portfolio' ? (
          <InvestmentPortfolioReview
            squads={squads}
            allocations={allocations}
            remaining={remaining}
            onChange={(squad, amt) => void handlePortfolioChange(squad, amt)}
          />
        ) : null}

        {panelistFinalized && tieSquads?.length ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-bold text-amber-900">Investment Committee Discussion</h2>
            <p className="mt-1 text-sm text-amber-800">Tie detected — cast your final vote:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tieSquads.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void handleTieVote(s)}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {!panelistFinalized ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row">
            {view === 'invest' ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleSaveCurrent()}
                  disabled={busy || !name.trim() || remaining < 0}
                  className={`${BTN_PRIMARY} sm:flex-1`}
                >
                  {busy ? 'Saving…' : `Save · ${squadName}`}
                </button>
                <button
                  type="button"
                  onClick={() => setView('portfolio')}
                  className="min-h-[52px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800"
                >
                  Review portfolio
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setView('invest')}
                  className="inline-flex min-h-[52px] items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800"
                >
                  <ChevronLeft size={16} aria-hidden />
                  Back to investing
                </button>
                <button
                  type="button"
                  onClick={() => void handleFinalizePortfolio()}
                  disabled={busy || remaining < 0}
                  className={`${BTN_PRIMARY} bg-emerald-600 hover:bg-emerald-700 sm:flex-1`}
                >
                  {busy ? 'Finalizing…' : 'Finalize Investment Portfolio'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
