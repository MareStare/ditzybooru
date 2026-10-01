/**
 * The HTTP client for the Philomena REST API.
 *
 * Server-only. Philomena sends no `Access-Control-Allow-Origin`, so a browser
 * blocks these requests. `source.functions.ts` exposes the calls to the
 * browser over server functions.
 */

import { HttpClient } from '#/lib/http/http-client';
import type { RequestParams } from '#/lib/http/http-client';

/** The Philomena server the site reads from. TODO: make this configurable so
 *  the frontend can be self-hosted against another instance. */
const API_ORIGIN = 'https://derpibooru.org';

const http = new HttpClient(API_ORIGIN);

export type QueryParams = NonNullable<RequestParams['query']>;

export function get<TResponse>(path: string, query: QueryParams): Promise<TResponse> {
  return http.fetchJson<TResponse>(`/api/v1/json/${path}`, { query, headers: { Accept: 'application/json' } });
}
