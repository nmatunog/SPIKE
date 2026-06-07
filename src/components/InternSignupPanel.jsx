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
            <p className="rounded-xl bg-red-50 p-2.5 text-center text-sm text-red-700">{error}</p>
          ) : null}
          <input required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} placeholder="Full name" />
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} placeholder="Email" />
          <PasswordInput required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} placeholder="Password (min 8 chars)" autoComplete="new-password" />
          <PasswordInput required minLength={8} value={password2} onChange={(e) => setPassword2(e.target.value)} className={fieldClass} placeholder="Confirm password" autoComplete="new-password" />
          <input value={university} onChange={(e) => setUniversity(e.target.value)} className={fieldClass} placeholder="University (optional)" />
          <input value={squad} onChange={(e) => setSquad(e.target.value)} className={fieldClass} placeholder="Squad (optional)" />
          <input required value={code} onChange={(e) => setCode(e.target.value)} className={`${fieldClass} uppercase`} placeholder="Daily activation code" />
          <button type="submit" disabled={submitting} className="spike-btn-primary w-full">
            {submitting ? 'Creating account…' : 'Sign up as intern'}
          </button>
        </form>
      ) : null}
    </div>
  );
});
