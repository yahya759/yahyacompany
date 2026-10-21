/**
 * Cloudflare Worker entry (deployed with `npx wrangler deploy`).
 *
 * Static files (dist/) are served by the assets binding. Only /api/* reaches
 * this Worker (see run_worker_first in wrangler.jsonc) and is handled by the
 * same function code that also works as a Pages Function.
 */
import { onRequest } from '../functions/api/[[path]]';

export default {
  async fetch(request: Request, env: Record<string, string | undefined>): Promise<Response> {
    return onRequest({ request, env });
  },
};
