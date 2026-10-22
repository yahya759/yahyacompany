/**
 * Cloudflare Worker entry (deployed with `npx wrangler deploy`).
 *  - fetch: only /api/* reaches the Worker (static files come from the assets binding)
 *  - scheduled: cron every minute advances running jobs (Apify polling, LLM analysis)
 */
import { onRequest } from '../functions/api/[[path]]';
import { runTick } from './pipeline';
import type { Env } from './env';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return onRequest({ request, env });
  },
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    ctx.waitUntil(
      runTick(env).catch((e) => {
        console.error('[tick]', e?.message || e);
      }),
    );
  },
};
