import { defineHandler } from 'nitro';
import { proxy } from 'nitro/h3';

/** Where the Rust backend listens; set by `vite.config.ts` at build time. */
const backendUrl = process.env.API_BACKEND_URL ?? 'http://127.0.0.1:3711';

/**
 * Forwards `/api/v1/**` to the Rust backend. The backend picks the Philomena
 * by the site's `Host`, but the outgoing fetch always sets `Host` to the
 * backend's own address, so the original goes in `X-Forwarded-Host`.
 */
export default defineHandler(event => {
  const host = event.req.headers.get('host') ?? '';
  return proxy(event, `${backendUrl}${event.url.pathname}${event.url.search}`, {
    headers: { 'x-forwarded-host': host },
  });
});
