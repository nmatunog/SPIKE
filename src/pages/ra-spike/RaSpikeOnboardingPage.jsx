import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { useAuth } from '../../AuthContext.jsx';
import { ensureRaSpikeOnboardingComplete } from '../../lib/raSpikeOnboardingService.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * Legacy route — profile photo is optional on Profile; never blocks navigation.
 * @param {{ user?: { id: string, internProgress?: object | null } }} props
 */
export function RaSpikeOnboardingPage({ user }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await ensureRaSpikeOnboardingComplete(user?.id, user?.internProgress);
      await refreshUser?.();
      if (!cancelled) {
        navigate(ROUTES.raSpikeHome, { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser, user?.id, user?.internProgress]);

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <p className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="animate-spin text-spike" size={20} aria-hidden />
        Opening RA-SPIKE…
      </p>
    </RaSpikeShell>
  );
}
