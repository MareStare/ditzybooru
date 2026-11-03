import { defineHandler } from 'nitro';
import { proxyRequest } from 'nitro/h3';

/** Where the Rust backend listens; set by `vite.config.ts` at build time. */
const backendUrl = process.env.API_BACKEND_URL ?? 'http://127.0.0.1:3711';

/**
 * Forwards `/api/v1/**` to the Rust backend, with its method, body and
 * headers: the visitor's `Cookie` (the site's session) and `X-Api-Key`, which
 * the backend picks from for the endpoints that act as the visitor, and
 * `Set-Cookie` comes back the same way. The backend picks the Philomena by the
 * site's `Host`, but the outgoing fetch sets `Host` to the backend's own
 * address, so the original goes in `X-Forwarded-Host`. `X-Forwarded-Proto` is
 * what makes the cookies it hands back `Secure` on https.
 */
export default defineHandler(event => {
  const host = event.req.headers.get('host') ?? '';
  const proto = event.req.headers.get('x-forwarded-proto') ?? event.url.protocol.replace(':', '');
  return proxyRequest(event, `${backendUrl}${event.url.pathname}${event.url.search}`, {
    headers: { 'x-forwarded-host': host, 'x-forwarded-proto': proto },
  });
});
