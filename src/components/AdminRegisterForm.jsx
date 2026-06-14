import React, { memo, useState } from 'react';
import { PasswordInput } from './PasswordInput.jsx';

export const AdminRegisterForm = memo(function AdminRegisterForm({ onRegister }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('INTERN');
  const [university, setUniversity] = useState('');
  const [squad, setSquad] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        university: role === 'INTERN' ? university.trim() || undefined : undefined,
        squad: role === 'INTERN' ? squad.trim() || undefined : undefined,
      });
      setPassword('');
      setName('');
      setEmail('');
      setUniversity('');
      setSquad('');
      setRole('INTERN');
    } catch {
      // Parent shows errors
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-[#8B0000] sm:text-sm"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-[#8B0000] sm:text-sm"
      />
      <PasswordInput
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 8 characters)"
        className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-[#8B0000] sm:text-sm"
        autoComplete="new-password"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-[#8B0000] sm:text-sm"
      >
        <option value="INTERN">Intern</option>
        <option value="FACULTY">Program Coach</option>
        <option value="MENTOR">Mentor (Advisory Board)</option>
        <option value="ADMIN">Admin</option>
      </select>
      {role === 'INTERN' && (
        <>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="University / recruitment source"
            className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-[#8B0000] sm:text-sm"
          />
          <input
            value={squad}
            onChange={(e) => setSquad(e.target.value)}
            placeholder="Squad (optional)"
            className="min-h-[44px] w-full rounded-lg border border-gray-300 p-2.5 text-base outline-none focus:border-[#8B0000] sm:text-sm"
          />
        </>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="min-h-[44px] w-full rounded-lg bg-[#8B0000] py-2.5 text-sm font-bold text-white transition hover:bg-red-900 disabled:opacity-60"
      >
        {submitting ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
});
