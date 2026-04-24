import React, { memo, useState } from 'react';

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
      className="mb-10 w-full space-y-4 rounded-2xl border-2 border-[#8B0000]/30 bg-red-50/50 p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h3 className="text-center text-lg font-bold text-gray-900">
        First-time setup: create administrator
      </h3>
      <p className="text-center text-xs text-gray-600">
        This form appears only when the database has no users. You will be signed in as an admin.
        No one else can use this shortcut after the first account exists.
      </p>
      {error && (
        <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-700">{error}</p>
      )}
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-700">Full name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
          placeholder="Your name"
          autoComplete="name"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-700">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
          placeholder="you@agency.com"
          autoComplete="username"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-700">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-700">Confirm password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
          placeholder="Repeat password"
          autoComplete="new-password"
        />
      </div>
      {secretRequired && (
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-700">Setup secret</label>
          <input
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm outline-none focus:border-[#8B0000]"
            placeholder="Value from API SETUP_SECRET"
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-gray-500">
            Your API host must define{' '}
            <code className="rounded bg-gray-100 px-1">SETUP_SECRET</code> for this field to
            appear.
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#8B0000] py-2.5 text-sm font-bold text-white transition hover:bg-red-900 disabled:opacity-60"
      >
        {submitting ? 'Creating account…' : 'Create administrator & sign in'}
      </button>
    </form>
  );
});
