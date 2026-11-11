import React, { memo, useState } from 'react';
import { PasswordInput } from './PasswordInput.jsx';

export const InternSignupPanel = memo(function InternSignupPanel({ onSignup }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [university, setUniversity] = useState('');
  const [squad, setSquad] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggle = () => {
    setShow((prev) => !prev);
    setError('');
  };

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
        university: university.trim(),
        squad: squad.trim(),
        code: code.trim(),
      });
      setName('');
      setEmail('');
      setPassword('');
      setPassword2('');
      setUniversity('');
      setSquad('');
      setCode('');
      setShow(false);
    } catch (err) {
      setError(err.message || 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';

  return (
    <div className="w-full rounded-2xl border border-dashed border-slate-200 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">New intern?</p>
        <button type="button" onClick={toggle} className="text-sm font-semibold text-spike hover:underline">
          {show ? 'Hide signup' : 'Create account'}
        </button>
      </div>

      {show ? (
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-xl bg-red-50 p-2.5 text-center text-sm text-red-700" role="alert">{error}</p>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Full name</span>
            <input required id="intern-signup-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} autoComplete="name" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input required id="intern-signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} autoComplete="email" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Password</span>
            <PasswordInput required minLength={8} id="intern-signup-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} autoComplete="new-password" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Confirm password</span>
            <PasswordInput required minLength={8} id="intern-signup-password2" value={password2} onChange={(e) => setPassword2(e.target.value)} className={fieldClass} autoComplete="new-password" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">University (optional)</span>
            <input id="intern-signup-university" value={university} onChange={(e) => setUniversity(e.target.value)} className={fieldClass} autoComplete="organization" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Squad (optional)</span>
            <input id="intern-signup-squad" value={squad} onChange={(e) => setSquad(e.target.value)} className={fieldClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Daily activation code</span>
            <input required id="intern-signup-code" value={code} onChange={(e) => setCode(e.target.value)} className={`${fieldClass} uppercase`} autoComplete="one-time-code" />
          </label>
          <p className="text-xs text-slate-500">
            No confirmation email — sign in right away after creating your account.
          </p>
          <button type="submit" disabled={submitting} className="spike-btn-primary w-full">
            {submitting ? 'Creating account…' : 'Sign up as intern'}
          </button>
        </form>
      ) : null}
    </div>
  );
});
