/**
 * Where the Rust backend is, and whether this deploy may use it.
 *
 * - Node (self-hosted): on, at `API_BACKEND_URL` or the loopback port in
 *   `pm2.json`.
 * - Cloudflare Workers: OFF unless `API_PROXY=on` and `API_BACKEND_URL` are
 *   set as Worker variables. Every API call from a visitor is a Worker
 *   request, which counts against the account's quota, so this is the kill
 *   switch: set `API_PROXY` to `off` (or delete it) in the Cloudflare dashboard
 *   and the API is gone again at once, with no deploy.
 * - `vite dev`: on, at the same default. Override with `.dev.vars`.
 *
 * `API_BACKEND_AUTHORIZATION` is sent as the `Authorization` header, for a
 * backend behind basic auth.
 */

import { CLOUDFLARE_PRODUCTION } from '#/lib/deploy';

const LOOPBACK = 'http://127.0.0.1:3711';

/** The backend's base URL, or `undefined` while the API is switched off. */
export function backendUrl(): string | undefined {
  const setting = process.env.API_PROXY;
  const on = setting === undefined ? !CLOUDFLARE_PRODUCTION : setting === 'on';
  if (!on) {
    return undefined;
  }
  // A Worker cannot reach a loopback address, so it needs a real URL.
  return process.env.API_BACKEND_URL ?? (CLOUDFLARE_PRODUCTION ? undefined : LOOPBACK);
}

/** Headers every request to the backend carries. */
export function backendHeaders(): Record<string, string> {
  const authorization = process.env.API_BACKEND_AUTHORIZATION;
  return authorization === undefined ? {} : { Authorization: authorization };
}
