import { createFileRoute } from '@tanstack/react-router';

import { backendHeaders, backendUrl } from '#/lib/api/backend/backend.server';

/** Response headers worth passing on; the rest belong to the hop between us and the backend. */
const PASSED_HEADERS = ['content-type', 'cache-control', 'retry-after'];

/** Request headers passed on: the visitor's own Philomena credentials, and what the body is. */
const FORWARDED_HEADERS = ['x-api-key', 'cookie', 'content-type'];

function forwardedHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value !== null) {
      headers[name] = value;
    }
  }

  return headers;
}

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
    method: request.method,
    headers: {
      Accept: 'application/json',
      'X-Forwarded-Host': url.host,
      'X-Forwarded-Proto': url.protocol.replace(':', ''),
      ...forwardedHeaders(request),
      ...backendHeaders(),
    },
    ...(request.method === 'GET' || request.method === 'HEAD' ? {} : { body: request.body, duplex: 'half' }),
    redirect: 'manual',
  });
  const headers = new Headers();
  for (const name of PASSED_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) {
      headers.set(name, value);
    }
  }
  // The site's session cookies, for the visitor's browser.
  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append('set-cookie', cookie);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

export const Route = createFileRoute('/api/v1/$')({
  server: {
    handlers: {
      GET: ({ request }) => forward(request),
      POST: ({ request }) => forward(request),
      DELETE: ({ request }) => forward(request),
    },
  },
});
