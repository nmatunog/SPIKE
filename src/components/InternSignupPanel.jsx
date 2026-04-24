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

  return (
    <div className="mt-4 w-full rounded-2xl border border-dashed border-gray-300 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">New intern?</p>
        <button
          type="button"
          onClick={toggle}
          className="text-xs font-bold text-[#8B0000] underline"
        >
          {show ? 'Hide signup' : 'Create intern account'}
        </button>
      </div>
      {show && (
        <form className="space-y-3" onSubmit={handleSubmit}>
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-center text-sm text-red-700">{error}</p>
          )}
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
            placeholder="Full name"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
            placeholder="Email"
          />
          <PasswordInput
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
            placeholder="Password (min 8 chars)"
            autoComplete="new-password"
          />
          <PasswordInput
            required
            minLength={8}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
            placeholder="Confirm password"
            autoComplete="new-password"
          />
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
            placeholder="University / recruitment source (optional)"
          />
          <input
            value={squad}
            onChange={(e) => setSquad(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-[#8B0000]"
            placeholder="Squad (optional)"
          />
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm uppercase outline-none focus:border-[#8B0000]"
            placeholder="Daily activation code"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#8B0000] py-2.5 text-sm font-bold text-white transition hover:bg-red-900 disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Sign up as intern'}
          </button>
        </form>
      )}
    </div>
  );
});
