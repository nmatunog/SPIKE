import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import {
  ACTIVATION_TIMEZONE,
  loadStaffActivationCode,
  regenerateDailyActivationCode,
} from '../lib/activationCodeService.js';
import { isAdminLikeRole, isStaffUiRole, resolveUserRole } from '../lib/roles.js';
import { isReadOnlyViewerUser } from '../lib/readOnlyViewer.js';

/**
 * Loads today's intern activation code for staff dashboards.
 * Calls ensure_daily_activation_code (idempotent) so a code exists even if cron missed.
 */
export function useDailyActivationCode() {
  const { user, usingSupabaseAuth } = useAuth();
  const userRole = resolveUserRole(user);
  const enabled = usingSupabaseAuth && isStaffUiRole(userRole);
  const canRegenerate = isAdminLikeRole(userRole) && !isReadOnlyViewerUser(user);

  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCode(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const row = await loadStaffActivationCode();
      setCode(row);
    } catch (err) {
      setError(err.message || 'Failed to load activation code');
      setCode(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const regenerate = useCallback(async () => {
    if (!canRegenerate) return null;
    setRegenerating(true);
    setError('');
    try {
      const row = await regenerateDailyActivationCode();
      setCode(row);
      return row;
    } catch (err) {
      setError(err.message || 'Failed to regenerate activation code');
      throw err;
    } finally {
      setRegenerating(false);
    }
  }, [canRegenerate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    code,
    loading,
    error,
    refresh,
    regenerate,
    regenerating,
    enabled,
    canRegenerate,
    timezone: ACTIVATION_TIMEZONE,
  };
}
