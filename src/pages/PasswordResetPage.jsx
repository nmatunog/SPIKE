import React, { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpikeLogo } from '../components/brand/SpikeLogo.jsx';
import { PasswordInput } from '../components/PasswordInput.jsx';

export const PasswordResetPage = memo(function PasswordResetPage({
  onPasswordReset,
  onNavigateToLogin,
}) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || (!hash.includes('type=recovery') && !hash.includes('type=magiclink'))) {
      setError('Invalid or expired password reset link. Please request a new one.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await onPasswordReset(password);
      setSuccess(true);
      setTimeout(() => {
        if (onNavigateToLogin) {
          onNavigateToLogin();
        } else {
          navigate('/');
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50/30 p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <SpikeLogo className="mx-auto mb-2 h-12" />
          </div>
          <div className="spike-card space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-800">
                Password reset successful! Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50/30 p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <SpikeLogo className="mx-auto mb-2 h-12" />
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
        </div>

        <form className="spike-card space-y-4" onSubmit={handleSubmit}>
          <h3 className="text-center text-base font-semibold text-slate-900">
            Enter your new password
          </h3>

          {error ? (
            <p className="rounded-xl bg-red-50 p-2.5 text-center text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <label className="block">
            <span className="spike-label mb-1 block">New password</span>
            <PasswordInput
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
              placeholder="••••••••"
              minLength={8}
            />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
          </label>

          <label className="block">
            <span className="spike-label mb-1 block">Confirm new password</span>
            <PasswordInput
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20"
              placeholder="••••••••"
              minLength={8}
            />
          </label>

          <button type="submit" disabled={submitting} className="spike-btn-primary w-full">
            {submitting ? 'Resetting password…' : 'Reset password'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (onNavigateToLogin) {
                  onNavigateToLogin();
                } else {
                  navigate('/');
                }
              }}
              className="text-xs font-semibold text-spike hover:underline"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
