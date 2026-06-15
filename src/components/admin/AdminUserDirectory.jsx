import { useCallback, useEffect, useState } from 'react';
import { Loader2, Shield, Trash2, UserCog } from 'lucide-react';
import {
  ADMIN_MANAGEABLE_ROLES,
  fetchUserDirectory,
  runUserDirectoryAction,
} from '../../lib/userAdminService.js';
import { formatDbRoleLabel } from '../../lib/terminology.js';
import { RolePicker } from './RolePicker.jsx';

const SUPERUSER_ROLE_OPTIONS = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'];

/** @param {string | null | undefined} role */
function normalizePortalRole(role) {
  return String(role ?? 'INTERN').trim().toUpperCase();
}

/** @param {{ currentUserId?: string, isSuperuser?: boolean }} props */
export function AdminUserDirectory({ currentUserId = '', isSuperuser = false }) {
  const [users, setUsers] = useState([]);
  const [actorIsSuperuser, setActorIsSuperuser] = useState(isSuperuser);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [modal, setModal] = useState(null);
  const [resultMsg, setResultMsg] = useState('');

  const roleOptions = actorIsSuperuser ? SUPERUSER_ROLE_OPTIONS : ADMIN_MANAGEABLE_ROLES;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { users: rows, actorIsSuperuser: fromApi, migrationNeeded: needsMigration } =
        await fetchUserDirectory();
      setUsers(rows);
      setActorIsSuperuser(fromApi || isSuperuser);
      setMigrationNeeded(Boolean(needsMigration));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [isSuperuser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function canManageUser(user) {
    if (actorIsSuperuser) return true;
    return user.role !== 'SUPERUSER';
  }

  async function runAction(payload) {
    setBusy(payload.action);
    setError('');
    setResultMsg('');
    try {
      const target = users.find((u) => u.id === payload.targetId) ?? null;
      const res = await runUserDirectoryAction(payload, { isSuperuser: actorIsSuperuser, target });
      if (res?.temporaryPassword) {
        setResultMsg(
          `Temporary password: ${res.temporaryPassword} (share securely; user must change on sign-in)`,
        );
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

  function openModal(nextModal) {
    setError('');
    setResultMsg('');
    setModal(nextModal);
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
          <h3 className="text-lg font-bold text-gray-900">Registered users</h3>
          <p className="text-sm text-gray-600">
            {actorIsSuperuser
              ? 'View all accounts — promote roles, edit details, reset passwords, or remove users. Every action requires a reason and is logged.'
              : 'View all registered accounts and change roles for interns, coaches, mentors, and administrators. Superuser accounts are read-only.'}
          </p>
        </div>
      </div>

      {migrationNeeded ? (
        <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Some confirmed accounts may be missing from this list until Supabase migrations run.
          Run <code className="rounded bg-white px-1">20260710_admin_portal_catchup.sql</code> and{' '}
          <code className="rounded bg-white px-1">20260711_profile_backfill.sql</code> in the SQL
          Editor, then <code className="rounded bg-white px-1">NOTIFY pgrst, &apos;reload schema&apos;;</code>{' '}
          and refresh. Or set <code className="rounded bg-white px-1">SUPABASE_SERVICE_ROLE_KEY</code> on
          Cloudflare Pages so the directory can sync auth users automatically.
        </p>
      ) : null}

      {error && !modal ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {resultMsg ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{resultMsg}</p>
      ) : null}

      {users.length === 0 ? (
        <p className="text-sm text-gray-500">No registered users yet.</p>
      ) : (
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
              {users.map((u) => {
                const manageable = canManageUser(u);
                return (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="px-2 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-2 py-3 text-gray-700">{u.email}</td>
                    <td className="px-2 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-800">
                        {formatDbRoleLabel(u.role)}
                        {u.role === 'SUPERUSER' ? ' ★' : ''}
                      </span>
                      {u.has_profile === false ? (
                        <span className="ml-2 text-2xs font-medium text-amber-700">No profile yet</span>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      {manageable ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-xs font-bold text-[#8B0000] underline"
                            onClick={() => openModal({ type: 'edit', user: u })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-xs font-bold text-[#8B0000] underline"
                            onClick={() => openModal({ type: 'promote', user: u })}
                          >
                            Change role
                          </button>
                          {actorIsSuperuser ? (
                            <>
                              <button
                                type="button"
                                className="text-xs font-bold text-[#8B0000] underline"
                                onClick={() => openModal({ type: 'password_reset', user: u })}
                              >
                                Reset password
                              </button>
                              {u.id !== currentUserId ? (
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-red-700 underline"
                                  onClick={() => openModal({ type: 'delete', user: u })}
                                >
                                  <Trash2 size={12} /> Remove
                                </button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Superuser — view only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button type="button" onClick={() => refresh()} className="mt-4 text-sm font-bold text-[#8B0000] underline">
        Refresh directory
      </button>

      {modal ? (
        <ActionModal
          key={`${modal.type}-${modal.user.id}`}
          modal={modal}
          busy={busy}
          error={error}
          roleOptions={roleOptions}
          onClose={() => {
            setError('');
            setModal(null);
          }}
          onSubmit={runAction}
        />
      ) : null}
    </section>
  );
}

/** @param {{ modal: object, busy: string, error?: string, roleOptions: string[], onClose: () => void, onSubmit: (p: object) => Promise<void> }} props */
function ActionModal({ modal, busy, error = '', roleOptions, onClose, onSubmit }) {
  const { type, user } = modal;
  const [reason, setReason] = useState('');
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [role, setRole] = useState(normalizePortalRole(user.role));
  const [confirmEmail, setConfirmEmail] = useState('');
  const reasonReady = reason.trim().length >= 3;
  const currentRole = normalizePortalRole(user.role);
  const nextRole = normalizePortalRole(role);
  const roleChanged = type === 'promote' && nextRole !== currentRole;
  const confirmBlockedReason = !reasonReady
    ? 'Add a reason (at least 3 characters).'
    : type === 'promote' && !roleChanged
      ? `Current role is already ${formatDbRoleLabel(currentRole)} — pick a different role.`
      : '';

  const titles = {
    edit: 'Edit account',
    promote: 'Change role',
    password_reset: 'Reset password',
    delete: 'Remove account',
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
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
            <RolePicker value={role} onChange={setRole} allowedValues={roleOptions} name="edit-role" />
          </div>
        ) : null}

        {type === 'promote' ? (
          <div className="mb-3 space-y-2">
            <p className="text-sm text-slate-600">
              Current role: <strong>{formatDbRoleLabel(currentRole)}</strong>
            </p>
            <p className="text-sm font-medium text-slate-700">New role</p>
            <RolePicker value={nextRole} onChange={setRole} allowedValues={roleOptions} name="promote-role" />
            {roleChanged ? (
              <p className="text-xs font-medium text-emerald-800">
                Will change to {formatDbRoleLabel(nextRole)}.
              </p>
            ) : null}
          </div>
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
            autoFocus
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Why is this action needed?"
          />
        </label>
        {!reasonReady || (type === 'promote' && !roleChanged) ? (
          <p className="mt-1 text-xs text-amber-800">{confirmBlockedReason}</p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="spike-btn-secondary" onClick={onClose} disabled={Boolean(busy)}>
            Cancel
          </button>
          <button
            type="button"
            className={
              type === 'delete'
                ? 'rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50'
                : 'spike-btn-primary disabled:cursor-not-allowed disabled:opacity-50'
            }
            disabled={
              Boolean(busy)
              || !reasonReady
              || (type === 'promote' && !roleChanged)
            }
            onClick={() => {
              const base = { targetId: user.id, reason: reason.trim() };
              if (type === 'edit') {
                onSubmit({ ...base, action: 'edit', name, email, role: nextRole });
              } else if (type === 'promote') {
                onSubmit({ ...base, action: 'promote', role: nextRole });
              } else if (type === 'password_reset') {
                onSubmit({ ...base, action: 'password_reset' });
              } else if (type === 'delete') {
                onSubmit({ ...base, action: 'delete', confirmEmail: confirmEmail.trim() });
              }
            }}
          >
            {busy
              ? 'Working…'
              : type === 'promote' && roleChanged
                ? `Change to ${formatDbRoleLabel(nextRole)}`
                : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
