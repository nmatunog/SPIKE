import React, { memo, useState } from 'react';

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
        className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
      />
      <input
        required
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 8 characters)"
        className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
      >
        <option value="INTERN">Intern</option>
        <option value="FACULTY">Faculty</option>
        <option value="MENTOR">Mentor (Advisory Board)</option>
        <option value="ADMIN">Admin</option>
      </select>
      {role === 'INTERN' && (
        <>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="University / recruitment source"
            className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
          />
          <input
            value={squad}
            onChange={(e) => setSquad(e.target.value)}
            placeholder="Squad (optional)"
            className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-[#8B0000]"
          />
        </>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-[#8B0000] py-2 text-sm font-bold text-white transition hover:bg-red-900 disabled:opacity-60"
      >
        {submitting ? 'Creating…' : 'Create account'}
      </button>
    </form>
  );
});
