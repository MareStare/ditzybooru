import { log } from '#/lib/http/logging';
import { retry } from '#/lib/http/retry';

export interface RequestParams extends Omit<RequestInit, 'headers'> {
  method?: 'DELETE' | 'GET' | 'POST' | 'PUT' | 'QUERY';
  query?: Record<string, number | string>;
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  constructor(
    request: Request,
    readonly response: Response,
  ) {
    super(`${request.method} ${request.url} request failed (${response.status}: ${response.statusText})`);
  }
}

/**
 * An HTTP client that renders query parameters, throws on a non-OK response,
 * logs it, retries server errors, and adds headers to trace the retries.
 */
export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  /** Issues a request, expecting a JSON response. */
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

    // Identifies all retries of one request, so that the backend can apply
    // its side effects only once.
    const retrySequenceId = generateId('rs-');

    return retry(
      async attempt => {
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

/** Base32 alphabet without ambiguous characters. */
const ID_ALPHABET = '23456789abcdefghjklmnpqrstuvwxyz';

/**
 * A random ID that starts with `prefix`, so a reader of the logs sees its
 * kind. 20 random characters make it long enough for Phoenix to reuse it.
 */
function generateId(prefix: string): string {
  const chars = Array.from({ length: 20 }, () => ID_ALPHABET.charAt(Math.floor(Math.random() * ID_ALPHABET.length)));
  return prefix + chars.join('');
}
