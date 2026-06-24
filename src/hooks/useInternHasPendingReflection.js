import { useMemo } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { useCohortProgramDay } from './useCohortProgramDay.js';
import { listPendingPlaybookReflections } from '../lib/pendingPlaybookReflectionService.js';

/** True when the signed-in intern has at least one pending Playbook day reflection. */
export function useInternHasPendingReflection() {
  const { user } = useAuth();
  const { programDay, ready } = useCohortProgramDay();
  const participantId = user?.role === 'INTERN' ? user.id : '';

  return useMemo(() => {
    if (!participantId || !ready) return false;
    return listPendingPlaybookReflections(participantId, programDay).length > 0;
  }, [participantId, ready, programDay]);
}
