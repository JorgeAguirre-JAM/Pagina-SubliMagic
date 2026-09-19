import { SITE_CONFIG } from './config.js';

const joinUrl = (base, path) => `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

export async function apiRequest(path, options = {}) {
  if (!SITE_CONFIG.livePublicApi) {
    const error = new Error('PUBLIC_API_DISABLED');
    error.code = 'PUBLIC_API_DISABLED';
    throw error;
  }

  const { authToken = '', ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Accept', 'application/json');

  if (!(fetchOptions.body instanceof FormData) && fetchOptions.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const response = await fetch(joinUrl(SITE_CONFIG.apiBaseUrl, path), {
    ...fetchOptions,
    headers,
    credentials: 'omit',
    cache: fetchOptions.cache || (fetchOptions.method && fetchOptions.method !== 'GET' ? 'no-store' : 'default')
  });

  let payload = null;
  try { payload = await response.json(); } catch (_) { payload = null; }

  if (!response.ok) {
    const error = new Error(payload?.message || `Error HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function createIdempotencyKey() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
