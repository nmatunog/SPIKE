import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PasswordInput } from '../PasswordInput.jsx';
import {
  fetchRaSpikeEnrollmentOptions,
} from '../../lib/raSpikeSignupService.js';
import { RA_SPIKE_AGENCIES } from '../../../shared/raSpikeAgencies.js';

const STEPS = ['Account', 'Your batch', 'Done'];

/**
 * @param {{
 *   onSignup: (payload: {
 *     name: string,
 *     mobile: string,
 *     email: string,
 *     password: string,
 *     batchInviteCode?: string,
 *     cohortId?: number,
 *   }) => Promise<void>,
 * }} props
 */
export const RaSpikeSignupPanel = memo(function RaSpikeSignupPanel({ onSignup }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [agency, setAgency] = useState('');
  const [unitManager, setUnitManager] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [options, setOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fieldClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const data = await fetchRaSpikeEnrollmentOptions();
      setOptions(data);
    } catch {
      setOptions({ agencies: [] });
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) void loadOptions();
  }, [show, loadOptions]);

  useEffect(() => {
    if (step === 1) void loadOptions();
  }, [step, loadOptions]);

  const agencyOptions = useMemo(() => {
    const fromApi = options?.agencies ?? [];
    if (fromApi.length) return fromApi;
    return RA_SPIKE_AGENCIES.map((name) => ({ agency: name, unitManagers: [] }));
  }, [options]);

  const unitManagers = useMemo(() => {
    const entry = agencyOptions.find((a) => a.agency === agency);
    return entry?.unitManagers ?? [];
  }, [agencyOptions, agency]);

  const batches = useMemo(() => {
    const entry = unitManagers.find((u) => u.unitManager === unitManager);
    return entry?.batches ?? [];
  }, [unitManagers, unitManager]);

  useEffect(() => {
    if (!agency || !unitManagers.length) return;
    if (unitManagers.length === 1 && !unitManager) {
      setUnitManager(unitManagers[0].unitManager);
    }
  }, [agency, unitManagers, unitManager]);

  useEffect(() => {
    if (!unitManager || !batches.length) return;
    if (batches.length === 1 && !cohortId) {
      setCohortId(String(batches[0].cohortId));
    }
  }, [unitManager, batches, cohortId]);

  function resetForm() {
    setStep(0);
    setName('');
    setMobile('');
    setEmail('');
    setPassword('');
    setPassword2('');
    setInviteCode('');
    setAgency('');
    setUnitManager('');
    setCohortId('');
    setError('');
  }

  function goStep1(e) {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    if (mobile.replace(/\D/g, '').length < 10) {
      setError('Enter a valid mobile number.');
      return;
    }
    setStep(1);
  }

  async function submitSignup(e) {
    e.preventDefault();
    setError('');
    const code = inviteCode.trim();
    const selectedCohortId = cohortId ? Number(cohortId) : null;
    if (!code && !Number.isFinite(selectedCohortId)) {
      setError('Enter your batch invite code or select agency, unit manager, and batch.');
      return;
    }
    setSubmitting(true);
    try {
      await onSignup({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        password,
        batchInviteCode: code || undefined,
        cohortId: Number.isFinite(selectedCohortId) ? selectedCohortId : undefined,
      });
      resetForm();
      setShow(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full rounded-2xl border border-spike/25 bg-gradient-to-b from-spike-muted/40 to-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">Join RA-SPIKE™</p>
          <p className="text-xs text-slate-600">Rookie Academy — new participants only</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShow((v) => !v);
            setError('');
          }}
          className="text-sm font-semibold text-spike hover:underline"
        >
          {show ? 'Hide' : 'Create account'}
        </button>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        Already have an account? Use <strong className="font-semibold text-slate-800">Sign in to SPIKE</strong>{' '}
        above — same login for RA-SPIKE rookies and program coaches.
      </p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Coaches and mentors: sign in above (not here). Your staff role is unchanged.
      </p>

      {show ? (
        <div className="mt-4 space-y-4">
          <ol className="flex gap-2 text-2xs font-semibold uppercase tracking-wide text-slate-500">
            {STEPS.slice(0, 2).map((label, index) => (
              <li
                key={label}
                className={index === step ? 'text-spike' : index < step ? 'text-slate-700' : ''}
              >
                {index + 1}. {label}
              </li>
            ))}
          </ol>

          {error ? (
            <p className="rounded-xl bg-red-50 p-2.5 text-center text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          {step === 0 ? (
            <form className="space-y-3" onSubmit={goStep1}>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Full name</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} autoComplete="name" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Mobile number</span>
                <input required type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} className={fieldClass} autoComplete="tel" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Email</span>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} autoComplete="email" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Password</span>
                <PasswordInput required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} autoComplete="new-password" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Confirm password</span>
                <PasswordInput required minLength={8} value={password2} onChange={(e) => setPassword2(e.target.value)} className={fieldClass} autoComplete="new-password" />
              </label>
              <button type="submit" className="spike-btn-primary min-h-[48px] w-full">
                Next — choose your batch
              </button>
            </form>
          ) : null}

          {step === 1 ? (
            <form className="space-y-3" onSubmit={submitSignup}>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Batch invite code</span>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className={`${fieldClass} uppercase`}
                  placeholder="From your coach"
                  autoComplete="off"
                />
              </label>
              <p className="text-center text-xs text-slate-500">— or select your batch —</p>
              {optionsLoading ? (
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="animate-spin" size={16} /> Loading batches…
                </p>
              ) : (
                <>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Agency</span>
                    <select
                      value={agency}
                      onChange={(e) => {
                        setAgency(e.target.value);
                        setUnitManager('');
                        setCohortId('');
                      }}
                      className={fieldClass}
                    >
                      <option value="">Select agency</option>
                      {agencyOptions.map((a) => (
                        <option key={a.agency} value={a.agency}>{a.agency}</option>
                      ))}
                    </select>
                  </label>
                  {agency && !unitManagers.length ? (
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      No open batches for this agency yet. Enter your invite code above or ask your coach.
                    </p>
                  ) : null}
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Unit Manager</span>
                    <select
                      value={unitManager}
                      onChange={(e) => {
                        setUnitManager(e.target.value);
                        setCohortId('');
                      }}
                      className={fieldClass}
                      disabled={!agency || !unitManagers.length}
                    >
                      <option value="">
                        {!agency ? 'Select agency first' : unitManagers.length ? 'Select unit manager' : 'No unit managers yet'}
                      </option>
                      {unitManagers.map((u) => (
                        <option key={u.unitManager} value={u.unitManager}>{u.unitManager}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Batch</span>
                    <select
                      value={cohortId}
                      onChange={(e) => setCohortId(e.target.value)}
                      className={fieldClass}
                      disabled={!unitManager || !batches.length}
                    >
                      <option value="">
                        {!unitManager ? 'Select unit manager first' : batches.length ? 'Select batch' : 'No batches yet'}
                      </option>
                      {batches.map((b) => (
                        <option key={b.cohortId} value={String(b.cohortId)}>{b.batchLabel}</option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" className="spike-btn-secondary min-h-[48px] flex-1" onClick={() => setStep(0)}>
                  Back
                </button>
                <button type="submit" disabled={submitting} className="spike-btn-primary min-h-[48px] flex-1">
                  {submitting ? 'Creating account…' : 'Create account'}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                After signup you&apos;ll add an optional profile photo, then start Week 1.
              </p>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
