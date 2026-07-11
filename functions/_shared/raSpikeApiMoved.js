import { corsPreflight, json } from './verifySuperuser.js';

/** RA-SPIKE APIs on the SPIKE Internship Pages project are disabled — use /ra-spike/api on the RA-SPIKE origin. */
const MOVED_MESSAGE =
  'RA-SPIKE uses a separate database from SPIKE Internship. Sign up and sign in at portal.1cma.online/ra-spike.';

/** @param {string} apiPath e.g. /signup */
export function raSpikeApiMovedResponse(apiPath) {
  const normalized = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  return json(
    {
      message: MOVED_MESSAGE,
      code: 'RA_SPIKE_API_MOVED',
      use: `/ra-spike/api/ra-spike${normalized}`,
    },
    410,
  );
}

/** @param {{ request: Request }} ctx */
export function onRaSpikeApiMoved(ctx, apiPath) {
  if (ctx.request.method === 'OPTIONS') return corsPreflight();
  return raSpikeApiMovedResponse(apiPath);
}
