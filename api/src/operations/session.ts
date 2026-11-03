import type { FieldSpec } from '../dsl/extract.ts';
import { defineOperation } from '../dsl/operation.ts';
import { s } from '../dsl/schema.ts';

/** `.js-datastore` is the one element every page carries the signed-in state on. */
function user(attr: string, as?: FieldSpec['as']): FieldSpec {
  return { sel: '.js-datastore', attr: `data-user-${attr}`, optional: true, ...(as ? { as } : {}) };
}

/** Who the visitor is, as any page of the site tells it. */
const sessionFields = {
  signedIn: { sel: '.js-datastore', attr: 'data-user-is-signed-in', as: 'bool' },
  id: user('id', 'int'),
  name: user('name'),
  slug: user('slug'),
  role: user('role'),
  // The picture the site shows in its header for them; none when they have not set one.
  avatarUrl: { sel: '.avatar--28px img', attr: 'src', as: 'url', optional: true },
  // Signed in with a password, but the site wants the 2FA code before it lets them in.
  secondFactorRequired: { sel: 'form[action="/sessions/totp"]', exists: true },
} satisfies Record<string, FieldSpec>;

/** Philomena says why a form was turned down in flash messages and inline alerts. */
const REJECTION = '.flash--warning, .flash--danger, .flash--error, .alert';

/** What `createSession` answers when the password was right and a 2FA code is still needed. */
const SECOND_FACTOR_ANSWER = {
  signedIn: false,
  id: null,
  name: null,
  slug: null,
  role: null,
  avatarUrl: null,
  secondFactorRequired: true,
};

const TOKEN = { sel: 'meta[name=csrf-token]', attr: 'content' };

/** Who the visitor is. Needs their session cookie, which the browser sends. */
export const getSession = defineOperation({
  operationId: 'getSession',
  path: '/session',
  method: 'get',
  summary: 'Who the visitor is on the site: signed out, or the user they are signed in as.',
  tags: ['session'],
  params: [],
  response: s.ref('Session'),
  examples: {},
  philomena: {
    routes: ['GET /'],
    auth: 'session',
    strategies: [
      {
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/' },
        template: 'lib/philomena_web/templates/layout/app.html.slime',
        select: { fields: sessionFields },
      },
    ],
  },
});

/** What the login form needs from the browser: the captcha's site key. */
export const getLoginCaptcha = defineOperation({
  operationId: 'getLoginCaptcha',
  path: '/session/captcha',
  method: 'get',
  summary: 'The captcha the site asks for at sign-in, so the browser can show it.',
  tags: ['session'],
  params: [],
  response: s.ref('LoginCaptcha'),
  examples: {},
  philomena: {
    routes: ['GET /sessions/new'],
    auth: 'none',
    cacheSeconds: 3600,
    strategies: [
      {
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/sessions/new' },
        template: 'lib/philomena_web/templates/session/new.html.slime',
        select: { fields: { siteKey: { sel: '.js-captcha', attr: 'data-sitekey', optional: true } } },
      },
    ],
  },
});

export const createSession = defineOperation({
  operationId: 'createSession',
  path: '/session',
  method: 'post',
  summary: 'Sign in. The site sets its session cookie, which is passed on to the browser.',
  tags: ['session'],
  body: s.object({
    email: s.string(),
    password: s.string(),
    rememberMe: s.optional(s.bool()),
    /** What the captcha widget gave the browser, when the site asks for a captcha. */
    captchaToken: s.optional(s.string()),
  }),
  response: s.ref('Session'),
  philomena: {
    routes: ['POST /sessions', 'GET /sessions/new'],
    auth: 'session',
    strategies: [
      {
        kind: 'form',
        flavors: ['philomena', 'furbooru'],
        form: { page: '/sessions/new', csrf: TOKEN },
        request: {
          method: 'POST',
          path: '/sessions',
          body: {
            'user[email]': '{email}',
            'user[password]': '{password}',
            'user[remember_me]': '{rememberMe|false}',
            'h-captcha-response': '{captchaToken}',
          },
        },
        // A user with 2FA is signed in only after the code: the site sends them to its form.
        result: {
          page: '/',
          select: { fields: sessionFields },
          must: ['/signedIn'],
          redirects: { '/sessions/totp/new': { ...SECOND_FACTOR_ANSWER } },
          errors: REJECTION,
        },
      },
    ],
  },
});

/** The second step of a sign-in for a user with 2FA. Needs the cookie the first step set. */
export const createSessionTotp = defineOperation({
  operationId: 'createSessionTotp',
  path: '/session/totp',
  method: 'post',
  summary: 'Finish signing in with the 2FA code, after `createSession` answered `secondFactorRequired`.',
  tags: ['session'],
  body: s.object({
    code: s.string(),
    /** Whether the site should remember this device for the code. */
    rememberMe: s.optional(s.bool()),
  }),
  response: s.ref('Session'),
  philomena: {
    routes: ['POST /sessions/totp', 'GET /sessions/totp/new'],
    auth: 'session',
    strategies: [
      {
        kind: 'form',
        flavors: ['philomena', 'furbooru'],
        // This page has no meta tag, only the form's own hidden field.
        form: { page: '/sessions/totp/new', csrf: { sel: 'input[name=_csrf_token]', attr: 'value' } },
        request: {
          method: 'POST',
          path: '/sessions/totp',
          body: { 'user[twofactor_token]': '{code}', 'user[remember_me]': '{rememberMe|false}' },
        },
        result: { page: '/', select: { fields: sessionFields }, must: ['/signedIn'], errors: REJECTION },
      },
    ],
  },
});

/** The visitor's API key, which the site shows to them on their account page. */
export const getApiKey = defineOperation({
  operationId: 'getApiKey',
  path: '/session/api-key',
  method: 'get',
  summary: "The signed-in visitor's own API key, read from their account page.",
  tags: ['session'],
  params: [],
  response: s.ref('ApiKey'),
  examples: {},
  philomena: {
    routes: ['GET /registrations/edit'],
    auth: 'session',
    strategies: [
      {
        kind: 'html',
        flavors: ['philomena', 'furbooru'],
        request: { method: 'GET', path: '/registrations/edit' },
        template: 'lib/philomena_web/templates/registration/edit.html.slime',
        select: { fields: { apiKey: { sel: '#api-key code', text: true } } },
      },
    ],
  },
});

export const deleteSession = defineOperation({
  operationId: 'deleteSession',
  path: '/session',
  method: 'delete',
  summary: 'Sign out.',
  tags: ['session'],
  response: s.ref('Session'),
  philomena: {
    routes: ['DELETE /sessions'],
    auth: 'session',
    strategies: [
      {
        kind: 'form',
        flavors: ['philomena', 'furbooru'],
        form: { page: '/', csrf: TOKEN },
        request: { method: 'DELETE', path: '/sessions' },
        // The login link is back in the header.
        result: {
          page: '/',
          select: { fields: { ...sessionFields, anonymous: { sel: 'a[href="/sessions/new"]', exists: true } } },
          must: ['/anonymous'],
          errors: REJECTION,
        },
      },
    ],
  },
});
