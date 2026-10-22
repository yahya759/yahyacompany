import type { Env } from './env';

const API = 'https://api.apify.com/v2';

const headers = (env: Env) => {
  if (!env.APIFY_TOKEN) throw new Error('APIFY_TOKEN غير مضبوط');
  return { authorization: `Bearer ${env.APIFY_TOKEN}`, 'content-type': 'application/json' };
};

async function parse(res: Response) {
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) throw new Error(`Apify ${res.status}: ${String(body?.error?.message || text).slice(0, 220)}`);
  return body;
}

export async function startRun(
  env: Env,
  actor: string,
  input: Record<string, unknown>,
  opts: { maxItems?: number; timeoutSecs?: number } = {},
): Promise<{ runId: string; datasetId: string }> {
  const qs = new URLSearchParams({ timeout: String(opts.timeoutSecs ?? 300) });
  if (opts.maxItems) qs.set('maxItems', String(opts.maxItems));
  // Hard spending cap per run (applies to pay-per-result / pay-per-event actors).
  qs.set('maxTotalChargeUsd', String(Number(env.APIFY_MAX_COST_USD) || 0.5));
  const body = await parse(
    await fetch(`${API}/acts/${actor.replace('/', '~')}/runs?${qs}`, {
      method: 'POST',
      headers: headers(env),
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(30_000),
    }),
  );
  return { runId: body.data.id, datasetId: body.data.defaultDatasetId };
}

export async function getRun(env: Env, runId: string): Promise<{ status: string }> {
  const body = await parse(await fetch(`${API}/actor-runs/${runId}`, { headers: headers(env), signal: AbortSignal.timeout(20_000) }));
  return { status: body.data.status };
}

export async function getItems(env: Env, datasetId: string, limit = 100): Promise<any[]> {
  const res = await fetch(`${API}/datasets/${datasetId}/items?clean=true&format=json&limit=${limit}`, {
    headers: headers(env),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await parse(res);
  return Array.isArray(body) ? body : [];
}

export const RUN_OK = 'SUCCEEDED';
export const RUN_BAD = new Set(['FAILED', 'ABORTED', 'TIMED-OUT']);
