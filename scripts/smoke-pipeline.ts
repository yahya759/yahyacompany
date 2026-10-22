/**
 * Offline smoke test for worker/pipeline.ts with in-memory fakes of Supabase REST, Apify and OpenRouter.
 * Run: npx tsx scripts/smoke-pipeline.ts
 */
import { runTick } from '../worker/pipeline';

type Row = Record<string, any>;
const T: Record<string, Row[]> = { jobs: [], problems: [], solutions: [], leads: [], messages: [], settings: [] };
let seq = 0;
const uid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;

const val = (v: string) => (v === 'null' ? null : v);
function match(row: Row, key: string, expr: string): boolean {
  if (key === 'or') {
    const inner = expr.slice(1, -1);
    return inner.split(/,(?=[a-z_]+\.)/).some((part) => {
      const [k, op, ...rest] = part.split('.');
      return match(row, k, `${op}.${rest.join('.')}`);
    });
  }
  const [op, ...rest] = expr.split('.');
  const arg = rest.join('.');
  const v = row[key];
  if (op === 'eq') return String(v) === arg;
  if (op === 'neq') return String(v) !== arg;
  if (op === 'is') return arg === 'null' ? v == null : v != null;
  if (op === 'not') return arg === 'is.null' ? v != null : true;
  if (op === 'lt') return v != null && String(v) < arg;
  if (op === 'in') return arg.slice(1, -1).split(',').includes(String(v));
  return true;
}
function filterRows(table: string, qs: URLSearchParams) {
  let rows = T[table];
  for (const [k, v] of qs) if (!['select', 'order', 'limit', 'on_conflict'].includes(k)) rows = rows.filter((r) => match(r, k, v));
  const ord = qs.get('order');
  if (ord) {
    const [f, d] = ord.split('.');
    rows = [...rows].sort((a, b) => (String(a[f]) < String(b[f]) ? -1 : 1) * (d === 'desc' ? -1 : 1));
  }
  const lim = Number(qs.get('limit'));
  return lim ? rows.slice(0, lim) : rows;
}
const dupe = (table: string, r: Row) =>
  (table === 'problems' && r.source_url && T.problems.some((x) => x.source_url === r.source_url)) ||
  (table === 'leads' && T.leads.some((x) => (r.place_id && x.place_id === r.place_id) || x.name.toLowerCase() === r.name.toLowerCase()));

// Apify fake: first status poll = RUNNING, then SUCCEEDED
const runs = new Map<string, { actor: string; polls: number }>();
let tick429 = true;
let llmCalls: string[] = [];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = init.method || 'GET';
  const body = init.body ? JSON.parse(init.body) : undefined;

  if (url.host === 'supabase.test') {
    const table = url.pathname.split('/').pop()!;
    if (method === 'GET') return json(filterRows(table, url.searchParams));
    if (method === 'POST') {
      const rows = (Array.isArray(body) ? body : [body]).map((r: Row) => ({ id: uid(), created_at: new Date().toISOString(), status: table === 'messages' ? 'pending_approval' : table === 'jobs' ? 'running' : 'new', ...r }));
      if (rows.some((r: Row) => dupe(table, r))) return json({ code: '23505', message: 'duplicate key' }, 409);
      T[table].push(...rows);
      return json(rows, 201);
    }
    if (method === 'PATCH') {
      const rows = filterRows(table, url.searchParams);
      rows.forEach((r) => Object.assign(r, body));
      return json(rows);
    }
  }

  if (url.host === 'api.apify.com') {
    if (method === 'POST') {
      const actor = url.pathname.split('/acts/')[1].split('/runs')[0];
      const id = `run${runs.size + 1}`;
      runs.set(id, { actor, polls: 0 });
      return json({ data: { id, defaultDatasetId: `ds_${id}` } }, 201);
    }
    if (url.pathname.includes('/actor-runs/')) {
      const r = runs.get(url.pathname.split('/').pop()!)!;
      r.polls++;
      return json({ data: { status: r.polls < 2 ? 'RUNNING' : 'SUCCEEDED' } });
    }
    if (url.pathname.includes('/datasets/')) {
      const actor = runs.get(url.pathname.split('/datasets/ds_')[1].split('/')[0])!.actor;
      if (actor.includes('reddit'))
        return json([
          { title: 'Customers keep canceling orders', body: 'We confirm orders by phone and half of them cancel, wasting our delivery drivers every single day.', url: 'https://reddit.com/r/a/1' },
          { title: 'Short', body: 'x', url: 'https://reddit.com/r/a/2' },
        ]);
      if (actor.includes('google-search'))
        return json([{ organicResults: [{ title: 'مطاعم تعاني من إلغاء الطلبات', description: 'صاحب مطعم يشتكي من كثرة إلغاء الطلبات بعد التحضير ولا يوجد نظام تأكيد', url: 'https://example.com/a' }] }]);
      if (actor.includes('crawler-google-places')) {
        const wantReviews = [...runs.entries()].find(([, v]) => v === runs.get(url.pathname.split('/datasets/ds_')[1].split('/')[0]));
        void wantReviews;
        return json([
          { title: 'Cafe Noor', url: 'https://maps/noor', phoneUnformatted: '+966500000001', placeId: 'p1', categoryName: 'مقهى', totalScore: 3.9, reviewsCount: 120, address: 'Riyadh',
            reviews: [{ text: 'الطلب تأخر ساعة ولم يتصل بنا أحد للتأكيد', stars: 1 }, { text: 'ممتاز جداً', stars: 5 }] },
          { title: 'Clinic Salam', website: 'https://salam.test', placeId: 'p2', categoryName: 'عيادة', totalScore: 4.5, reviewsCount: 30, address: 'Riyadh' },
          { title: 'Low Cafe', phoneUnformatted: '+966500000009', placeId: 'p9', website: 'https://low.test', categoryName: 'مقهى', totalScore: 3.2, reviewsCount: 80, address: 'Riyadh',
            reviews: [{ text: 'الخدمة بطيئة جداً ولا أحد يرد على الهاتف أبداً', stars: 1 }] },
          { title: 'Closed Place', permanentlyClosed: true, phone: '+966500000003', placeId: 'p3' },
          { title: 'No Contact', placeId: 'p4' },
        ]);
      }
    }
  }

  if (url.host === 'openrouter.ai') {
    if (url.pathname.endsWith('/models'))
      return json({ data: [
        { id: 'a/model-1:free', pricing: { prompt: '0', completion: '0' }, context_length: 100 },
        { id: 'b/model-2:free', pricing: { prompt: '0', completion: '0' }, context_length: 200 },
        { id: 'c/rerank:free', pricing: { prompt: '0', completion: '0' }, context_length: 999 },
        { id: 'paid/x', pricing: { prompt: '0.1', completion: '0.1' }, context_length: 5 },
      ] });
    const { model, messages } = body;
    llmCalls.push(model);
    if (model === 'a/model-1:free' && tick429) {
      tick429 = false; // first model is rate limited once, fallback must kick in
      return json({ error: { message: 'rate limit' } }, 429);
    }
    const sys: string = messages[0].content;
    const usr: string = messages[1].content;
    const idxs = [...usr.matchAll(/^#(\d+)/gm)].map((m) => Number(m[1]));
    let out: any;
    if (sys.includes('محلل أسواق')) out = { results: idxs.map((i) => ({ i, is_problem: true, problem_summary: `مشكلة رقم ${i}`, sector: 'fnb', who_suffers: 'أصحاب المطاعم', pays_for_solution: true, automation_fit: 'high', score: i % 2 === 0 ? 85 : 40 })) };
    else if (sys.includes('business_types')) out = { business_types: ['مطعم', 'مقهى'] };
    else if (sys.includes('محلل مبيعات')) out = { results: idxs.map((i) => ({ i, gap_found: 'لا يوجد نظام تأكيد طلبات واضح', fit_score: i === 0 ? 80 : 70 })) };
    else if (sys.includes('solution_name')) out = { solution_name: 'مؤكّد الطلبات', pitch: 'نظام يؤكد الطلبات تلقائياً عبر واتساب.', workflow_steps: ['استقبال الطلب', 'إرسال رسالة تأكيد', 'تحديث الحالة'], demo_script: 'مرحباً، سأريك كيف...', tools_needed: ['WhatsApp', 'Supabase'] };
    else out = { message: 'لاحظنا غياب تأكيد الطلبات عندكم. كثير من الطلبات تُلغى بعد التحضير. نبني نظاماً يؤكد الطلب تلقائياً. هل يناسبك عرض سريع؟', subject: 'تأكيد الطلبات' };
    return json({ choices: [{ message: { content: '```json\n' + JSON.stringify(out) + '\n```' } }] });
  }
  throw new Error(`unexpected fetch ${method} ${url}`);
}) as any;

const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_ROLE_KEY: 'k', APIFY_TOKEN: 't', OPENROUTER_API_KEY: 'o', OPENROUTER_MODELS: 'gone/model:free,a/model-1:free,b/model-2:free' };
let fails = 0;
const ok = (c: any, m: string) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) fails++; };
const job = (action: string, params: Row) => T.jobs.push({ id: uid(), action, params, status: 'running', result: null, created_at: new Date().toISOString(), locked_until: null });
const last = () => T.jobs[T.jobs.length - 1];
const drain = async (n = 6) => { for (let i = 0; i < n && last().status === 'running'; i++) await runTick(env as any); };

// --- radar
job('find_problems', { sector: 'fnb', market: 'gulf', sources: ['reddit', 'google-search', 'google-maps'], keywords: ['إلغاء الطلبات'] });
await runTick(env as any);
ok(last().result?.phase === 'scraping' && last().result.runs.length === 3, 'radar starts 3 Apify runs');
await drain();
ok(last().status === 'done', `radar job done (${last().status} ${last().error || ''})`);
ok(T.problems.length >= 2, `problems inserted: ${T.problems.length}`);
ok(T.problems.every((p) => p.score >= 60), 'only score >= threshold saved');
ok(llmCalls.includes('b/model-2:free'), 'fallback to 2nd model after 429');
ok(!llmCalls.includes('gone/model:free'), 'unknown model skipped');
ok(T.problems.some((p) => p.source === 'google-maps') && T.problems.every((p) => p.market === 'gulf'), 'maps review + market stored');

// re-run radar: same URLs must be skipped
const before = T.problems.length;
runs.clear();
job('find_problems', { sector: 'fnb', market: 'gulf', sources: ['reddit'] });
await drain();
ok(last().status === 'done' && T.problems.length === before, 'duplicates skipped on re-run');

// --- solution
const pid = T.problems[0].id;
job('build_solution', { problem_id: pid });
await drain();
ok(last().status === 'done' && T.solutions.length === 1 && T.problems[0].status === 'solution_ready', 'solution built + problem status');

// --- leads
runs.clear();
job('find_leads', { problem_id: pid });
await drain();
ok(last().status === 'done', `leads job done (${last().status} ${last().error || ''})`);
ok(T.leads.length === 3, `3 valid leads (closed + no-contact skipped): ${T.leads.length}`);
ok(T.leads.find((l) => l.name === 'Cafe Noor')?.contact_channel === 'whatsapp' && T.leads.find((l) => l.name === 'Clinic Salam')?.contact_channel === 'other', 'contact channels derived from data');
ok(T.problems[0].status === 'leads_found', 'problem marked leads_found');

// --- message + follow-up
job('write_message', { lead_id: T.leads[0].id });
await drain();
ok(T.messages.length === 1 && T.messages[0].status === 'pending_approval' && T.messages[0].channel === 'whatsapp', 'message drafted, pending approval');
Object.assign(T.messages[0], { status: 'sent', sent_at: new Date(Date.now() - 5 * 86400000).toISOString() });
job('write_followup', {});
await drain();
ok(T.messages.length === 2 && T.messages[1].type === 'followup' && T.messages[1].parent_message_id === T.messages[0].id, 'follow-up drafted for unanswered message');
job('write_followup', {});
await drain();
ok(T.messages.length === 2, 'no second follow-up while one is waiting');

// --- discovery (no LLM)
T.leads.length = 0;
runs.clear();
job('discover_leads', { mode: 'no_website', market: 'gulf' });
await drain();
ok(last().status === 'done' && T.leads.length === 1, `no_website: only phone+no-site lead kept (${T.leads.length}) ${last().error || ''}`);
ok(T.leads[0]?.name === 'Cafe Noor' && T.leads[0].gap_found.includes('لا يملك موقعاً') && T.leads[0].contact_channel === 'whatsapp' && !T.leads[0].problem_id, 'no_website lead has gap + whatsapp, no problem');
const noWebsiteInput = [...runs.values()].length;
ok(noWebsiteInput === 1, 'one Apify run for discovery');
T.leads.length = 0;
runs.clear();
job('discover_leads', { mode: 'low_rating', market: 'arabic' });
await drain();
ok(last().status === 'done' && T.leads.length === 1 && T.leads[0].name === 'Low Cafe', `low_rating: only <=3.8 stars kept (${T.leads.map((l) => l.name)})`);
ok(T.leads[0]?.gap_found.includes('3.2') && T.leads[0].gap_found.includes('من شكاوى العملاء'), 'low_rating gap quotes a real complaint');
ok(T.leads[0]?.fit_score >= 60 && T.leads[0].fit_score <= 95, `fit score heuristic (${T.leads[0]?.fit_score})`);

// --- trends radar (auto queries, no keywords)
runs.clear();
const probBefore = T.problems.length;
job('find_problems', { mode: 'trends', market: 'gulf' });
await runTick(env as any);
const trendActors = [...runs.values()].map((r) => r.actor).sort().join(',');
ok(trendActors === 'apify~google-search-scraper,trudax~reddit-scraper-lite', `trends uses web+reddit only: ${trendActors}`);
await drain();
ok(last().status === 'done' && last().result.analyzed >= 0, `trends job done (${last().status} ${last().error || ''})`);
void probBefore;

// --- lock
job('build_solution', { problem_id: T.problems[1].id });
await Promise.all([runTick(env as any), runTick(env as any)]);
ok(T.solutions.length === 2, `concurrent ticks do not double-process (${T.solutions.length} solutions)`);

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
