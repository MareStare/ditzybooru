/**
 * Signing in to the site through our API.
 *
 * The site's own session cookie is what signs the visitor in. The backend
 * passes it through to the browser on our domain, and the browser sends it back
 * with every call, so nothing about the visitor is kept on our side.
 */

import { get, post, remove } from '#/lib/api/backend/client';
import { HttpError } from '#/lib/http/http-client';

/** Who the visitor is on the site. */
export interface Session {
  signedIn: boolean;
  id: null | number;
  name: null | string;
  slug: null | string;
  role: null | string;
  /** The password was right, but the site still wants the 2FA code. */
  secondFactorRequired: boolean;
}

export interface SignInParams {
  email: string;
  password: string;
  rememberMe: boolean;
  /** What the captcha widget gave the browser, when the site asks for one. */
  captchaToken: null | string;
}

/** The site turned the sign-in down. `message` is its own words about why. */
export class SignInRejected extends Error {}

export function fetchSession(): Promise<Session> {
  return get<Session>('/session');
}

/** The captcha's site key, or `null` when the site asks for no captcha. */
export async function fetchLoginCaptcha(): Promise<null | string> {
  const { siteKey } = await get<{ siteKey: null | string }>('/session/captcha');
  return siteKey;
}

/** Turns the site's 422 into a {@link SignInRejected} with its own words; anything else passes. */
async function rejection(error: unknown): Promise<never> {
  if (error instanceof HttpError && error.response.status === 422) {
    const body = (await error.response.clone().json()) as { error?: { message?: string } };
    throw new SignInRejected(body.error?.message ?? 'The site turned this down.');
  }
  throw error;
}

/**
 * The first step. When the account has 2FA the answer has `secondFactorRequired`
 * and the visitor is not signed in yet: {@link signInWithCode} finishes it.
 */
export async function signIn({ email, password, rememberMe, captchaToken }: SignInParams): Promise<Session> {
  return post<Session>('/session', {
    email,
    password,
    rememberMe,
    ...(captchaToken === null ? {} : { captchaToken }),
  }).catch(rejection);
}

/** The second step, with the code from the visitor's authenticator (or a backup code). */
export async function signInWithCode(code: string, rememberMe: boolean): Promise<Session> {
  return post<Session>('/session/totp', { code, rememberMe }).catch(rejection);
}

export function signOut(): Promise<Session> {
  return remove<Session>('/session');
}
