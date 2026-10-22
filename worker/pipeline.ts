/**
 * Job pipeline (replaces n8n). A job lives in the `jobs` table; `runTick` advances every running job.
 * Long work (Apify) is a state machine kept in jobs.result, so each tick is short and resumable.
 */
import type { Env } from './env';
import { db, type Db } from './db';
import { getItems, getRun, RUN_BAD, RUN_OK, startRun } from './apify';
import { chatJSON } from './llm';

type Job = { id: string; action: string; params: Record<string, any>; result: any; created_at: string };
type Step = { done: true; result: any } | { done: false; state: any };

const SECTORS = ['real-estate', 'ecommerce', 'fnb', 'healthcare', 'construction', 'services'];
const MARKET_CITY: Record<string, string> = {
  gulf: 'Riyadh, Saudi Arabia',
  arabic: 'Amman, Jordan',
  local: 'Nablus, Palestine',
};
const SECTOR_BUSINESS: Record<string, string> = {
  fnb: 'مطعم',
  healthcare: 'عيادة',
  construction: 'شركة مقاولات',
  'real-estate': 'مكتب عقارات',
  services: 'صالون تجميل',
  ecommerce: 'متجر',
};
const SECTOR_QUERY: Record<string, string> = {
  fnb: 'مشاكل إدارة المطاعم والطلبات',
  healthcare: 'مشاكل حجز المواعيد في العيادات',
  construction: 'مشاكل متابعة العملاء والمشاريع في المقاولات',
  'real-estate': 'مشاكل متابعة العملاء في مكاتب العقارات',
  services: 'مشاكل الحجوزات والمواعيد في الصالونات والخدمات',
  ecommerce: 'مشاكل تأكيد الطلبات والتوصيل في المتاجر الإلكترونية',
};

const clamp = (n: any, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const isObj = (v: any) => v && typeof v === 'object';
const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};
const roundRobin = <T>(lists: T[][], cap: number): T[] => {
  const out: T[] = [];
  for (let i = 0; out.length < cap && lists.some((l) => i < l.length); i++)
    for (const l of lists) if (i < l.length && out.length < cap) out.push(l[i]);
  return out;
};

async function loadSettings(sb: Db) {
  const rows = await sb.select('settings', 'select=key,value');
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    th: {
      problem_score_min: 60,
      lead_fit_min: 60,
      followup_after_days: 3,
      max_followups: 2,
      max_message_words: 80,
      ...(m.thresholds || {}),
    } as Record<string, number>,
    keywords: (Array.isArray(m.keywords) ? m.keywords : []) as string[],
    markets: (Array.isArray(m.markets) ? m.markets : []) as string[],
  };
}

/* ───────────────────────── entry points ───────────────────────── */

export async function runTick(env: Env): Promise<{ processed: number }> {
  const sb = db(env);
  const jobs = await sb.select('jobs', 'status=eq.running&order=created_at.asc&limit=5');
  for (const job of jobs) await processJob(env, sb, job);
  return { processed: jobs.length };
}

async function processJob(env: Env, sb: Db, job: Job) {
  const lockUntil = new Date(Date.now() + 180_000).toISOString();
  const got = await sb.update(
    'jobs',
    `id=eq.${job.id}&status=eq.running&or=(locked_until.is.null,locked_until.lt.${new Date().toISOString()})`,
    { locked_until: lockUntil },
  );
  if (!got.length) return; // someone else is on it
  try {
    if (Date.now() - new Date(job.created_at).getTime() > 45 * 60_000) throw new Error('انتهت مهلة المهمة (45 دقيقة)');
    const step = await advance(env, sb, job);
    if (step.done)
      await sb.update('jobs', `id=eq.${job.id}`, { status: 'done', result: step.result, error: null, finished_at: new Date().toISOString(), locked_until: null });
    else await sb.update('jobs', `id=eq.${job.id}`, { result: step.state, locked_until: null });
  } catch (e: any) {
    const msg = String(e?.message || e).slice(0, 480);
    const st = job.result;
    // Keep scraped data and retry the analysis a few times instead of wasting the Apify spend.
    if (st?.phase === 'analyzing' && (st.attempts || 0) < 3 && !e?.fatal) {
      await sb.update('jobs', `id=eq.${job.id}`, { result: { ...st, attempts: (st.attempts || 0) + 1, lastError: msg }, locked_until: null });
      return;
    }
    await sb.update('jobs', `id=eq.${job.id}`, { status: 'failed', error: msg, finished_at: new Date().toISOString(), locked_until: null });
  }
}

async function advance(env: Env, sb: Db, job: Job): Promise<Step> {
  switch (job.action) {
    case 'find_problems':
      return advanceRadar(env, sb, job);
    case 'build_solution':
      return buildSolution(env, sb, job);
    case 'find_leads':
      return advanceLeads(env, sb, job);
    case 'write_message':
      return writeMessage(env, sb, job);
    case 'write_followup':
      return writeFollowups(env, sb, job);
    default:
      throw new Error(`action غير مدعوم: ${job.action}`);
  }
}

/* ───────────────────────── shared: Apify run polling ───────────────────────── */

type RunRef = { source: string; runId: string; datasetId: string; status?: string };

async function pollRuns(env: Env, runs: RunRef[]) {
  for (const r of runs) {
    if (r.status === RUN_OK || RUN_BAD.has(r.status || '')) continue;
    r.status = (await getRun(env, r.runId)).status;
  }
  return runs.every((r) => r.status === RUN_OK || RUN_BAD.has(r.status || ''));
}

/* ───────────────────────── 1) find_problems (radar) ───────────────────────── */

type Cand = { source: string; url: string; text: string };

async function advanceRadar(env: Env, sb: Db, job: Job): Promise<Step> {
  const st = job.result;
  if (!st?.phase) return startRadar(env, sb, job);
  if (st.phase === 'scraping') {
    const finished = await pollRuns(env, st.runs);
    const waited = Date.now() - new Date(st.startedAt).getTime();
    if (!finished && waited < 12 * 60_000) return { done: false, state: st };
    return collectRadar(env, sb, job, st);
  }
  return analyzeRadar(env, sb, job, st);
}

async function startRadar(env: Env, sb: Db, job: Job): Promise<Step> {
  const p = job.params || {};
  const s = await loadSettings(sb);
  const sector = SECTORS.includes(p.sector) ? p.sector : undefined;
  let keywords: string[] = (Array.isArray(p.keywords) ? p.keywords : []).map(String).filter(Boolean);
  if (!keywords.length) keywords = s.keywords.length ? s.keywords : [sector ? SECTOR_QUERY[sector] : 'مشاكل أصحاب الأعمال الصغيرة مع الحجوزات والطلبات'];
  keywords = keywords.slice(0, 3);
  const sources: string[] = Array.isArray(p.sources) && p.sources.length ? p.sources : ['reddit', 'google-search', 'google-maps'];
  const market = ['gulf', 'arabic', 'local'].includes(p.market) ? p.market : 'local';
  const cities = ((Array.isArray(p.markets) && p.markets.length ? p.markets : s.markets) as string[]).slice(0, 1);
  const city = cities[0] || MARKET_CITY[market];

  const runs: RunRef[] = [];
  const errors: string[] = [];
  const tryStart = async (source: string, actor: string, input: Record<string, unknown>, maxItems?: number) => {
    try {
      runs.push({ source, ...(await startRun(env, actor, input, { maxItems })) });
    } catch (e: any) {
      errors.push(`${source}: ${e.message}`);
    }
  };

  if (sources.includes('reddit'))
    await tryStart('reddit', 'trudax/reddit-scraper-lite', {
      searches: keywords, searchPosts: true, searchComments: false, skipComments: true, skipUserPosts: true,
      sort: 'relevance', time: 'year', maxItems: 30, maxPostCount: 15, proxy: { useApifyProxy: true },
    }, 30);
  if (sources.includes('google-search'))
    await tryStart('google-search', 'apify/google-search-scraper', {
      queries: keywords.join('\n'), maxPagesPerQuery: 1, resultsPerPage: 10, languageCode: 'ar',
    });
  if (sources.includes('google-maps'))
    await tryStart('google-maps', 'compass/crawler-google-places', {
      searchStringsArray: sector ? [SECTOR_BUSINESS[sector]] : ['مطعم', 'عيادة'],
      locationQuery: city, maxCrawledPlacesPerSearch: 8, maxReviews: 20, maxImages: 0, language: 'ar',
    });

  if (!runs.length) throw new Error(`تعذّر تشغيل أي مصدر — ${errors.join(' | ')}`.slice(0, 480));
  return {
    done: false,
    state: { phase: 'scraping', startedAt: new Date().toISOString(), runs, errors, ctx: { market, sector: sector || null, keywords } },
  };
}

async function collectRadar(env: Env, sb: Db, job: Job, st: any): Promise<Step> {
  const lists: Cand[][] = [];
  const errors: string[] = [...(st.errors || [])];
  const sources: Record<string, { fetched: number; usable: number }> = {};
  for (const r of st.runs as RunRef[]) {
    if (r.status !== RUN_OK) {
      errors.push(`${r.source}: ${r.status || 'لم ينتهِ'}`);
      continue;
    }
    const items = await getItems(env, r.datasetId, 100);
    const c: Cand[] = [];
    if (r.source === 'reddit')
      for (const it of items) {
        const text = `${it.title || ''}\n${it.body || it.text || ''}`.trim();
        const url = it.url || it.link;
        if (url && text.length >= 40) c.push({ source: 'reddit', url, text });
      }
    else if (r.source === 'google-search')
      for (const it of items)
        for (const o of it.organicResults || []) {
          const text = `${o.title || ''}\n${o.description || ''}`.trim();
          if (o.url && text.length >= 40) c.push({ source: 'google-search', url: o.url, text });
        }
    else if (r.source === 'google-maps')
      for (const place of items)
        for (const rv of place.reviews || []) {
          const body = String(rv.text || rv.textTranslated || '').trim();
          const stars = Number(rv.stars ?? 5);
          if (body.length >= 25 && stars <= 3)
            c.push({
              source: 'google-maps',
              url: `${place.url || place.placeUrl || place.website || 'maps'}#r${hash(body)}`,
              text: `[${place.title}] (${stars}★) ${body}`,
            });
        }
    sources[r.source] = { fetched: items.length, usable: c.length };
    lists.push(c);
  }

  const seen = await sb.select('problems', 'select=source_url&source_url=not.is.null&order=created_at.desc&limit=1000');
  const known = new Set(seen.map((x) => x.source_url));
  const uniq = new Set<string>();
  const fresh = lists.map((l) =>
    l.filter((c) => {
      if (known.has(c.url) || uniq.has(c.url)) return false;
      uniq.add(c.url);
      return true;
    }).map((c) => ({ ...c, text: c.text.slice(0, 500) })),
  );
  const candidates = roundRobin(fresh, 40);
  if (!candidates.length)
    return { done: true, result: { found: 0, analyzed: 0, note: 'المصادر لم تُرجع نتائج جديدة صالحة للتحليل', sources, errors } };
  return analyzeRadar(env, sb, job, { phase: 'analyzing', ctx: st.ctx, candidates, idx: 0, found: 0, attempts: 0, errors, models: [], sources, rejected: [] });
}

async function analyzeRadar(env: Env, sb: Db, job: Job, st: any): Promise<Step> {
  const s = await loadSettings(sb);
  const t0 = Date.now();
  const cands: Cand[] = st.candidates;
  while (st.idx < cands.length && Date.now() - t0 < 100_000) {
    const batch = cands.slice(st.idx, st.idx + 8);
    const prompt = batch.map((c, i) => `#${i} [${c.source}]\n${c.text}`).join('\n\n---\n\n');
    const { data, model } = await chatJSON<{ results: any[] }>(
      env,
      `أنت محلل أسواق عربي. تقرأ منشورات وتقييمات وعناوين بحث وتستخرج منها مشاكل أعمال حقيقية يمكن حلها بأتمتة أو أداة برمجية بسيطة (واتساب، حجوزات، جداول، تذكيرات، متابعة عملاء)، ويكون صاحب العمل هو من يدفع للحل.
أعد JSON فقط بهذا الشكل بدون أي نص آخر:
{"results":[{"i":0,"is_problem":true,"problem_summary":"المشكلة بجملة أو جملتين بالعربية (لا تنقل النص حرفياً)","sector":"real-estate|ecommerce|fnb|healthcare|construction|services","who_suffers":"من يتضرر","pays_for_solution":true,"automation_fit":"high|medium|low","score":0}]}
قواعد التقييم score من 0 إلى 100: ارفعه فقط إذا كانت المشكلة محددة ومتكررة وتكلّف وقتاً أو مالاً وقابلة للحل بأتمتة وصاحب العمل هو المشتري. الشكاوى العامة والإعلانات والمنشورات غير المتعلقة = is_problem:false وscore منخفض. لا تخترع تفاصيل غير موجودة في النص. أعد عنصراً لكل رقم #.`,
      `القطاع المفضّل (تلميح فقط، لا ترفض مشكلة جيدة من قطاع آخر وصنّفها بقطاعها الصحيح): ${st.ctx.sector || 'أي قطاع'}\nكلمات البحث: ${(st.ctx.keywords || []).join('، ')}\n\n${prompt}`,
      (v) => isObj(v) && Array.isArray(v.results),
    );
    const rows = data.results
      .filter((r) => r && Number.isInteger(r.i) && batch[r.i] && r.is_problem && typeof r.problem_summary === 'string' && clamp(r.score) >= s.th.problem_score_min)
      .map((r) => {
        const c = batch[r.i];
        return {
          job_id: job.id,
          problem_summary: String(r.problem_summary).slice(0, 600),
          sector: SECTORS.includes(r.sector) ? r.sector : st.ctx.sector || 'services',
          who_suffers: r.who_suffers ? String(r.who_suffers).slice(0, 200) : null,
          pays_for_solution: !!r.pays_for_solution,
          automation_fit: ['high', 'medium', 'low'].includes(r.automation_fit) ? r.automation_fit : null,
          score: clamp(r.score),
          source: c.source,
          source_url: c.url,
          raw_text: c.text,
          market: st.ctx.market,
        };
      });
    const inserted = await sb.insertSkipDuplicates('problems', rows);
    // Keep a few rejected items (with scores) so a "0 results" run can be explained.
    const accepted = new Set(rows.map((r) => r.source_url));
    for (const r of data.results)
      if (r && Number.isInteger(r.i) && batch[r.i] && !accepted.has(batch[r.i].url))
        st.rejected = [...(st.rejected || []), { source: batch[r.i].source, score: clamp(r.score), is_problem: !!r.is_problem, summary: String(r.problem_summary || batch[r.i].text).slice(0, 90) }]
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 6);
    st.found += inserted.length;
    st.idx += batch.length;
    st.models = [...new Set([...(st.models || []), model])];
    st.attempts = 0;
    st.lastError = undefined;
  }
  if (st.idx >= cands.length)
    return {
      done: true,
      result: {
        found: st.found,
        analyzed: cands.length,
        threshold: s.th.problem_score_min,
        models: st.models,
        sources: st.sources,
        topRejected: st.found === 0 ? st.rejected : undefined,
        errors: st.errors,
      },
    };
  return { done: false, state: st };
}

/* ───────────────────────── 2) build_solution ───────────────────────── */

async function buildSolution(env: Env, sb: Db, job: Job): Promise<Step> {
  const id = String(job.params?.problem_id || '');
  const [p] = await sb.select('problems', `id=eq.${id}&select=*`);
  if (!p) throw new Error('المشكلة غير موجودة');
  const [exists] = await sb.select('solutions', `problem_id=eq.${id}&select=id&limit=1`);
  if (exists) return { done: true, result: { solution_id: exists.id, note: 'الحل موجود مسبقاً' } };

  const { data, model } = await chatJSON<any>(
    env,
    `أنت مصمم حلول أتمتة لأصحاب الأعمال العرب. تقترح حلاً عملياً يمكن بناؤه كمنتج صغير (MVP) بأدوات مثل واتساب، جداول، قاعدة بيانات، ذكاء اصطناعي.
أعد JSON فقط:
{"solution_name":"اسم قصير","pitch":"جملتان تشرحان الفائدة لصاحب العمل بلغة بسيطة بدون مبالغة","workflow_steps":["خطوة قصيرة","..."],"demo_script":"سيناريو عرض شفهي 60-90 ثانية بالعربية: يبدأ بالمشكلة ثم يريه الحل خطوة بخطوة","tools_needed":["أداة"]}
workflow_steps من 4 إلى 8 خطوات. لا تذكر أرقاماً أو نتائج أو عملاء سابقين غير موجودين.`,
    `المشكلة: ${p.problem_summary}\nالمتضرر: ${p.who_suffers || '-'}\nالقطاع: ${p.sector || '-'}`,
    (v) => isObj(v) && typeof v.solution_name === 'string' && typeof v.pitch === 'string' && Array.isArray(v.workflow_steps),
    3500,
  );
  const [row] = await sb.insert('solutions', [
    {
      problem_id: id,
      solution_name: String(data.solution_name).slice(0, 120),
      pitch: String(data.pitch).slice(0, 800),
      workflow_steps: data.workflow_steps.map(String).slice(0, 10),
      demo_script: typeof data.demo_script === 'string' ? data.demo_script.slice(0, 4000) : null,
      tools_needed: Array.isArray(data.tools_needed) ? data.tools_needed.map(String).slice(0, 10) : [],
    },
  ]);
  await sb.update('problems', `id=eq.${id}&status=eq.new`, { status: 'solution_ready' });
  return { done: true, result: { solution_id: row?.id, model } };
}

/* ───────────────────────── 3) find_leads ───────────────────────── */

async function advanceLeads(env: Env, sb: Db, job: Job): Promise<Step> {
  const st = job.result;
  if (!st?.phase) return startLeads(env, sb, job);
  if (st.phase === 'scraping') {
    const finished = await pollRuns(env, st.runs);
    const waited = Date.now() - new Date(st.startedAt).getTime();
    if (!finished && waited < 12 * 60_000) return { done: false, state: st };
    return collectLeads(env, sb, job, st);
  }
  return scoreLeads(env, sb, job, st);
}

async function startLeads(env: Env, sb: Db, job: Job): Promise<Step> {
  const id = String(job.params?.problem_id || '');
  const [p] = await sb.select('problems', `id=eq.${id}&select=*`);
  if (!p) throw new Error('المشكلة غير موجودة');
  const s = await loadSettings(sb);

  const { data } = await chatJSON<{ business_types: string[] }>(
    env,
    `أنت خبير مبيعات B2B. بناءً على مشكلة، حدّد أنواع الأنشطة التجارية المحلية التي تعاني منها وتُبحث في خرائط Google.
أعد JSON فقط: {"business_types":["نوع نشاط بالعربية","..."]} من 1 إلى 3 أنواع قصيرة (مثل: عيادة أسنان، صالون تجميل، مطعم).`,
    `المشكلة: ${p.problem_summary}\nالمتضرر: ${p.who_suffers || '-'}\nالقطاع: ${p.sector || '-'}`,
    (v) => isObj(v) && Array.isArray(v.business_types) && v.business_types.length > 0,
    600,
  );
  const types = data.business_types.map(String).slice(0, 3);
  const city = s.markets[0] || MARKET_CITY[p.market] || MARKET_CITY.local;
  const run = await startRun(env, 'compass/crawler-google-places', {
    searchStringsArray: types, locationQuery: city, maxCrawledPlacesPerSearch: 12,
    maxReviews: 0, maxImages: 0, language: 'ar',
  });
  return {
    done: false,
    state: { phase: 'scraping', startedAt: new Date().toISOString(), runs: [{ source: 'google-maps', ...run }], ctx: { problem_id: id, summary: p.problem_summary, who: p.who_suffers, city, types } },
  };
}

async function collectLeads(env: Env, sb: Db, job: Job, st: any): Promise<Step> {
  const run: RunRef = st.runs[0];
  if (run.status !== RUN_OK) throw new Error(`فشل تشغيل خرائط Google (${run.status || 'لم ينتهِ'})`);
  const items = await getItems(env, run.datasetId, 100);
  const existing = await sb.select('leads', 'select=place_id,name&limit=3000');
  const ids = new Set(existing.map((x) => x.place_id).filter(Boolean));
  const names = new Set(existing.map((x) => String(x.name).toLowerCase()));
  const seen = new Set<string>();
  const leads: any[] = [];
  for (const it of items) {
    const name = String(it.title || '').trim();
    const phone = String(it.phoneUnformatted || it.phone || '').trim();
    const website = String(it.website || '').trim();
    if (!name || it.permanentlyClosed || (!phone && !website)) continue;
    if ((it.placeId && ids.has(it.placeId)) || names.has(name.toLowerCase()) || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    leads.push({
      name,
      address: it.address || null,
      city: it.city || st.ctx.city,
      website: website || null,
      phone: phone || null,
      place_id: it.placeId || null,
      contact_channel: phone ? 'whatsapp' : 'other',
      contact_value: phone || website,
      facts: `${it.categoryName || ''} | تقييم ${it.totalScore ?? '?'} من ${it.reviewsCount ?? '?'} مراجعة | موقع: ${website ? 'نعم' : 'لا'} | هاتف: ${phone ? 'نعم' : 'لا'}`,
    });
    if (leads.length >= 40) break;
  }
  if (!leads.length) return { done: true, result: { found: 0, scanned: items.length, note: 'لا أنشطة جديدة' } };
  return scoreLeads(env, sb, job, { phase: 'analyzing', ctx: st.ctx, leads, idx: 0, found: 0, scanned: items.length, attempts: 0, models: [] });
}

async function scoreLeads(env: Env, sb: Db, job: Job, st: any): Promise<Step> {
  const s = await loadSettings(sb);
  const t0 = Date.now();
  const leads: any[] = st.leads;
  while (st.idx < leads.length && Date.now() - t0 < 100_000) {
    const batch = leads.slice(st.idx, st.idx + 10);
    const { data, model } = await chatJSON<{ results: any[] }>(
      env,
      `أنت محلل مبيعات. لكل نشاط تجاري حدّد الفجوة المحتملة المرتبطة بالمشكلة وقيّم مدى ملاءمته كعميل.
اعتمد فقط على المعلومات المعطاة (لا تخترع). إذا لم تكن هناك فجوة واضحة من البيانات اجعل fit_score منخفضاً.
أعد JSON فقط: {"results":[{"i":0,"gap_found":"فجوة محددة بجملة عربية قصيرة","fit_score":0}]} وعنصر لكل رقم #.`,
      `المشكلة: ${st.ctx.summary}\nالمتضرر: ${st.ctx.who || '-'}\n\n` +
        batch.map((l, i) => `#${i} ${l.name} — ${l.facts}`).join('\n'),
      (v) => isObj(v) && Array.isArray(v.results),
    );
    const rows = data.results
      .filter((r) => r && Number.isInteger(r.i) && batch[r.i] && clamp(r.fit_score) >= s.th.lead_fit_min)
      .map((r) => {
        const { facts, ...l } = batch[r.i];
        return { ...l, problem_id: st.ctx.problem_id, job_id: job.id, gap_found: String(r.gap_found || '').slice(0, 300) || null, fit_score: clamp(r.fit_score) };
      });
    const inserted = await sb.insertSkipDuplicates('leads', rows);
    st.found += inserted.length;
    st.idx += batch.length;
    st.models = [...new Set([...(st.models || []), model])];
    st.attempts = 0;
  }
  if (st.idx >= leads.length) {
    if (st.found > 0) await sb.update('problems', `id=eq.${st.ctx.problem_id}&status=neq.archived`, { status: 'leads_found' });
    return { done: true, result: { found: st.found, scanned: st.scanned, models: st.models } };
  }
  return { done: false, state: st };
}

/* ───────────────────────── 4) write_message ───────────────────────── */

async function composeMessage(env: Env, th: Record<string, number>, ctx: { lead: any; problem?: any; solution?: any; followupOf?: string }) {
  const max = th.max_message_words;
  const { lead, problem, solution, followupOf } = ctx;
  const system = followupOf
    ? `اكتب رسالة متابعة قصيرة ولطيفة بالعربية تبني على الرسالة الأولى دون تكرارها ولا إلحاح، وتنتهي بسؤال خفيف. أقل من ${max} كلمة.`
    : `اكتب رسالة تواصل أولى بالعربية البسيطة المهذبة باسم "يحيى" (مطوّر حلول أتمتة). الترتيب إلزامي: تبدأ بالفجوة التي لاحظناها عند النشاط، ثم المشكلة، ثم الحل المقترح، ثم سؤال خفيف في الآخر. أقل من ${max} كلمة. بدون روابط، بدون مبالغة، ولا تذكر نتائج أو أرقاماً أو عملاء سابقين.`;
  const { data } = await chatJSON<{ message: string; subject?: string }>(
    env,
    `${system}\nأعد JSON فقط: {"message":"نص الرسالة","subject":"عنوان قصير للإيميل"}`,
    `النشاط: ${lead.name}\nالفجوة: ${lead.gap_found || '-'}\nالمشكلة: ${problem?.problem_summary || '-'}\nالحل: ${solution ? `${solution.solution_name} — ${solution.pitch || ''}` : '-'}` +
      (followupOf ? `\n\nالرسالة الأولى:\n${followupOf}` : ''),
    (v) => isObj(v) && typeof v.message === 'string' && v.message.trim().length > 10 && words(v.message) <= max + 15,
    1500,
  );
  return { message: data.message.trim(), subject: data.subject ? String(data.subject).slice(0, 120) : null };
}

async function writeMessage(env: Env, sb: Db, job: Job): Promise<Step> {
  const leadId = String(job.params?.lead_id || '');
  const [lead] = await sb.select('leads', `id=eq.${leadId}&select=*`);
  if (!lead) throw new Error('العميل غير موجود');
  const [problem] = lead.problem_id ? await sb.select('problems', `id=eq.${lead.problem_id}&select=*`) : [];
  const [solution] = lead.problem_id ? await sb.select('solutions', `problem_id=eq.${lead.problem_id}&order=created_at.desc&limit=1`) : [];
  const s = await loadSettings(sb);
  const m = await composeMessage(env, s.th, { lead, problem, solution });
  const [row] = await sb.insert('messages', [
    { lead_id: lead.id, solution_id: solution?.id || null, type: 'first', channel: lead.contact_channel || 'other', subject: m.subject, message: m.message, status: 'pending_approval' },
  ]);
  return { done: true, result: { message_id: row?.id } };
}

/* ───────────────────────── 5) write_followup ───────────────────────── */

async function writeFollowups(env: Env, sb: Db, job: Job): Promise<Step> {
  const s = await loadSettings(sb);
  const cutoff = Date.now() - s.th.followup_after_days * 86_400_000;
  const msgs = await sb.select('messages', 'select=*&status=in.(sent,pending_approval,approved)&order=created_at.asc&limit=1000');
  const byLead = new Map<string, any[]>();
  for (const m of msgs) byLead.set(m.lead_id, [...(byLead.get(m.lead_id) || []), m]);

  const due: { lastSent: any; count: number }[] = [];
  for (const list of byLead.values()) {
    const sent = list.filter((m) => m.status === 'sent').sort((a, b) => +new Date(b.sent_at || b.created_at) - +new Date(a.sent_at || a.created_at));
    if (!sent.length || sent.some((m) => m.replied)) continue;
    if (list.some((m) => m.type === 'followup' && m.status !== 'sent')) continue; // already has a draft waiting
    const count = list.filter((m) => m.type === 'followup').length;
    if (count >= s.th.max_followups) continue;
    if (+new Date(sent[0].sent_at || sent[0].created_at) > cutoff) continue;
    due.push({ lastSent: sent[0], count });
  }

  const t0 = Date.now();
  let created = 0;
  const leadIds = due.map((d) => d.lastSent.lead_id);
  const leads = leadIds.length ? await sb.select('leads', `id=in.(${leadIds.join(',')})&select=*`) : [];
  for (const d of due) {
    if (Date.now() - t0 > 90_000) break;
    const lead = leads.find((l) => l.id === d.lastSent.lead_id);
    if (!lead || ['replied', 'won', 'lost'].includes(lead.status)) continue;
    const [problem] = lead.problem_id ? await sb.select('problems', `id=eq.${lead.problem_id}&select=*`) : [];
    const m = await composeMessage(env, s.th, { lead, problem, followupOf: d.lastSent.message });
    await sb.insert('messages', [
      { lead_id: lead.id, solution_id: d.lastSent.solution_id, parent_message_id: d.lastSent.id, type: 'followup', channel: d.lastSent.channel, subject: m.subject, message: m.message, status: 'pending_approval', followup_count: d.count + 1 },
    ]);
    created++;
  }
  return { done: true, result: { created, due: due.length } };
}
