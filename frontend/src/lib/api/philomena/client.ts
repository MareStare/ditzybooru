/**
 * The HTTP client for the Philomena REST API.
 *
 * The server and the browser both use it. Philomena allows any origin, but its
 * CORS config does not allow our tracing headers. Thus, the browser sends none.
 */

import { HttpClient } from '#/lib/http/http-client';
import type { RequestParams } from '#/lib/http/http-client';
import { currentSite } from '#/lib/current-site';

/** One client per origin, so a rate limit on one site does not stop the others. */
const clients = new Map<string, HttpClient>();

function clientFor(origin: string): HttpClient {
  let client = clients.get(origin);
  if (client === undefined) {
    client = new HttpClient(origin, { tracingHeaders: import.meta.env.SSR });
    clients.set(origin, client);
  }
  return client;
}

/** Browsers do not let a page set `User-Agent`. */
const headers: Record<string, string> = import.meta.env.SSR
  ? {
      Accept: 'application/json',
      'User-Agent': `ditzybooru/${import.meta.env.COMMIT_SHA} (${import.meta.env.COMMIT_DATE}; +https://ditzybooru.org)`,
    }
  : { Accept: 'application/json' };

export type QueryParams = NonNullable<RequestParams['query']>;

export function get<TResponse>(path: string, query: QueryParams): Promise<TResponse> {
  return clientFor(currentSite().origin).fetchJson<TResponse>(`/api/v1/json/${path}`, { query, headers });
}
