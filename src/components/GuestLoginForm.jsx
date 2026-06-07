import React, { memo, useState } from 'react';
import { PasswordInput } from './PasswordInput.jsx';

export const GuestLoginForm = memo(function GuestLoginForm({
  heading,
  onLogin,
  usingSupabaseAuth = false,
  onRequestPasswordHelp,
  mockAuthEnabled = false,
  mockAccounts = [],
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [helpNote, setHelpNote] = useState('');
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin(email.trim(), password);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpRequest = async (e) => {
    e.preventDefault();
    setHelpMessage('');
    if (!onRequestPasswordHelp) return;
    const em = email.trim();
    if (!em || !em.includes('@')) {
      setHelpMessage('Enter your email above first.');
      return;
    }
    setHelpSubmitting(true);
    try {
      await onRequestPasswordHelp(em, helpNote);
      setHelpNote('');
      setHelpMessage('Administrators have been notified. They will contact you with a new password.');
    } catch (err) {
      setHelpMessage(err.message || 'Could not send request.');
    } finally {
      setHelpSubmitting(false);
    }
  };

  return (
    <form className="spike-card w-full space-y-4" onSubmit={handleSubmit}>
      <h3 className="text-center text-base font-semibold text-slate-900">{heading}</h3>

      {mockAuthEnabled && mockAccounts.length > 0 ? (
        <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50/70 p-3 text-left text-xs text-slate-700">
          <p className="mb-1 font-semibold text-sky-900">Demo accounts</p>
          <p className="mb-2 text-2xs text-slate-600">
            Password: <span className="font-mono font-semibold">password123</span>
          </p>
          <ul className="space-y-1">
            {mockAccounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  className="font-semibold text-spike underline decoration-spike/30 underline-offset-2 hover:decoration-spike"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('password123');
                    setError('');
                  }}
                >
                  {account.email}
                </button>
                <span className="text-slate-500">
                  {' '}
                  — {account.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 p-2.5 text-center text-sm text-red-700">{error}</p>
      ) : null}

      <label className="block">
        <span className="spike-label mb-1 block">Email</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="spike-label mb-1 block">Password</span>
        <PasswordInput
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
          placeholder="••••••••"
        />
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => {
              setShowForgot((v) => !v);
              setHelpMessage('');
            }}
            className="text-xs font-semibold text-spike hover:underline"
          >
            {showForgot ? 'Hide password help' : 'Forgot password?'}
          </button>
        </div>
      </label>

      {showForgot ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-left text-xs leading-relaxed text-slate-800">
          <p className="mb-2 font-semibold text-amber-950">Password help</p>
          <p className="mb-3 text-slate-700">
            Contact your administrator for a temporary password, then sign in and set your own when
            prompted.
          </p>
          {usingSupabaseAuth && onRequestPasswordHelp ? (
            <div className="border-t border-amber-200/80 pt-3">
              {helpMessage ? (
                <p
                  className={`mb-2 rounded-lg p-2 text-center text-[11px] ${
                    helpMessage.startsWith('Administrators')
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {helpMessage}
                </p>
              ) : null}
              <textarea
                value={helpNote}
                onChange={(e) => setHelpNote(e.target.value)}
                rows={2}
                placeholder="Optional note for admins"
                className="mb-2 w-full rounded-xl border border-slate-200 p-2 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
              />
              <button
                type="button"
                disabled={helpSubmitting}
                onClick={handleHelpRequest}
                className="w-full rounded-xl bg-amber-900 py-2 text-xs font-semibold text-white transition hover:bg-amber-950 disabled:opacity-60"
              >
                {helpSubmitting ? 'Sending…' : 'Notify administrators'}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <button type="submit" disabled={submitting} className="spike-btn-primary w-full">
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
});
