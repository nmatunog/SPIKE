import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { AdminUserDirectory } from '../../components/admin/AdminUserDirectory.jsx';
import { SuperuserAddCoachPanel } from '../../components/admin/SuperuserAddCoachPanel.jsx';
import { ROUTES } from '../../routes/paths.js';

/**
 * RA-SPIKE account management — stays inside /ra-spike for superusers.
 * @param {{
 *   user?: { id?: string, role?: string | null },
 *   readOnlyViewer?: boolean,
 *   onChanged?: () => void | Promise<void>,
 *   showToast?: (msg: string, type?: string) => void,
 * }} props
 */
export function RaSpikeAdminPage({
  user,
  readOnlyViewer = false,
  onChanged,
  showToast,
}) {
  const isSuperuser = user?.role === 'SUPERUSER';

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3">
          <Link
            to={ROUTES.programCoachRaSpike}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-spike"
          >
            <ArrowLeft size={16} aria-hidden />
            Coach hub
          </Link>
          <div>
            <p className="text-sm font-medium text-slate-500">RA-SPIKE</p>
            <h1 className="text-2xl font-bold text-slate-900">Account management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create coaches, change roles, reset passwords, and remove duplicate signups.
            </p>
          </div>
        </header>

        {!readOnlyViewer && isSuperuser ? (
          <SuperuserAddCoachPanel
            onCreated={async () => {
              showToast?.('Program coach account created.', 'success');
              await onChanged?.();
            }}
          />
        ) : null}

        <AdminUserDirectory
          currentUserId={user?.id ?? ''}
          isSuperuser={isSuperuser}
          readOnlyViewer={readOnlyViewer}
        />
      </div>
    </PageContainer>
  );
}
