import { apiFetch } from '../apiClient.js';

/** @returns {Promise<{ configured: boolean, needsBootstrap: boolean | null, secretRequired: boolean }>} */
export async function fetchBootstrapSuperuserStatus() {
  try {
    const data = await apiFetch('/api/auth/bootstrap-superuser');
    return {
      configured: data?.configured !== false,
      needsBootstrap: data?.needsBootstrap ?? null,
      secretRequired: Boolean(data?.secretRequired),
    };
  } catch (err) {
    if (err?.status === 503 && err?.data?.code === 'MISSING_SERVICE_KEY') {
      return {
        configured: false,
        needsBootstrap: null,
        secretRequired: false,
        message: err.message,
      };
    }
    throw err;
  }
}

/** @param {{ name: string, email: string, password: string, setupSecret?: string }} payload */
export async function bootstrapSuperuserAccount(payload) {
  return apiFetch('/api/auth/bootstrap-superuser', {
    method: 'POST',
    body: payload,
  });
}
