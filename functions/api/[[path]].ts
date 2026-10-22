/**
 * Cloudflare Pages Function — the Express API from `server.ts` ported to the
 * Workers runtime, so the dashboard works on Cloudflare Pages with no Node host.
 *
 * No login screen and no password: every route is public by design.
 * Deploy behind Cloudflare Access if the data is sensitive.
 *
 * Env vars (Pages → Settings → Environment variables):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   APIFY_TOKEN, OPENROUTER_API_KEY, OPENROUTER_MODELS (optional), APIFY_MAX_COST_USD (optional)
 */

type Env = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  APIFY_TOKEN?: string;
  APIFY_MAX_COST_USD?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODELS?: string;
};

import { runTick } from '../../worker/pipeline';
import { resolveModels } from '../../worker/llm';

type Ctx = { request: Request; env: Env };

const ACTIONS = new Set(['find_problems', 'build_solution', 'find_leads', 'discover_leads', 'write_message', 'write_followup']);

const corsHeaders = (): Record<string, string> => ({
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type,authorization',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,OPTIONS',
  'access-control-max-age': '86400',
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...corsHeaders() },
  });

const fail = (message: string, status = 500) => json({ error: message }, status);

/** Minimal Supabase REST client (service role key never leaves the server). */
function supabase(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    throw Object.assign(new Error('Supabase غير مضبوط (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'), { status: 503 });
  const base = env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1';
  return async (path: string, init: RequestInit = {}): Promise<any> => {
    const res = await fetch(`${base}/${path}`, {
      ...init,
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'content-type': 'application/json',
        prefer: 'return=representation',
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }
    if (!res.ok) throw Object.assign(new Error(body?.message || `Supabase ${res.status}`), { status: 502 });
    return body;
  };
}

const first = (rows: any) => (Array.isArray(rows) ? rows[0] : rows);

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });

  const path = new URL(request.url).pathname.replace(/^\/api/, '') || '/';
  const method = request.method;
  const readBody = async (): Promise<any> => {
    try {
      return await request.json();
    } catch {
      return {};
    }
  };

  try {
    if (path === '/health' && method === 'GET') {
      let models: string[] = [];
      try {
        models = await resolveModels(env as any);
      } catch {}
      return json({
        ok: true,
        supabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
        apify: !!env.APIFY_TOKEN,
        openrouter: !!env.OPENROUTER_API_KEY,
        models,
        auth: false,
        runtime: 'cloudflare-workers',
      });
    }

    if (path === '/data' && method === 'GET') {
      const q = (table: string, limit: number, order = 'created_at') =>
        supabase(env)(`${table}?select=*&order=${order}.desc&limit=${limit}`);
      const [problems, solutions, leads, messages, jobs, settings] = await Promise.all([
        q('problems', 500),
        q('solutions', 500),
        q('leads', 500),
        q('messages', 800),
        q('jobs', 150),
        supabase(env)('settings?select=*'),
      ]);
      return json({
        problems,
        solutions,
        leads,
        messages,
        jobs,
        settings,
        serverTime: new Date().toISOString(),
      });
    }

    if (path === '/actions' && method === 'POST') {
      const { action, params = {} } = await readBody();
      if (!ACTIONS.has(action)) return fail('action غير معروف', 400);
      const row = first(
        await supabase(env)('jobs', {
          method: 'POST',
          body: JSON.stringify({ action, params, status: 'running' }),
        }),
      );
      return json({ job_id: row?.id });
    }

    // Advance running jobs now (the cron trigger also does this every minute).
    if (path === '/tick' && method === 'POST') return json(await runTick(env as any));

    const jobCancel = path.match(/^\/jobs\/([^/]+)\/cancel$/);
    if (jobCancel && method === 'POST') {
      const row = first(
        await supabase(env)(`jobs?id=eq.${encodeURIComponent(decodeURIComponent(jobCancel[1]))}&status=eq.running`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'failed', error: 'أُلغيت يدوياً', finished_at: new Date().toISOString(), locked_until: null }),
        }),
      );
      return row ? json(row) : fail('المهمة غير موجودة أو انتهت', 404);
    }

    const msg = path.match(/^\/messages\/([^/]+)(\/mark-sent)?$/);
    if (msg) {
      const id = encodeURIComponent(decodeURIComponent(msg[1]));
      const sub = msg[2];

      if (!sub && method === 'PATCH') {
        const raw = await readBody();
        const patch: Record<string, unknown> = {};
        for (const key of ['message', 'subject', 'status', 'replied']) if (key in raw) patch[key] = raw[key];
        if ('status' in patch && !['pending_approval', 'approved', 'rejected'].includes(String(patch.status)))
          return fail('status غير مسموح', 400);
        if (patch.replied === true) patch.replied_at = new Date().toISOString();
        if (!Object.keys(patch).length) return fail('لا يوجد ما يُحدَّث', 400);
        const row = first(await supabase(env)(`messages?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) }));
        return row ? json(row) : fail('الرسالة غير موجودة', 404);
      }

      if (sub === '/mark-sent' && method === 'POST') {
        const row = first(
          await supabase(env)(`messages?id=eq.${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() }),
          }),
        );
        if (!row) return fail('الرسالة غير موجودة', 404);
        if (row.lead_id)
          await supabase(env)(`leads?id=eq.${encodeURIComponent(row.lead_id)}&status=eq.new`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'contacted' }),
          });
        return json({ id: row.id, lead_id: row.lead_id });
      }
    }

    const lead = path.match(/^\/leads\/([^/]+)$/);
    if (lead && method === 'PATCH') {
      const { status } = await readBody();
      if (!['new', 'contacted', 'replied', 'won', 'lost'].includes(String(status))) return fail('status غير مسموح', 400);
      const row = first(
        await supabase(env)(`leads?id=eq.${encodeURIComponent(decodeURIComponent(lead[1]))}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      );
      return row ? json(row) : fail('العميل غير موجود', 404);
    }

    const problem = path.match(/^\/problems\/([^/]+)$/);
    if (problem && method === 'PATCH') {
      const { status } = await readBody();
      if (!['new', 'solution_ready', 'leads_found', 'archived'].includes(String(status)))
        return fail('status غير مسموح', 400);
      const row = first(
        await supabase(env)(`problems?id=eq.${encodeURIComponent(decodeURIComponent(problem[1]))}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      );
      return row ? json(row) : fail('المشكلة غير موجودة', 404);
    }

    const setting = path.match(/^\/settings\/([^/]+)$/);
    if (setting && method === 'PUT') {
      const key = decodeURIComponent(setting[1]);
      if (!/^[a-z0-9_]{1,64}$/.test(key)) return fail('مفتاح غير صالح', 400);
      const raw = await readBody();
      if (!('value' in raw)) return fail('value مطلوب', 400);
      const row = first(
        await supabase(env)('settings?on_conflict=key', {
          method: 'POST',
          headers: { prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({ key, value: raw.value }),
        }),
      );
      return json(row ?? { key, value: raw.value });
    }

    return fail(`مسار غير معروف: ${method} ${path}`, 404);
  } catch (e: any) {
    const status = e?.status || 500;
    if (status >= 500) console.error('[api]', e?.message || e);
    return fail(e?.message || 'server error', status);
  }
};
