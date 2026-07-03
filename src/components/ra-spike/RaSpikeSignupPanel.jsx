import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PasswordInput } from '../PasswordInput.jsx';
import { fetchRaSpikeEnrollmentOptions } from '../../lib/raSpikeSignupService.js';
import { RA_SPIKE_AGENCIES, raSpikeHomeOrgOptions, raSpikeUnitsForAgency } from '../../../shared/raSpikeAgencies.js';

const STEPS = ['Account', 'Batch & unit', 'Done'];

/**
 * @param {{
 *   onSignup: (payload: {
 *     name: string,
 *     mobile: string,
 *     email: string,
 *     password: string,
 *     batchInviteCode?: string,
 *     cohortId?: number,
 *     homeAgency: string,
 *     homeUnit: string,
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
  const [cohortId, setCohortId] = useState('');
  const [homeAgency, setHomeAgency] = useState('');
  const [homeUnit, setHomeUnit] = useState('');
  const [homeUnitOther, setHomeUnitOther] = useState('');
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
      setOptions({ batches: [], agencies: raSpikeHomeOrgOptions() });
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

  const openBatches = useMemo(() => options?.batches ?? [], [options]);

  const homeAgencyOptions = useMemo(() => {
    const fromApi = options?.agencies ?? [];
    if (fromApi.length) return fromApi;
    return raSpikeHomeOrgOptions();
  }, [options]);

  const homeUnitOptions = useMemo(() => raSpikeUnitsForAgency(homeAgency), [homeAgency]);

  const resolvedHomeUnit = homeUnit === 'Other' ? homeUnitOther.trim() : homeUnit.trim();

  useEffect(() => {
    if (openBatches.length === 1 && !cohortId && !inviteCode.trim()) {
      setCohortId(String(openBatches[0].cohortId));
    }
  }, [openBatches, cohortId, inviteCode]);

  function resetForm() {
    setStep(0);
    setName('');
    setMobile('');
    setEmail('');
    setPassword('');
    setPassword2('');
    setInviteCode('');
    setCohortId('');
    setHomeAgency('');
    setHomeUnit('');
    setHomeUnitOther('');
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
      setError('Enter your batch invite code or select your batch.');
      return;
    }
    if (!homeAgency) {
      setError('Select your home agency.');
      return;
    }
    if (!resolvedHomeUnit) {
      setError(homeUnit === 'Other' ? 'Enter your unit name.' : 'Select your home unit.');
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
        homeAgency,
        homeUnit: resolvedHomeUnit,
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
                Next — batch &amp; home unit
              </button>
            </form>
          ) : null}

          {step === 1 ? (
            <form className="space-y-3" onSubmit={submitSignup}>
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
                Each batch includes advisors from many agencies and units. Choose your batch, then tell us your{' '}
                <strong className="font-semibold text-slate-800">home agency and unit</strong>.
              </p>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your batch</p>
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
              <p className="text-center text-xs text-slate-500">— or select batch —</p>
              {optionsLoading ? (
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="animate-spin" size={16} /> Loading batches…
                </p>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Batch</span>
                  <select
                    value={cohortId}
                    onChange={(e) => setCohortId(e.target.value)}
                    className={fieldClass}
                    disabled={!openBatches.length}
                  >
                    <option value="">
                      {openBatches.length ? 'Select batch' : 'No open batches — use invite code'}
                    </option>
                    {openBatches.map((b) => (
                      <option key={b.cohortId} value={String(b.cohortId)}>{b.batchLabel}</option>
                    ))}
                  </select>
                </label>
              )}

              <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Your home organization</p>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Home agency</span>
                <select
                  required
                  value={homeAgency}
                  onChange={(e) => {
                    setHomeAgency(e.target.value);
                    setHomeUnit('');
                    setHomeUnitOther('');
                  }}
                  className={fieldClass}
                >
                  <option value="">Select agency</option>
                  {(homeAgencyOptions.length ? homeAgencyOptions : RA_SPIKE_AGENCIES.map((a) => ({ agency: a, units: [] }))).map((a) => (
                    <option key={a.agency} value={a.agency}>{a.agency}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Home unit</span>
                <select
                  required
                  value={homeUnit}
                  onChange={(e) => {
                    setHomeUnit(e.target.value);
                    setHomeUnitOther('');
                  }}
                  className={fieldClass}
                  disabled={!homeAgency}
                >
                  <option value="">{homeAgency ? 'Select unit' : 'Select agency first'}</option>
                  {homeUnitOptions.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </label>
              {homeUnit === 'Other' ? (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Unit name</span>
                  <input
                    required
                    value={homeUnitOther}
                    onChange={(e) => setHomeUnitOther(e.target.value)}
                    className={fieldClass}
                    placeholder="Enter your unit"
                  />
                </label>
              ) : null}

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
