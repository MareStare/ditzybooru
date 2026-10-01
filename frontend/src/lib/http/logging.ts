/** Response headers that never hold secrets and help to debug. */
const LOGGED_HEADERS = new Set([
  'cache-control',
  'cf-cache-status',
  'cf-mitigated',
  'cf-ray',
  'content-length',
  'content-type',
  'date',
  'location',
  'retry-after',
  'server',
  'via',
  'x-request-id',
]);

/** A secret shorter than this is too likely to match unrelated text. */
const MIN_SECRET_LENGTH = 8;

/** Cookie values of a `Cookie` header or of one `Set-Cookie` header. */
function cookieValues(header: string, isSetCookie: boolean): Array<string> {
  const pairs = header.split(';');
  return (isSetCookie ? pairs.slice(0, 1) : pairs).map(pair => pair.slice(pair.indexOf('=') + 1).trim());
}

/** Secret values of the headers, each with the name of its header. */
function headerSecrets(headers: Headers): Array<{ name: string; secret: string }> {
  const authorization = headers.get('authorization') ?? '';
  const secrets = [
    ...[authorization, ...authorization.split(' ').slice(1)].map(secret => ({ name: 'authorization', secret })),
    ...cookieValues(headers.get('cookie') ?? '', false).map(secret => ({ name: 'cookie', secret })),
    ...headers
      .getSetCookie()
      .flatMap(header => cookieValues(header, true))
      .map(secret => ({ name: 'set-cookie', secret })),
  ];
  return secrets.filter(({ secret }) => secret.length >= MIN_SECRET_LENGTH);
}

/** Replaces every secret header value in `body` with the name of its header. */
function redactSecrets(body: string, ...headerSets: Array<Headers>): string {
  const secrets = headerSets.flatMap(headerSecrets);

  // Longest first, so a part never breaks the match of its whole value.
  secrets.sort((a, b) => b.secret.length - a.secret.length);

  return secrets.reduce((text, { name, secret }) => text.split(secret).join(`<redacted:${name}>`), body);
}

type LogLevel = 'debug' | 'error' | 'info' | 'warn';

/**
 * Logs a request with its response, for debugging. Reads a clone of the body,
 * so the caller can still read the response. Leaves out every secret.
 */
export async function log(level: LogLevel, request: Request, response: Response): Promise<void> {
  console[level](`HTTP ${response.status} ${request.method} ${request.url}`, {
    requestId: request.headers.get('x-request-id'),
    status: response.status,
    headers: Object.fromEntries([...response.headers].filter(([name]) => LOGGED_HEADERS.has(name))),
    body: redactSecrets(await response.clone().text(), request.headers, response.headers),
  });
}
