import type { DashboardData, JobAction } from '../types/db';

const KEY = 'p2c_token';
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
  const res = await fetch(path, {
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
  if (!res.ok) throw new ApiError(body?.error || `HTTP ${res.status}`, res.status);
  return body as T;
}

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const api = {
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
