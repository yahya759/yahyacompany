import type { Env } from './env';

const OR = 'https://openrouter.ai/api/v1';

let cache: { at: number; free: string[]; all: Set<string> } | null = null;
const cooldown = new Map<string, number>();

async function liveModels() {
  if (cache && Date.now() - cache.at < 30 * 60_000) return cache;
  try {
    const res = await fetch(`${OR}/models`, { signal: AbortSignal.timeout(15_000) });
    const j: any = await res.json();
    const all = new Set<string>();
    const free: { id: string; ctx: number }[] = [];
    for (const m of j.data || []) {
      all.add(m.id);
      const p = m.pricing || {};
      const out: string[] | undefined = m.architecture?.output_modalities;
      const textOut = !out || out.includes('text');
      if (Number(p.prompt) === 0 && Number(p.completion) === 0 && textOut && !/rerank|embed|guard|moderation/i.test(m.id))
        free.push({ id: m.id, ctx: m.context_length || 0 });
    }
    free.sort((a, b) => b.ctx - a.ctx);
    cache = { at: Date.now(), free: free.slice(0, 12).map((x) => x.id), all };
    return cache;
  } catch {
    return null;
  }
}

/** Priority list from OPENROUTER_MODELS (names that no longer exist are skipped); falls back to the live free list. */
export async function resolveModels(env: Env): Promise<string[]> {
  const wanted = (env.OPENROUTER_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const live = await liveModels();
  if (wanted.length) {
    if (!live || !live.all.size) return wanted;
    const ok = wanted.filter((m) => live.all.has(m));
    if (ok.length) return ok;
  }
  return live?.free.length ? live.free : wanted;
}

export function extractJSON(raw: string): any {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim();
  const starts = [s.indexOf('{'), s.indexOf('[')].filter((i) => i >= 0);
  if (!starts.length) return undefined;
  const a = Math.min(...starts);
  const close = s[a] === '{' ? '}' : ']';
  const b = s.lastIndexOf(close);
  if (b <= a) return undefined;
  try {
    return JSON.parse(s.slice(a, b + 1));
  } catch {
    return undefined;
  }
}

/** Calls models in priority order; moves to the next one on rate limit, error, empty or invalid JSON. */
export async function chatJSON<T>(
  env: Env,
  system: string,
  user: string,
  validate: (v: any) => boolean,
  maxTokens = 3000,
): Promise<{ data: T; model: string }> {
  if (!env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY غير مضبوط');
  const models = await resolveModels(env);
  if (!models.length) throw new Error('لا توجد موديلات متاحة على OpenRouter');
  const errors: string[] = [];

  for (const model of models) {
    if ((cooldown.get(model) || 0) > Date.now()) {
      errors.push(`${model}: مؤقتاً (rate limit)`);
      continue;
    }
    try {
      const res = await fetch(`${OR}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'content-type': 'application/json',
          'http-referer': 'https://workers.dev',
          'x-title': 'FGTW',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          temperature: 0.2,
          max_tokens: maxTokens,
        }),
        signal: AbortSignal.timeout(90_000),
      });
      const body: any = await res.json().catch(() => ({}));
      if (res.status === 401) throw Object.assign(new Error('مفتاح OpenRouter غير صالح'), { fatal: true });
      if (!res.ok || body?.error) {
        const status = res.ok ? Number(body?.error?.code) || 0 : res.status;
        errors.push(`${model}: ${String(body?.error?.message || `HTTP ${res.status}`).slice(0, 90)}`);
        if (status === 429 || status === 402 || status >= 500) cooldown.set(model, Date.now() + 60_000);
        continue;
      }
      const content: string | undefined = body?.choices?.[0]?.message?.content;
      if (!content) {
        errors.push(`${model}: رد فارغ`);
        continue;
      }
      const parsed = extractJSON(content);
      if (parsed === undefined || !validate(parsed)) {
        errors.push(`${model}: JSON غير صالح`);
        continue;
      }
      return { data: parsed as T, model };
    } catch (e: any) {
      if (e?.fatal) throw e;
      errors.push(`${model}: ${e?.name === 'TimeoutError' ? 'timeout' : String(e?.message || e).slice(0, 80)}`);
    }
  }
  throw new Error(`فشلت كل الموديلات — ${errors.slice(0, 4).join(' | ')}`.slice(0, 480));
}
