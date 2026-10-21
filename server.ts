import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  N8N_WEBHOOK_URL,
  N8N_WEBHOOK_SECRET,
} = process.env;
const N8N_HEADER = process.env.N8N_WEBHOOK_HEADER || 'x-api-key';

const db =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

const ACTIONS = new Set([
  'find_problems',
  'build_solution',
  'find_leads',
  'write_message',
  'send_message',
  'write_followup',
]);

/*
 * The dashboard opens directly: there is no login screen and no password.
 * Every /api route below is public by design, so make sure the deployment URL
 * is not public (Cloudflare Access / basic auth / private network) if it holds
 * real customer data.
 */
const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, supabase: !!db, n8n: !!N8N_WEBHOOK_URL, auth: false }),
);

const needDb = () => {
  if (!db) throw Object.assign(new Error('Supabase غير مضبوط (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'), { status: 503 });
  return db;
};
const wrap =
  (fn: (req: express.Request, res: express.Response) => Promise<unknown>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    fn(req, res).catch(next);
const pick = (obj: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

/* ---------- read everything the UI needs in one call ---------- */
app.get(
  '/api/data',
  wrap(async (_req, res) => {
    const c = needDb();
    const q = (t: string, n: number, order = 'created_at') =>
      c.from(t).select('*').order(order, { ascending: false }).limit(n);
    const [problems, solutions, leads, messages, jobs, settings] = await Promise.all([
      q('problems', 500),
      q('solutions', 500),
      q('leads', 500),
      q('messages', 800),
      q('jobs', 150),
      c.from('settings').select('*'),
    ]);
    for (const r of [problems, solutions, leads, messages, jobs, settings]) if (r.error) throw r.error;
    res.json({
      problems: problems.data,
      solutions: solutions.data,
      leads: leads.data,
      messages: messages.data,
      jobs: jobs.data,
      settings: settings.data,
      serverTime: new Date().toISOString(),
    });
  }),
);

/* ---------- trigger n8n Main Flow (secret stays on the server) ---------- */
const callN8n = async (action: string, params: Record<string, unknown>) => {
  if (!N8N_WEBHOOK_URL) throw Object.assign(new Error('N8N_WEBHOOK_URL غير مضبوط'), { status: 503 });
  const r = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', [N8N_HEADER]: N8N_WEBHOOK_SECRET || '' },
    body: JSON.stringify({ action, params }),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await r.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!r.ok) throw Object.assign(new Error(`n8n رد بـ ${r.status}: ${text.slice(0, 200)}`), { status: 502 });
  return body;
};

app.post(
  '/api/actions',
  wrap(async (req, res) => {
    const { action, params = {} } = req.body ?? {};
    if (!ACTIONS.has(action)) return res.status(400).json({ error: 'action غير معروف' });
    res.json(await callN8n(action, params));
  }),
);

/* ---------- messages ---------- */
app.patch(
  '/api/messages/:id',
  wrap(async (req, res) => {
    const patch: Record<string, unknown> = pick(req.body ?? {}, ['message', 'subject', 'status', 'replied']);
    if ('status' in patch && !['pending_approval', 'approved', 'rejected'].includes(String(patch.status)))
      return res.status(400).json({ error: 'status غير مسموح' });
    if (patch.replied === true) patch.replied_at = new Date().toISOString();
    if (!Object.keys(patch).length) return res.status(400).json({ error: 'لا يوجد ما يُحدَّث' });
    const { data, error } = await needDb().from('messages').update(patch).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  }),
);

app.post(
  '/api/messages/:id/send',
  wrap(async (req, res) => {
    const c = needDb();
    const { data: m, error } = await c.from('messages').select('id,status,channel').eq('id', req.params.id).single();
    if (error) throw error;
    if (m.status === 'sent') return res.status(409).json({ error: 'الرسالة أُرسلت مسبقاً' });
    if (m.channel === 'instagram' || m.channel === 'other')
      return res.status(400).json({ error: 'هذه القناة يدوية: انسخ الرسالة وأرسلها بنفسك ثم علّمها كمُرسلة' });
    await c.from('messages').update({ status: 'approved' }).eq('id', m.id);
    res.json(await callN8n('send_message', { message_id: m.id }));
  }),
);

app.post(
  '/api/messages/:id/mark-sent',
  wrap(async (req, res) => {
    const c = needDb();
    const { data, error } = await c
      .from('messages')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id,lead_id')
      .single();
    if (error) throw error;
    await c.from('leads').update({ status: 'contacted' }).eq('id', data.lead_id).eq('status', 'new');
    res.json(data);
  }),
);

/* ---------- leads / problems / settings ---------- */
app.patch(
  '/api/leads/:id',
  wrap(async (req, res) => {
    const patch = pick(req.body ?? {}, ['status']);
    if (!['new', 'contacted', 'replied', 'won', 'lost'].includes(String(patch.status)))
      return res.status(400).json({ error: 'status غير مسموح' });
    const { data, error } = await needDb().from('leads').update(patch).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  }),
);

app.patch(
  '/api/problems/:id',
  wrap(async (req, res) => {
    const patch = pick(req.body ?? {}, ['status']);
    if (!['new', 'solution_ready', 'leads_found', 'archived'].includes(String(patch.status)))
      return res.status(400).json({ error: 'status غير مسموح' });
    const { data, error } = await needDb().from('problems').update(patch).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  }),
);

app.put(
  '/api/settings/:key',
  wrap(async (req, res) => {
    if (!/^[a-z0-9_]{1,64}$/.test(req.params.key)) return res.status(400).json({ error: 'مفتاح غير صالح' });
    if (!req.body || !('value' in req.body)) return res.status(400).json({ error: 'value مطلوب' });
    const { data, error } = await needDb()
      .from('settings')
      .upsert({ key: req.params.key, value: req.body.value }, { onConflict: 'key' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  }),
);

app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err?.status || 500;
  if (status >= 500) console.error('[api]', err?.message || err);
  res.status(status).json({ error: err?.message || 'server error' });
});

/* ---------- frontend ---------- */
if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  const dist = path.resolve(process.cwd(), 'dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`P2C dashboard on :${PORT} (${isProd ? 'prod' : 'dev'}) supabase=${!!db} n8n=${!!N8N_WEBHOOK_URL}`);
});
