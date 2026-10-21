import type { DashboardData, JobAction } from '../types/db';

/** Optional API origin when the frontend is hosted apart from the API. */
const ENV = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;
const BASE = (ENV.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });

  // A static host (Cloudflare Pages, GitHub Pages…) answers unknown paths with
  // index.html and status 200. Never treat HTML as a valid API response — that
  // silently produced empty data and a blank screen.
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new ApiError('لم يتم العثور على سيرفر الـ API على هذا العنوان (الصفحة مستضافة كملفات ثابتة فقط)', res.status);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((body as any)?.error || `HTTP ${res.status}`, res.status);
  return body as T;
}

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const api = {
  health: () => req<{ ok: boolean; supabase: boolean; n8n: boolean; auth: boolean }>('/api/health'),
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
