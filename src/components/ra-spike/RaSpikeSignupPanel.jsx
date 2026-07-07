import { memo, useMemo, useState } from 'react';
import { PasswordInput } from '../PasswordInput.jsx';
import { RA_SPIKE_AGENCIES, raSpikeHomeOrgOptions, raSpikeUnitsForAgency } from '../../../shared/raSpikeAgencies.js';

/**
 * Minimal open enrollment — no invite code, no batch picker.
 * API assigns the active open cohort automatically.
 *
 * @param {{
 *   onSignup: (payload: {
 *     name: string,
 *     mobile: string,
 *     email: string,
 *     password: string,
 *     homeAgency: string,
 *     homeUnit: string,
 *   }) => Promise<void>,
 * }} props
 */
export const RaSpikeSignupPanel = memo(function RaSpikeSignupPanel({ onSignup }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [homeAgency, setHomeAgency] = useState('');
  const [homeUnit, setHomeUnit] = useState('');
  const [homeUnitOther, setHomeUnitOther] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fieldClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';

  const homeAgencyOptions = useMemo(() => raSpikeHomeOrgOptions(), []);
  const homeUnitOptions = useMemo(() => raSpikeUnitsForAgency(homeAgency), [homeAgency]);
  const resolvedHomeUnit = homeUnit === 'Other' ? homeUnitOther.trim() : homeUnit.trim();

  function resetForm() {
    setName('');
    setMobile('');
    setEmail('');
    setPassword('');
    setPassword2('');
    setHomeAgency('');
    setHomeUnit('');
    setHomeUnitOther('');
    setError('');
  }

  async function submitSignup(e) {
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
          <p className="text-xs text-slate-600">Rookie Academy — open enrollment</p>
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

      <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900">
        No invite code or batch selection needed — you&apos;ll join the current open cohort automatically.
      </p>

      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        Already have an account? Sign in above. Coaches and mentors: sign in above (not here).
      </p>

      {show ? (
        <form className="mt-4 space-y-3" onSubmit={(e) => void submitSignup(e)}>
          {error ? (
            <p className="rounded-xl bg-red-50 p-2.5 text-center text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

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
              {(homeAgencyOptions.length
                ? homeAgencyOptions
                : RA_SPIKE_AGENCIES.map((a) => ({ agency: a, units: [] }))
              ).map((a) => (
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

          <button type="submit" disabled={submitting} className="spike-btn-primary min-h-[48px] w-full">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-xs text-slate-500">
            After signup you can upload your Dream Board and register your squad right away.
          </p>
        </form>
      ) : null}
    </div>
  );
});
