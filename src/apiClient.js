const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, data) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function apiFetch(path, { token, headers = {}, ...rest } = {}) {
  const url = apiUrl(path);
  const mergedHeaders = { ...headers };
  if (token) mergedHeaders.Authorization = `Bearer ${token}`;
  if (
    rest.body !== undefined &&
    !(rest.body instanceof FormData) &&
    !mergedHeaders['Content-Type']
  ) {
    mergedHeaders['Content-Type'] = 'application/json';
  }
  const body =
    rest.body !== undefined &&
    !(rest.body instanceof FormData) &&
    typeof rest.body === 'object'
      ? JSON.stringify(rest.body)
      : rest.body;

  const res = await fetch(url, { ...rest, headers: mergedHeaders, body });
  const text = await res.text();
  const looksLikeHtml = /^\s*<(!DOCTYPE|html)/i.test(text);
  if (looksLikeHtml) {
    throw new ApiError(
      502,
      'Received a web page instead of the API (often a missing/misconfigured VITE_API_URL, or the API is not running). Set VITE_API_URL to your API origin in your hosting environment, then rebuild/redeploy.',
      null,
    );
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    const msg =
      typeof data?.message === 'string'
        ? data.message
        : Array.isArray(data?.message)
          ? data.message.join(', ')
          : typeof data?.message === 'object'
            ? JSON.stringify(data.message)
            : text || res.statusText;
    throw new ApiError(res.status, msg, data);
  }
  return data;
}
