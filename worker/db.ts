import type { Env } from './env';

/** Minimal Supabase REST (PostgREST) client. The service role key never leaves the server. */
export function db(env: Env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('Supabase غير مضبوط (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  const base = env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1';
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  const call = async (path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) => {
    const res = await fetch(`${base}/${path}`, {
      method: init.method || 'GET',
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        ...(init.prefer ? { prefer: init.prefer } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const msg = (data && typeof data === 'object' && (data.message || data.error)) || text;
      throw Object.assign(new Error(`Supabase ${res.status}: ${String(msg).slice(0, 200)}`), { status: res.status, code: data?.code });
    }
    return data;
  };

  return {
    select: (table: string, query = 'select=*'): Promise<any[]> => call(`${table}?${query}`),
    insert: (table: string, rows: unknown): Promise<any[]> =>
      call(table, { method: 'POST', body: rows, prefer: 'return=representation' }),
    update: (table: string, filter: string, patch: unknown): Promise<any[]> =>
      call(`${table}?${filter}`, { method: 'PATCH', body: patch, prefer: 'return=representation' }),
    /** Bulk insert; if a unique index rejects the batch, fall back to row-by-row and skip duplicates. */
    async insertSkipDuplicates(table: string, rows: any[]): Promise<any[]> {
      if (!rows.length) return [];
      try {
        return await this.insert(table, rows);
      } catch (e: any) {
        if (e.status !== 409 && e.code !== '23505') throw e;
        const out: any[] = [];
        for (const r of rows) {
          try {
            out.push(...(await this.insert(table, [r])));
          } catch (e2: any) {
            if (e2.status !== 409 && e2.code !== '23505') throw e2;
          }
        }
        return out;
      }
    },
  };
}
export type Db = ReturnType<typeof db>;
