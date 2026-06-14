import { useCallback, useEffect, useState } from 'react';
import { Loader2, Shield, Trash2, UserCog } from 'lucide-react';
import {
  fetchAllUsersForSuperuser,
  runSuperuserUserAction,
} from '../../lib/userAdminService.js';
import { formatUiRoleLabel } from '../../lib/terminology.js';
import { mapApiRoleToUi } from '../../lib/roles.js';

const ROLE_OPTIONS = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'];

/** @param {{ currentUserId?: string }} props */
export function AdminUserDirectory({ currentUserId = '' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [modal, setModal] = useState(null);
  const [resultMsg, setResultMsg] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchAllUsersForSuperuser();
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function runAction(payload) {
    setBusy(payload.action);
    setError('');
    setResultMsg('');
    try {
      const res = await runSuperuserUserAction(payload);
      if (res?.temporaryPassword) {
        setResultMsg(`Temporary password: ${res.temporaryPassword} (share securely; user must change on sign-in)`);
      } else {
        setResultMsg('Action completed.');
      }
      setModal(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="animate-spin" size={16} /> Loading user directory…
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <Shield className="mt-1 text-[#8B0000]" size={22} />
        <div>
          <h3 className="text-lg font-bold text-gray-900">User directory</h3>
          <p className="text-sm text-gray-600">
            Superuser only — promote roles, edit accounts, reset passwords, or remove users. Every action
            requires a reason and is logged.
          </p>
        </div>
      </div>

      {error ? <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
      {resultMsg ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{resultMsg}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100">
                <td className="px-2 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-2 py-3 text-gray-700">{u.email}</td>
                <td className="px-2 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-800">
                    {formatUiRoleLabel(mapApiRoleToUi(u.role))}
                    {u.role === 'SUPERUSER' ? ' ★' : ''}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-xs font-bold text-[#8B0000] underline"
                      onClick={() => setModal({ type: 'edit', user: u })}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs font-bold text-[#8B0000] underline"
                      onClick={() => setModal({ type: 'promote', user: u })}
                    >
                      Promote
                    </button>
                    <button
                      type="button"
                      className="text-xs font-bold text-[#8B0000] underline"
                      onClick={() => setModal({ type: 'password_reset', user: u })}
                    >
                      Reset password
                    </button>
                    {u.id !== currentUserId ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-700 underline"
                        onClick={() => setModal({ type: 'delete', user: u })}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={() => refresh()} className="mt-4 text-sm font-bold text-[#8B0000] underline">
        Refresh directory
      </button>

      {modal ? (
        <ActionModal
          modal={modal}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={runAction}
        />
      ) : null}
    </section>
  );
}

/** @param {{ modal: object, busy: string, onClose: () => void, onSubmit: (p: object) => Promise<void> }} props */
function ActionModal({ modal, busy, onClose, onSubmit }) {
  const { type, user } = modal;
  const [reason, setReason] = useState('');
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [role, setRole] = useState(user.role ?? 'INTERN');
  const [confirmEmail, setConfirmEmail] = useState('');

  const titles = {
    edit: 'Edit account',
    promote: 'Change role',
    password_reset: 'Reset password',
    delete: 'Remove account',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <UserCog className="text-spike" size={20} />
          <h4 className="text-lg font-bold text-slate-900">{titles[type]}</h4>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          <strong>{user.name}</strong> · {user.email}
        </p>

        {type === 'edit' ? (
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Name" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Email" type="email" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        ) : null}

        {type === 'promote' ? (
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mb-3 w-full rounded-lg border px-3 py-2 text-sm">
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        ) : null}

        {type === 'delete' ? (
          <div className="mb-3 space-y-2">
            <p className="text-sm text-red-800">
              This permanently deletes the auth account and profile. Type the email to confirm.
            </p>
            <input
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm"
              placeholder={user.email}
            />
          </div>
        ) : null}

        {type === 'password_reset' ? (
          <p className="mb-3 text-sm text-slate-600">
            A temporary password will be generated. Share it securely; the user must change it on next sign-in.
          </p>
        ) : null}

        <label className="mt-3 block text-sm font-medium text-slate-700">
          Reason (required)
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Why is this action needed?"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="spike-btn-secondary" onClick={onClose} disabled={Boolean(busy)}>
            Cancel
          </button>
          <button
            type="button"
            className={type === 'delete' ? 'rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white' : 'spike-btn-primary'}
            disabled={Boolean(busy) || reason.trim().length < 3}
            onClick={() => {
              const base = { targetId: user.id, reason: reason.trim() };
              if (type === 'edit') {
                onSubmit({ ...base, action: 'edit', name, email, role });
              } else if (type === 'promote') {
                onSubmit({ ...base, action: 'promote', role });
              } else if (type === 'password_reset') {
                onSubmit({ ...base, action: 'password_reset' });
              } else if (type === 'delete') {
                onSubmit({ ...base, action: 'delete', confirmEmail: confirmEmail.trim() });
              }
            }}
          >
            {busy ? 'Working…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
