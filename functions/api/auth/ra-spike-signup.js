import { onRaSpikeApiMoved } from '../../_shared/raSpikeApiMoved.js';

/** @param {{ request: Request }} ctx */
export async function onRequest(ctx) {
  return onRaSpikeApiMoved(ctx, '/signup');
}
