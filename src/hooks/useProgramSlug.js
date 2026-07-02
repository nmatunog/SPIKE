import { useMemo } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { resolveProgramSlug } from '../lib/programs/index.js';

/** Active program slug for the signed-in intern (defaults to SPIKE Internship). */
export function useProgramSlug() {
  const { user } = useAuth();
  return useMemo(
    () => resolveProgramSlug(user?.internProgress),
    [user?.internProgress],
  );
}
