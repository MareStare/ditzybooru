import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '#/lib/http/http-client';

const BASE_URL = 'https://example.com';

describe('HttpClient', () => {
  const fetchMock = vi.fn<(request: Request) => Promise<Response>>();

  function requests(): Array<Request> {
    return fetchMock.mock.calls.map(([request]) => request);
  }

  beforeAll(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
  });

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('should throw an HttpError on non-OK responses', async () => {
    const client = new HttpClient(BASE_URL);

    fetchMock.mockResolvedValue(new Response('Not Found', { status: 404, statusText: 'Not Found' }));

    await expect(client.fetch('/')).rejects.toThrow(/404: Not Found/);

    // 404 is non-retryable
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('should retry 500 errors', async () => {
    const client = new HttpClient(BASE_URL);

    fetchMock
      .mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' }),
      )
      .mockResolvedValueOnce(new Response('OK', { status: 200, statusText: 'OK' }));

    const promise = client.fetch('/');
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toMatchObject({ status: 200, statusText: 'OK' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should not retry AbortError', async () => {
    const client = new HttpClient(BASE_URL);

    fetchMock.mockImplementation(request => {
      request.signal.throwIfAborted();
      return Promise.resolve(new Response('OK'));
    });

    const abortController = new AbortController();
    abortController.abort();

    await expect(client.fetch('/', { signal: abortController.signal })).rejects.toThrow('This operation was aborted');

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('should render the URL with query parameters', async () => {
    const client = new HttpClient(BASE_URL);

    fetchMock.mockResolvedValue(new Response('OK'));

    await client.fetch('/api/search', { query: { q: 'safe, cute', page: 2 } });

    expect(requests()[0]?.url).toBe('https://example.com/api/search?q=safe%2C+cute&page=2');
  });

  it('should add the retry tracing headers', async () => {
    const client = new HttpClient(BASE_URL);

    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(new Response('OK'));

    const promise = client.fetch('/', { headers: { Accept: 'application/json' } });
    await vi.runAllTimersAsync();
    await promise;

    const [first, second] = requests().map(request => Object.fromEntries(request.headers));

    expect(first).toMatchObject({ accept: 'application/json', 'x-retry-attempt': '1' });
    expect(second).toMatchObject({ accept: 'application/json', 'x-retry-attempt': '2' });

    // Phoenix reuses an incoming request ID only if it is 20-200 bytes long.
    expect(first?.['x-request-id']).toMatch(/^req-[2-9a-hj-np-z]{20}$/);
    expect(first?.['x-retry-sequence-id']).toMatch(/^rs-[2-9a-hj-np-z]{20}$/);

    expect(second?.['x-request-id']).not.toBe(first?.['x-request-id']);
    expect(second?.['x-retry-sequence-id']).toBe(first?.['x-retry-sequence-id']);
  });

  it('should not mutate the request params', async () => {
    const client = new HttpClient(BASE_URL);

    fetchMock.mockResolvedValue(new Response('OK'));

    const params = { headers: { Accept: 'application/json' } };
    await client.fetch('/', params);

    expect(params).toEqual({ headers: { Accept: 'application/json' } });
  });

  it('should parse a JSON response', async () => {
    const client = new HttpClient(BASE_URL);

    fetchMock.mockResolvedValue(Response.json({ images: [] }));

    await expect(client.fetchJson('/')).resolves.toEqual({ images: [] });
  });

  it('should log non-OK responses', async () => {
    const client = new HttpClient(BASE_URL);

    fetchMock.mockResolvedValue(new Response('Not Found', { status: 404 }));

    await expect(client.fetch('/missing')).rejects.toThrow();

    expect(console.error).toHaveBeenCalledWith(
      'HTTP GET https://example.com/missing 404',
      expect.objectContaining({ status: 404, body: 'Not Found' }),
    );
  });
});
