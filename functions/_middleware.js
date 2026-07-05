import {
  isProtectedCoachDeckStoragePath,
  isPublicCoachDeckPath,
} from './_shared/facultyDeckPaths.js';

/** @param {import('@cloudflare/workers-types').EventContext<Record<string, unknown>, string, unknown>} context */
export async function onRequest(context) {
  const { request, next } = context;
  const pathname = new URL(request.url).pathname;

  if (isPublicCoachDeckPath(pathname) || isProtectedCoachDeckStoragePath(pathname)) {
    return new Response('Not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  return next();
}
