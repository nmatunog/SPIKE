import { useMemo, useState } from 'react';

const USERS = [
  { id: 'intern', label: 'Intern learner (synthetic)' },
  { id: 'other', label: 'Other person (synthetic)' },
  { id: 'ra', label: 'RA-SPIKE learner (synthetic)' },
];

const COURSES = [
  { id: 'spike-interns', label: 'SPIKE for Interns' },
  { id: 'ra-spike', label: 'RA-SPIKE' },
];

const OFFERINGS = [
  { id: 'financial-literacy', label: 'Financial Literacy (free L1 — no code)', level: 'L1' },
  { id: 'fep', label: 'FEP (free L1 — no code)', level: 'L1' },
  { id: 'financial-entrepreneurship', label: 'Financial Entrepreneurship (paid L2)', level: 'L2' },
];

const STATE_STYLES = {
  success: 'bg-emerald-50 text-emerald-800',
  invalid: 'bg-red-50 text-red-700',
  expired: 'bg-slate-100 text-slate-800',
  'already-redeemed': 'bg-amber-50 text-amber-900',
  'identity-mismatch': 'bg-orange-50 text-orange-900',
  'wrong-course-level': 'bg-violet-50 text-violet-900',
  'free-no-code': 'bg-sky-50 text-sky-900',
};

/**
 * Standalone local harness. DEV-only. Calls the portable verifier through
 * the VERSA_DEMO_LOCAL Vite middleware — not intern or RA-SPIKE onboarding.
 */
export function VersaActivateHarness() {
  const [userId, setUserId] = useState('intern');
  const [course, setCourse] = useState('spike-interns');
  const [offeringId, setOfferingId] = useState('financial-literacy');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState('');
  const [message, setMessage] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const offering = OFFERINGS.find((row) => row.id === offeringId) || OFFERINGS[0];
  const freeOffering = offering.id === 'financial-literacy' || offering.id === 'fep';

  const hint = useMemo(
    () => ({
      intern: 'SYN-L1-VALID-A1B2 · SYN-UNKNOWN-XXXX · SYN-L1-EXPIRED-J0 · SYN-L1-REUSED-E5 · SYN-L1-WRONG-ID-C3 · SYN-L1-ROUTE-H8 / SYN-L2-LEVEL-D4',
      other: 'SYN-L1-WRONG-ID-C3 (this user) · SYN-L1-VALID-A1B2 (identity mismatch)',
      ra: 'SYN-RA-L1-VALID · SYN-L1-VALID-A1B2 (wrong course)',
    })[userId],
    [userId],
  );

  const run = async (submittedCode) => {
    setBusy(true);
    setMessage('');
    setState('');
    try {
      const response = await fetch('/api/versa/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Versa-Demo-User': userId,
        },
        body: JSON.stringify({
          code: submittedCode,
          intendedCourse: course,
          intendedLevel: offering.level,
          offeringId,
        }),
      });
      const data = await response.json().catch(() => ({}));
      const nextState = data.state || (response.ok ? 'success' : 'invalid');
      setState(nextState);
      setMessage(data.confirmation || data.message || '');
      if (nextState === 'success') setCode('');
    } catch (err) {
      setState('invalid');
      setMessage(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10" data-testid="versa-verifier-harness">
      <div className="mx-auto w-full max-w-md space-y-4">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-amber-700">
          Standalone portable verifier — not intern or RA-SPIKE onboarding
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <label className="block">
            <span className="mb-1 block font-medium text-slate-700">Authenticated learner</span>
            <select
              data-testid="versa-demo-user"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={userId}
              onChange={(event) => {
                setUserId(event.target.value);
                setResetKey((n) => n + 1);
                setState('');
              }}
            >
              {USERS.map((user) => (
                <option key={user.id} value={user.id}>{user.label}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block font-medium text-slate-700">Intended course</span>
            <select
              data-testid="versa-demo-course"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={course}
              onChange={(event) => {
                setCourse(event.target.value);
                setResetKey((n) => n + 1);
                setState('');
              }}
            >
              {COURSES.map((row) => (
                <option key={row.id} value={row.id}>{row.label}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block font-medium text-slate-700">Intended offering / level</span>
            <select
              data-testid="versa-demo-offering"
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
              value={offeringId}
              onChange={(event) => {
                setOfferingId(event.target.value);
                setResetKey((n) => n + 1);
                setState('');
              }}
            >
              {OFFERINGS.map((row) => (
                <option key={row.id} value={row.id}>{row.label}</option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-xs text-slate-500">{hint}</p>
        </div>

        <section
          key={resetKey}
          className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          data-testid="versa-enrollment-panel"
        >
          <p className="text-2xs font-semibold uppercase tracking-wide text-slate-400">SPIKE × Versa</p>
          <h1 className="mt-1 text-base font-semibold text-slate-900">Portable access verification</h1>
          <p className="mt-1 text-xs text-slate-500">
            Synthetic inventory only. One-time redeem. A code never grants another course.
          </p>

          {state ? (
            <div
              className={`mt-3 rounded-xl p-2.5 text-sm ${STATE_STYLES[state] || STATE_STYLES.invalid}`}
              role={state === 'success' || state === 'free-no-code' ? 'status' : 'alert'}
              data-testid="versa-enrollment-state"
              data-state={state}
            >
              {message}
            </div>
          ) : null}

          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              run(code);
            }}
          >
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Access code</span>
              <input
                data-testid="versa-access-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
                autoComplete="off"
                spellCheck={false}
                disabled={busy}
              />
            </label>
            <button
              type="submit"
              data-testid="versa-verify"
              disabled={busy || !code.trim()}
              className="spike-btn-primary w-full"
            >
              {busy ? 'Checking access…' : 'Verify code'}
            </button>
          </form>

          {freeOffering ? (
            <button
              type="button"
              data-testid="versa-free-no-code"
              className="mt-3 w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-900"
              disabled={busy}
              onClick={() => run('')}
            >
              Continue without a code (free L1 / FEP)
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default VersaActivateHarness;
