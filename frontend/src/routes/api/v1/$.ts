import { createFileRoute } from '@tanstack/react-router';

import { backendHeaders, backendUrl } from '#/lib/api/backend/backend.server';

/** Response headers worth passing on; the rest belong to the hop between us and the backend. */
const PASSED_HEADERS = ['content-type', 'cache-control', 'retry-after'];

/**
 * Forwards `/api/v1/**` to the Rust backend where the server has no proxy of
 * its own (Workers, `vite dev`). The standalone Node server proxies in
 * `api-proxy.ts` before a request gets here. See `backend.server.ts` for the
 * switch that turns this off.
 */
async function forward(request: Request): Promise<Response> {
  const base = backendUrl();
  if (base === undefined) {
    return Response.json({ error: { code: 'not_found', message: 'the API is not enabled here' } }, { status: 404 });
  }
  const url = new URL(request.url);
  const upstream = await fetch(`${base}${url.pathname}${url.search}`, {
    headers: {
      Accept: 'application/json',
      'X-Forwarded-Host': url.host,
      ...backendHeaders(),
    },
    redirect: 'manual',
  });
  const headers = new Headers();
  for (const name of PASSED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

export const Route = createFileRoute('/api/v1/$')({
  server: { handlers: { GET: ({ request }) => forward(request) } },
});
