/**
 * The HTTP client for the Philomena REST API.
 *
 * The server and the browser both use it. Philomena allows any origin, but its
 * CORS config does not allow our tracing headers. Thus, the browser sends none.
 */

import { HttpClient } from '#/lib/http/http-client';
import type { RequestParams } from '#/lib/http/http-client';

/** The Philomena server the site reads from. TODO: make this configurable so
 *  the frontend can be self-hosted against another instance. */
const API_ORIGIN = 'https://derpibooru.org';

const http = new HttpClient(API_ORIGIN, { tracingHeaders: import.meta.env.SSR });

/** Browsers do not let a page set `User-Agent`. */
const headers: Record<string, string> = import.meta.env.SSR
  ? {
      Accept: 'application/json',
      'User-Agent': `ditzybooru/${import.meta.env.COMMIT_SHA} (${import.meta.env.COMMIT_DATE}; +https://ditzybooru.org)`,
    }
  : { Accept: 'application/json' };

export type QueryParams = NonNullable<RequestParams['query']>;

export function get<TResponse>(path: string, query: QueryParams): Promise<TResponse> {
  return http.fetchJson<TResponse>(`/api/v1/json/${path}`, { query, headers });
}
