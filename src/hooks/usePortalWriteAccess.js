import { useAuth } from '../AuthContext.jsx';
import { isReadOnlyViewerUser } from '../lib/readOnlyViewer.js';

/** @returns {{ canWrite: boolean, readOnlyViewer: boolean }} */
export function usePortalWriteAccess() {
  const { user } = useAuth();
  const readOnlyViewer = isReadOnlyViewerUser(user);
  return { canWrite: !readOnlyViewer, readOnlyViewer };
}
