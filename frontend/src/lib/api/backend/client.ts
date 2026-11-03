/**
 * The HTTP client for our own `/api/v1`, served by the Rust backend.
 *
 * The browser calls it on its own origin. The server reaches the backend
 * directly and forwards the site's `Host` as `X-Forwarded-Host`, which is how
 * the backend picks the Philomena to read from.
 */

import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHost } from '@tanstack/react-start/server';

import { getApiKey } from '#/lib/api/api-key';
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

interface GetOptions {
  /**
   * Sends the visitor's saved Philomena API key (browser only), for the
   * endpoints that act for a signed-in user. Pass a string to use that key
   * instead, to try one before saving it.
   */
  apiKey?: true | string;
  /** Asks the origin again instead of trusting what the browser kept. */
  fresh?: boolean;
}

/** `GET /api/v1<path>`. */
export function get<TResponse>(
  path: string,
  query: QueryParams = {},
  { apiKey, fresh }: GetOptions = {},
): Promise<TResponse> {
  const headers = requestHeaders();
  if (apiKey !== undefined) {
    const key = apiKey === true ? getApiKey() : apiKey;
    if (key === null) {
      return Promise.reject(new Error('There is no API key saved'));
    }
    headers['X-Api-Key'] = key;
  }

  return backend().fetchJson<TResponse>(`/api/v1${path}`, {
    query,
    headers,
    ...(fresh === true ? { cache: 'no-cache' } : {}),
  });
}

/** A request with a JSON body, for the endpoints that change something. The browser sends its cookies. */
function send<TResponse>(method: 'POST' | 'DELETE', path: string, body?: object): Promise<TResponse> {
  const headers = requestHeaders();
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return backend().fetchJson<TResponse>(`/api/v1${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** `POST /api/v1<path>` with a JSON body. */
export function post<TResponse>(path: string, body: object): Promise<TResponse> {
  return send<TResponse>('POST', path, body);
}

/** `DELETE /api/v1<path>`. */
export function remove<TResponse>(path: string): Promise<TResponse> {
  return send<TResponse>('DELETE', path);
}
