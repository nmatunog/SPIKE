import React, { memo, useState } from 'react';
import { PasswordInput } from './PasswordInput.jsx';

const STAFF_ROLES = [
  { value: 'FACULTY', label: 'Program Coach' },
  { value: 'MENTOR', label: 'Advisor (Mentor)' },
  { value: 'ADMIN', label: 'Administrator' },
];

export const StaffSignupPanel = memo(function StaffSignupPanel({
  onSignup,
  bootstrapMode = false,
  defaultOpen = false,
}) {
  const [show, setShow] = useState(defaultOpen || bootstrapMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [role, setRole] = useState('FACULTY');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fieldClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await onSignup({
        name: name.trim(),
        email: email.trim(),
        password,
        role: bootstrapMode ? 'SUPERUSER' : role,
        code: bootstrapMode ? '' : code.trim(),
        bootstrapMode,
      });
      setName('');
      setEmail('');
      setPassword('');
      setPassword2('');
      setCode('');
      setShow(false);
    } catch (err) {
      setError(err.message || 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">
          {bootstrapMode ? 'First-time setup: create the superuser account' : 'Program Coach, Advisor, or Admin?'}
        </p>
        <button type="button" onClick={() => setShow((v) => !v)} className="text-sm font-semibold text-spike hover:underline">
          {show ? 'Hide signup' : bootstrapMode ? 'Create superuser' : 'Create staff account'}
        </button>
      </div>
      {show ? (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-xl bg-red-50 p-2.5 text-center text-sm text-red-700">{error}</p>
          ) : null}
          {bootstrapMode ? (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-950">
              No superuser exists yet. This first account is promoted automatically — no staff code needed.
              Later staff signups will require a code from Admin.
            </p>
          ) : null}
          <input required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} placeholder="Full name" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} placeholder="Email" />
          {bootstrapMode ? null : (
            <select value={role} onChange={(e) => setRole(e.target.value)} className={fieldClass}>
              {STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          )}
          <PasswordInput required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} placeholder="Password (min 8 chars)" autoComplete="new-password" />
          <PasswordInput required minLength={8} value={password2} onChange={(e) => setPassword2(e.target.value)} className={fieldClass} placeholder="Confirm password" autoComplete="new-password" />
          {bootstrapMode ? null : (
            <input required value={code} onChange={(e) => setCode(e.target.value)} className={`${fieldClass} uppercase`} placeholder="Staff registration code" />
          )}
          <p className="text-xs text-slate-500">
            {bootstrapMode
              ? 'You will be signed in as superuser after creating this account.'
              : 'Ask an administrator for the staff registration code. You will sign in after creating your account.'}
          </p>
          <button type="submit" disabled={submitting} className="spike-btn-primary w-full">
            {submitting ? 'Creating account…' : bootstrapMode ? 'Create superuser account' : 'Sign up as staff'}
          </button>
        </form>
      ) : null}
    </div>
  );
});
