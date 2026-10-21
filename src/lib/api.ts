import type { DashboardData, JobAction } from '../types/db';

const KEY = 'p2c_token';
/** Optional API origin when the frontend is hosted separately from server.ts. */
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t: string) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/api/login') {
    clearToken();
    window.dispatchEvent(new Event('p2c-unauth'));
  }
  if (!res.ok) {
    // 404/405 usually means the page is served by a static host and the Express
    // API isn't running behind it — surface that instead of a bare "HTTP 405".
    const noApi =
      (res.status === 404 || res.status === 405) && !res.headers.get('content-type')?.includes('application/json');
    throw new ApiError(
      noApi
        ? 'سيرفر الـ API غير متاح على هذا العنوان (شغّل npm run dev أو npm start بدل استضافة ثابتة)'
        : body?.error || `HTTP ${res.status}`,
      res.status,
    );
  }
  return body as T;
}

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const api = {
  health: () => req<{ ok: boolean; supabase: boolean; n8n: boolean; auth: boolean }>('/api/health'),
  login: (password: string) => req<{ token: string }>('/api/login', json('POST', { password })),
  data: () => req<DashboardData>('/api/data'),
  runAction: (action: JobAction, params: Record<string, unknown> = {}) =>
    req<{ job_id?: string; [k: string]: any }>('/api/actions', json('POST', { action, params })),
  patchMessage: (id: string, patch: Record<string, unknown>) => req(`/api/messages/${id}`, json('PATCH', patch)),
  sendMessage: (id: string) => req(`/api/messages/${id}/send`, { method: 'POST' }),
  markSent: (id: string) => req(`/api/messages/${id}/mark-sent`, { method: 'POST' }),
  patchLead: (id: string, status: string) => req(`/api/leads/${id}`, json('PATCH', { status })),
  patchProblem: (id: string, status: string) => req(`/api/problems/${id}`, json('PATCH', { status })),
  saveSetting: (key: string, value: unknown) => req(`/api/settings/${key}`, json('PUT', { value })),
};
