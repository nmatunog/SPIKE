import React, { memo, useState } from 'react';
import { PasswordInput } from './PasswordInput.jsx';

export const GuestLoginForm = memo(function GuestLoginForm({
  heading,
  onLogin,
  usingSupabaseAuth = false,
  onRequestPasswordHelp,
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
    <form
      className="w-full space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h3 className="text-center text-sm font-bold text-gray-800">{heading}</h3>
      {error && (
        <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-700">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-700">Email</label>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-700">Password</label>
        <PasswordInput
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
          placeholder="••••••••"
        />
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => {
              setShowForgot((v) => !v);
              setHelpMessage('');
            }}
            className="text-xs font-bold text-[#8B0000] underline decoration-[#8B0000]/40 underline-offset-2 hover:decoration-[#8B0000]"
          >
            {showForgot ? 'Hide password help' : 'Forgot password?'}
          </button>
        </div>
      </div>
      {showForgot && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-left text-xs leading-relaxed text-gray-800">
          <p className="mb-2 font-bold text-amber-950">Password help (no email reset)</p>
          <p className="mb-3 text-gray-700">
            An administrator gives you a new temporary password out of band (in person, phone, or
            your program&apos;s channel). After you sign in with that password, this app will ask
            you to choose your own password when required.
          </p>
          {usingSupabaseAuth && onRequestPasswordHelp && (
            <div className="border-t border-amber-200/80 pt-3">
              <p className="mb-2 font-semibold text-amber-950">Notify administrators</p>
              <p className="mb-2 text-[11px] text-gray-600">
                Uses the email in the field above. Optional note (e.g. best time to call).
              </p>
              {helpMessage && (
                <p
                  className={`mb-2 rounded-lg p-2 text-center text-[11px] ${
                    helpMessage.startsWith('Administrators')
                      ? 'bg-green-50 text-green-800'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {helpMessage}
                </p>
              )}
              <textarea
                value={helpNote}
                onChange={(e) => setHelpNote(e.target.value)}
                rows={2}
                placeholder="Optional message to admins"
                className="mb-2 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
              />
              <button
                type="button"
                disabled={helpSubmitting}
                onClick={handleHelpRequest}
                className="w-full rounded-lg bg-amber-900 py-2 text-xs font-bold text-white transition hover:bg-amber-950 disabled:opacity-60"
              >
                {helpSubmitting ? 'Sending…' : 'Send request to administrators'}
              </button>
            </div>
          )}
          {!usingSupabaseAuth && (
            <p className="border-t border-amber-200/80 pt-2 text-[11px] text-amber-950/90">
              Contact your administrator directly to get a new password.
            </p>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-60"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
});
