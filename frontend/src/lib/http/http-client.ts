import { timeAgo } from '#/lib/format';
import { log } from '#/lib/http/logging';
import { retry } from '#/lib/http/retry';

export interface RequestParams extends Omit<RequestInit, 'headers'> {
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT' | 'QUERY';
  query?: Record<string, number | string>;
  headers?: Record<string, string>;
}

export interface HttpClientParams {
  /**
   * Adds the `X-Request-Id` and `X-Retry-*` headers to every request. These
   * headers trigger a CORS preflight. Disable them for an origin that does not
   * allow them. Default: `true`.
   */
  tracingHeaders?: boolean;
}

/**
 * Generic HTTP Client with some batteries included:
 *
 * - Handles rendering of the URL with query parameters
 * - Throws an error on non-OK responses
 * - Logs non-OK responses
 * - Automatically retries failed requests
 * - Add some useful meta headers
 * - ...Some other method-specific goodies
 */
export class HttpClient {
  /** The origin answered 429. The client sends no requests until this time. */
  private rateLimitedUntilMs = 0;

  constructor(
    private readonly baseUrl: string,
    private readonly params: HttpClientParams = {},
  ) {}

  /**
   * Issues a request, expecting a JSON response.
   */
  async fetchJson<T>(path: string, params?: RequestParams): Promise<T> {
    const response = await this.fetch(path, params);
    return (await response.json()) as T;
  }

  async fetch(path: string, params: RequestParams = {}): Promise<Response> {
    const { query = {}, headers = {}, ...init } = params;

    const url = new URL(path, this.baseUrl);

    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value));
    }

    // This header serves as an idempotency token that identifies the sequence
    // of retries of the same request. The backend may use this information to
    // ensure that the same retried request doesn't result in multiple accumulated
    // side-effects.
    const retrySequenceId = generateId('rs-');

    return retry(
      async (attempt: number) => {
        const tracingHeaders = {
          'X-Retry-Sequence-Id': retrySequenceId,
          'X-Request-Id': generateId('req-'),
          'X-Retry-Attempt': String(attempt),
        };

        const request = new Request(url, {
          ...init,
          headers: this.params.tracingHeaders === false ? headers : { ...headers, ...tracingHeaders },
        });

        if (Date.now() < this.rateLimitedUntilMs) {
          throw new RateLimitedError(request, this.rateLimitedUntilMs);
        }

        const response = await fetch(request).catch((error: unknown) => {
          // `fetch` rejects with a `TypeError` when there is no response.
          throw error instanceof TypeError ? new NetworkError(request, error) : error;
        });

        if (response.status === 429) {
          this.rateLimitedUntilMs = Date.now() + retryAfterMs(response);
        }

        if (!response.ok) {
          await log('error', request, response);
          throw new HttpError(request, response);
        }

        return response;
      },
      { isRetryable, label: `HTTP ${init.method ?? 'GET'} ${url.toString()}` },
    );
  }
}

const DEFAULT_RETRY_AFTER_MS = 10_000;

/** Reads `Retry-After`. It holds seconds or an HTTP date. */
function retryAfterMs(response: Response): number {
  const value = response.headers.get('Retry-After');
  if (value === null) {
    return DEFAULT_RETRY_AFTER_MS;
  }
  const seconds = Number(value);
  const ms = Number.isNaN(seconds) ? Date.parse(value) - Date.now() : seconds * 1000;
  return Number.isNaN(ms) ? DEFAULT_RETRY_AFTER_MS : Math.max(0, ms);
}

function isRetryable(error: Error): boolean {
  return error instanceof HttpError && error.response.status >= 500;
}

/**
 * Generates a base32 ID with the given prefix as the ID discriminator.
 * The prefix is useful when reading or grepping thru logs to identify the type
 * of the ID (i.e. it's visually clear that strings that start with `req-` are
 * request IDs).
 */
function generateId(prefix: string) {
  // Base32 alphabet without any ambiguous characters.
  // (details: https://github.com/maksverver/key-encoding#eliminating-ambiguous-characters)
  const alphabet = '23456789abcdefghjklmnpqrstuvwxyz';

  const chars = [prefix];

  // Phoenix reuses an incoming `X-Request-Id` only if it is 20-200 bytes long.
  for (let i = 0; i < 20; i++) {
    chars.push(alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
  }

  return chars.join('');
}

export class HttpError extends Error {
  override name = 'HttpError';
  response: Response;

  constructor(request: Request, response: Response) {
    super(`Request failed (${response.status}: ${response.statusText}): ${request.method} ${request.url}`);
    this.response = response;
  }
}

/**
 * A request got no response. The cause can be a network failure, or a CORS
 * error: a browser hides a cross-origin response without
 * `Access-Control-Allow-Origin`, even for an error status.
 */
class NetworkError extends Error {
  override name = 'NetworkError';

  constructor(request: Request, cause: TypeError) {
    super(`Request got no response (network or CORS error): ${request.method} ${request.url}`, { cause });
  }
}

/** The client did not send the request, because the origin answered 429 before. */
class RateLimitedError extends Error {
  override name = 'RateLimitedError';

  constructor(request: Request, untilMs: number) {
    const until = new Date(untilMs);
    super(
      `Rate limited, the next request goes ${timeAgo(until)} (${until.toISOString()}). Request not sent: ${request.method} ${request.url}`,
    );
  }
}
