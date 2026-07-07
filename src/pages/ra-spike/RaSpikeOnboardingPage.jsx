import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { ROUTES } from '../../routes/paths.js';

/**
 * Legacy route — profile photo is optional on Profile; never blocks navigation.
 * @param {{ user?: { id: string, internProgress?: object | null } }} props
 */
export function RaSpikeOnboardingPage({ user }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(ROUTES.raSpikeHome, { replace: true });
  }, [navigate]);

  return (
    <RaSpikeShell user={user} showContextBar={false}>
      <p className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="animate-spin text-spike" size={20} aria-hidden />
        Opening RA-SPIKE…
      </p>
    </RaSpikeShell>
  );
}
