/**
 * Proxy portal.1cma.online/ra-spike* (and RA-SPIKE content assets) to the
 * dedicated RA-SPIKE Cloudflare Pages project, keeping SPIKE Internship on /.
 */
const RA_SPIKE_ORIGIN = 'https://ra-spike.pages.dev';

/**
 * @param {string} pathname
 * @returns {string}
 */
function mapToUpstreamPath(pathname) {
  if (pathname === '/ra-spike' || pathname === '/ra-spike/') {
    return '/';
  }

  if (pathname.startsWith('/ra-spike/assets/')) {
    return pathname.slice('/ra-spike'.length);
  }

  if (pathname.startsWith('/ra-spike/api/')) {
    return pathname.slice('/ra-spike'.length);
  }

  if (pathname.startsWith('/ra-spike/content/')) {
    return pathname.slice('/ra-spike'.length);
  }

  // Coach deck + other public content for RA-SPIKE (no /ra-spike prefix in URLs).
  if (pathname.startsWith('/content/ra-spike/')) {
    return pathname;
  }

  // SPA client routes: /ra-spike/home, /ra-spike/playbook, …
  if (pathname.startsWith('/ra-spike/')) {
    return '/';
  }

  return pathname;
}

/**
 * @param {string} html
 * @returns {string}
 */
function rewriteHtml(html) {
  return html
    .replaceAll('src="/assets/', 'src="/ra-spike/assets/')
    .replaceAll('href="/assets/', 'href="/ra-spike/assets/')
    .replaceAll('href="/content/', 'href="/ra-spike/content/')
    .replaceAll('src="/content/', 'src="/ra-spike/content/')
    .replaceAll('content="/assets/', 'content="/ra-spike/assets/');
}

/**
 * Legacy internship-app URLs that must hard-redirect into the RA-SPIKE proxy.
 * @param {string} pathname
 * @param {URL} requestUrl
 * @returns {Response | null}
 */
function legacyRaSpikeRedirect(pathname, requestUrl) {
  if (pathname === '/program-coach/ra-spike' || pathname.startsWith('/program-coach/ra-spike/')) {
    return Response.redirect(new URL('/ra-spike/coach', requestUrl.origin), 302);
  }
  if (pathname === '/mentor/ra-spike' || pathname.startsWith('/mentor/ra-spike/')) {
    return Response.redirect(new URL('/ra-spike/mentor-coach', requestUrl.origin), 302);
  }
  return null;
}

export default {
  /**
   * @param {Request} request
   */
  async fetch(request) {
    const url = new URL(request.url);

    const legacy = legacyRaSpikeRedirect(url.pathname, url);
    if (legacy) return legacy;

    const upstreamPath = mapToUpstreamPath(url.pathname);
    const upstreamUrl = new URL(upstreamPath + url.search, RA_SPIKE_ORIGIN);

    const init = {
      method: request.method,
      headers: request.headers,
      redirect: 'manual',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      // @ts-expect-error duplex is required for streaming bodies in Workers
      init.duplex = 'half';
    }

    const upstream = await fetch(upstreamUrl, init);
    const contentType = upstream.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const html = rewriteHtml(await upstream.text());
      const headers = new Headers(upstream.headers);
      headers.delete('content-length');
      headers.set('cache-control', 'no-cache, must-revalidate');
      return new Response(html, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });
    }

    return new Response(upstream.body, upstream);
  },
};
