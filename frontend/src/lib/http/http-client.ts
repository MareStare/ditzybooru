import { log } from '#/lib/http/logging';
import { retry } from '#/lib/http/retry';

export interface RequestParams extends Omit<RequestInit, 'headers'> {
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT' | 'QUERY';
  query?: Record<string, number | string>;
  headers?: Record<string, string>;
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
  constructor(private readonly baseUrl: string) {}

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
        const request = new Request(url, {
          ...init,
          headers: {
            ...headers,
            'X-Retry-Sequence-Id': retrySequenceId,
            'X-Request-Id': generateId('req-'),
            'X-Retry-Attempt': String(attempt),
          },
        });

        const response = await fetch(request);

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

class HttpError extends Error {
  override name = 'HttpError';
  response: Response;

  constructor(request: Request, response: Response) {
    super(`${request.method} ${request.url} request failed (${response.status}: ${response.statusText})`);
    this.response = response;
  }
}
