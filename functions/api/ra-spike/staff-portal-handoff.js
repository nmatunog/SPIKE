import { onStaffPortalHandoffRequest } from '../../_shared/staffPortalHandoff.js';

/** RA-SPIKE — create/consume staff cross-portal auth handoff tokens. */
export async function onRequest(ctx) {
  return onStaffPortalHandoffRequest({ ...ctx, sourcePortal: 'ra-spike' });
}
