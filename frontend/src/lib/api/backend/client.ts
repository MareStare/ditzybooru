/**
 * The HTTP client for our own `/api/v1`, served by the Rust backend.
 *
 * The browser calls it on its own origin. The server reaches the backend
 * directly and forwards the site's `Host` as `X-Forwarded-Host`, which is how
 * the backend picks the Philomena to read from.
 */

import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHost } from '@tanstack/react-start/server';

import { backendHeaders, backendUrl } from '#/lib/api/backend/backend.server';
import { HttpClient } from '#/lib/http/http-client';
import type { RequestParams } from '#/lib/http/http-client';

let client: HttpClient | undefined;

/** The server calls the backend directly, the browser calls its own origin. */
const serverBase = createIsomorphicFn()
  .server((): string => {
    const base = backendUrl();
    if (base === undefined) {
      throw new Error('The API is switched off on this deploy (see backend.server.ts)');
    }
    return base;
  })
  .client((): string => window.location.origin);

function backend(): HttpClient {
  client ??= new HttpClient(serverBase());
  return client;
}

const requestHeaders = createIsomorphicFn()
  .server((): Record<string, string> => ({
    Accept: 'application/json',
    'X-Forwarded-Host': getRequestHost(),
    ...backendHeaders(),
  }))
  .client((): Record<string, string> => ({ Accept: 'application/json' }));

export type QueryParams = NonNullable<RequestParams['query']>;

/** `GET /api/v1<path>`. */
export function get<TResponse>(path: string, query: QueryParams = {}): Promise<TResponse> {
  return backend().fetchJson<TResponse>(`/api/v1${path}`, { query, headers: requestHeaders() });
}
