import { onStaffPortalHandoffRequest } from '../../_shared/staffPortalHandoff.js';

/** SPIKE Internship — create/consume staff cross-portal auth handoff tokens. */
export async function onRequest(ctx) {
  return onStaffPortalHandoffRequest({ ...ctx, sourcePortal: 'internship' });
}
