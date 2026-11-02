/**
 * The HTTP client for our own `/api/v1`, served by the Rust backend.
 *
 * The browser calls it on its own origin. The server reaches the backend
 * directly and forwards the site's `Host` as `X-Forwarded-Host`, which is how
 * the backend picks the Philomena to read from.
 */

import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHost } from '@tanstack/react-start/server';

import { HttpClient } from '#/lib/http/http-client';
import type { RequestParams } from '#/lib/http/http-client';

let client: HttpClient | undefined;

function backend(): HttpClient {
  if (client === undefined) {
    // `API_BACKEND_URL` is also what `api-proxy.ts` reads; the default is the
    // port in `pm2.json`.
    const base = import.meta.env.SSR
      ? (process.env.API_BACKEND_URL ?? 'http://127.0.0.1:3711')
      : window.location.origin;
    client = new HttpClient(base);
  }
  return client;
}

const requestHeaders = createIsomorphicFn()
  .server((): Record<string, string> => ({
    Accept: 'application/json',
    'X-Forwarded-Host': getRequestHost(),
  }))
  .client((): Record<string, string> => ({ Accept: 'application/json' }));

export type QueryParams = NonNullable<RequestParams['query']>;

/** `GET /api/v1<path>`. */
export function get<TResponse>(path: string, query: QueryParams = {}): Promise<TResponse> {
  return backend().fetchJson<TResponse>(`/api/v1${path}`, { query, headers: requestHeaders() });
}
