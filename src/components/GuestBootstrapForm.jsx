import React, { memo, useState } from 'react';
import { PasswordInput } from './PasswordInput.jsx';

export const GuestBootstrapForm = memo(function GuestBootstrapForm({
  secretRequired,
  onSubmit,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        ...(secretRequired ? { setupSecret: secret } : {}),
      });
      setPassword('');
      setPassword2('');
      setSecret('');
      setName('');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="mb-2 w-full space-y-4 rounded-2xl border border-spike/20 bg-spike-muted/40 p-5 shadow-card"
      onSubmit={handleSubmit}
    >
      <div className="text-center">
        <h3 className="text-base font-semibold text-slate-900">First-time setup</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Create the first administrator account. This shortcut works only once.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 p-2.5 text-center text-sm text-red-700">{error}</p>
      ) : null}

      <label className="block">
        <span className="spike-label mb-1 block">Full name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
          placeholder="Your name"
          autoComplete="name"
        />
      </label>

      <label className="block">
        <span className="spike-label mb-1 block">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
          placeholder="you@agency.com"
          autoComplete="username"
        />
      </label>

      <label className="block">
        <span className="spike-label mb-1 block">Password</span>
        <PasswordInput
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </label>

      <label className="block">
        <span className="spike-label mb-1 block">Confirm password</span>
        <PasswordInput
          required
          minLength={8}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
          placeholder="Repeat password"
          autoComplete="new-password"
        />
      </label>

      {secretRequired ? (
        <label className="block">
          <span className="spike-label mb-1 block">Setup secret</span>
          <PasswordInput
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
            placeholder="From API SETUP_SECRET"
            autoComplete="off"
            showLabel="Show setup secret"
            hideLabel="Hide setup secret"
          />
        </label>
      ) : null}

      <button type="submit" disabled={submitting} className="spike-btn-primary w-full">
        {submitting ? 'Creating account…' : 'Create administrator & sign in'}
      </button>
    </form>
  );
});
