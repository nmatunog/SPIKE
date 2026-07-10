import React, { memo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { PasswordInput } from '../PasswordInput.jsx';
import { PROGRAM_COACH_LABEL } from '../../lib/terminology.js';
import { createPortalUserViaApi, formatAuthEmailError } from '../../lib/userAdminService.js';

/** @param {{ onCreated?: () => void | Promise<void> }} props */
export const SuperuserAddCoachPanel = memo(function SuperuserAddCoachPanel({ onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await createPortalUserViaApi({
        name: name.trim(),
        email: email.trim(),
        password,
        role: 'FACULTY',
        reason: 'Superuser added program coach',
      });
      setSuccess(`${PROGRAM_COACH_LABEL} account created. They can sign in at the portal with the email and password you set.`);
      setName('');
      setEmail('');
      setPassword('');
      await onCreated?.();
    } catch (err) {
      setError(formatAuthEmailError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-spike/25 bg-spike-muted/20 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="text-spike" size={22} />
        <h3 className="text-lg font-bold text-gray-900">Add {PROGRAM_COACH_LABEL}</h3>
      </div>
      <p className="mb-4 text-sm text-gray-600">
        Staff self-signup is disabled. Create {PROGRAM_COACH_LABEL.toLowerCase()} accounts here — no registration
        code and no confirmation email.
      </p>
      <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-spike sm:text-sm"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-spike sm:text-sm"
        />
        <PasswordInput
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temporary password (min 8 characters)"
          className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-spike sm:text-sm"
          autoComplete="new-password"
        />
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{success}</p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] w-full rounded-lg bg-spike py-2.5 text-sm font-bold text-white transition hover:bg-spike/90 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : `Create ${PROGRAM_COACH_LABEL} account`}
        </button>
      </form>
    </section>
  );
});
