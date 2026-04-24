import React, { memo, useState } from 'react';
import { Shield } from 'lucide-react';
import { PasswordInput } from './PasswordInput.jsx';
import { supabase } from '../supabaseClient.js';
import { apiFetch } from '../apiClient.js';

export const ForcePasswordChangeGate = memo(function ForcePasswordChangeGate({
  usingSupabaseAuth,
  token,
  email,
  onDone,
  showToast,
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [next2, setNext2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (next !== next2) {
      setError('New passwords do not match.');
      return;
    }
    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      if (usingSupabaseAuth) {
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email,
          password: current,
        });
        if (verifyErr) throw new Error('Current password is incorrect.');
        const { error: upErr } = await supabase.auth.updateUser({
          password: next,
          data: { must_change_password: false },
        });
        if (upErr) throw upErr;
      } else {
        if (!token) throw new Error('Not signed in.');
        await apiFetch('/api/auth/change-password', {
          token,
          method: 'POST',
          body: { currentPassword: current, newPassword: next },
        });
      }
      showToast('Password updated.', 'success');
      await onDone();
    } catch (err) {
      setError(err.message || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex flex-col items-center gap-2 text-center">
          <Shield className="text-[#8B0000]" size={40} />
          <h2 className="text-xl font-bold text-gray-900">Choose your own password</h2>
          <p className="text-sm text-gray-600">
            An administrator created this account and set your first password. Enter that password
            once, then choose a new one. You need to finish this step before using the portal.
          </p>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-700">{error}</p>
          )}
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              Current password (from your administrator)
            </label>
            <PasswordInput
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">New password</label>
            <PasswordInput
              required
              minLength={8}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-gray-700">
              Confirm new password
            </label>
            <PasswordInput
              required
              minLength={8}
              value={next2}
              onChange={(e) => setNext2(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#8B0000] py-2.5 text-sm font-bold text-white transition hover:bg-red-900 disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  );
});
