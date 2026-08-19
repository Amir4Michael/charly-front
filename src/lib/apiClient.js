/**
 * عميل API موحّد للتواصل مع الـBackend الحقيقي (Node/Express/MongoDB).
 * - يحمل الـAccess Token في الذاكرة فقط (وليس localStorage) لتقليل مخاطر XSS.
 * - الـRefresh Token في httpOnly Cookie يديره المتصفح تلقائيًا عبر credentials:'include'.
 * - عند 401 يحاول تجديد الجلسة تلقائيًا مرة واحدة قبل الفشل النهائي.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken = null;
let onUnauthorized = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/** يُستدعى من useAuth ليعرف متى تنتهي الجلسة نهائيًا (فشل تجديد التوكن) */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiClientError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function rawRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // بعض الاستجابات (مثل 204) بلا Body
  }
  return { res, body };
}

const NO_RETRY_PATHS = ['/auth/login', '/auth/refresh', '/auth/login-users', '/auth/logout'];

let refreshPromise = null;
async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', { method: 'POST' })
      .then(({ res, body }) => {
        refreshPromise = null;
        if (res.ok && body?.data?.accessToken) {
          accessToken = body.data.accessToken;
          return body.data;
        }
        accessToken = null;
        throw new Error('REFRESH_FAILED');
      })
      .catch((err) => {
        refreshPromise = null;
        accessToken = null;
        throw err;
      });
  }
  return refreshPromise;
}

export async function apiRequest(path, options = {}) {
  let { res, body } = await rawRequest(path, options);

  const canRetry = res.status === 401 && !options._retried && !NO_RETRY_PATHS.some((p) => path.startsWith(p));

  if (canRetry) {
    try {
      await tryRefresh();
      ({ res, body } = await rawRequest(path, { ...options, _retried: true }));
    } catch {
      if (onUnauthorized) onUnauthorized();
      throw new ApiClientError('انتهت جلسة الدخول، يرجى تسجيل الدخول مرة أخرى', 401);
    }
  }

  if (!res.ok) {
    throw new ApiClientError(body?.message || 'حدث خطأ غير متوقع', res.status, body?.errors);
  }

  return body?.data !== undefined ? body.data : body;
}

export const apiGet = (path) => apiRequest(path, { method: 'GET' });
export const apiPost = (path, data) => apiRequest(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined });
export const apiPut = (path, data) => apiRequest(path, { method: 'PUT', body: JSON.stringify(data) });
export const apiPatch = (path, data) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDelete = (path) => apiRequest(path, { method: 'DELETE' });
