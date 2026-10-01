import { beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '#/lib/http/logging';

describe('log', () => {
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

  beforeEach(() => {
    consoleErrorSpy.mockClear();
  });

  async function logged(request: Request, response: Response) {
    await log('error', request, response);
    return consoleErrorSpy.mock.calls[0];
  }

  it('should log the request and the response', async () => {
    const request = new Request('https://example.com/api', { headers: { 'X-Request-Id': 'req-1' } });
    const response = new Response('Oops', { status: 500, headers: { 'Content-Type': 'text/plain' } });

    expect(await logged(request, response)).toMatchInlineSnapshot(`
      [
        "HTTP GET https://example.com/api 500",
        {
          "body": "Oops",
          "headers": {
            "content-type": "text/plain",
          },
          "requestId": "req-1",
          "status": 500,
        },
      ]
    `);
  });

  it('should log only the allowed headers', async () => {
    const request = new Request('https://example.com/');
    const response = new Response('', {
      status: 500,
      headers: { 'CF-Ray': 'ray-1', 'X-Secret': 'hidden', 'Set-Cookie': 'session=abcdefghijkl' },
    });

    expect((await logged(request, response))?.[1]).toMatchObject({ headers: { 'cf-ray': 'ray-1' } });
    expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toMatch(/hidden|abcdefghijkl/);
  });

  it('should redact the secret header values in the body', async () => {
    const request = new Request('https://example.com/', {
      headers: {
        Authorization: 'Bearer token-1234567890',
        Cookie: 'session=cookie-1234567890; theme=dark',
      },
    });
    const response = new Response(
      [
        'auth: Bearer token-1234567890',
        'token: token-1234567890',
        'cookie: cookie-1234567890',
        'new cookie: set-cookie-1234567890',
        'short: dark',
      ].join('\n'),
      { status: 500, headers: { 'Set-Cookie': 'session=set-cookie-1234567890; Path=/; HttpOnly' } },
    );

    const body = ((await logged(request, response))?.[1] as { body: string }).body;

    expect(body).toMatchInlineSnapshot(`
      "auth: <redacted:authorization>
      token: <redacted:authorization>
      cookie: <redacted:cookie>
      new cookie: <redacted:set-cookie>
      short: dark"
    `);
  });

  it('should leave the response body readable', async () => {
    const response = new Response('Oops', { status: 500 });

    await log('error', new Request('https://example.com/'), response);

    await expect(response.text()).resolves.toBe('Oops');
  });
});
