/**
 * The visitor's own Philomena API key, which is what signs them in.
 *
 * Philomena's sign-in needs a captcha solved in the browser, so the key from
 * the account settings is the way in: the browser keeps it and sends it to our
 * API in `X-Api-Key`, and the backend passes it on to the site. It lives in
 * `localStorage` rather than the settings cookie on purpose: a cookie would
 * ride on every request, static assets included, and reach the server render.
 * Only the browser ever has it.
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ditzy-api-key';

const listeners = new Set<() => void>();

/** The saved key, or `null`. Always `null` on the server. */
export function getApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // No `localStorage` on the server, or blocked in the browser.
    return null;
  }
}

/** Saves `key`, or forgets it when `null`. */
export function setApiKey(key: string | null): void {
  try {
    if (key === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, key);
    }
  } catch {
    // Storage is blocked: the key lasts until the page is closed, nowhere.
  }
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab saved or removed the key.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      listener();
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** The saved key, kept current. `null` on the server and until hydration. */
export function useApiKey(): string | null {
  return useSyncExternalStore(subscribe, getApiKey, () => null);
}

/**
 * A short stand-in for the key that is safe to put in a query key: it tells
 * one key from another without the key itself sitting in the query cache.
 */
export function apiKeyFingerprint(key: string): string {
  let hash = 5381;
  for (const char of key) {
    hash = Math.imul(hash, 33) ^ (char.codePointAt(0) ?? 0);
  }

  return (hash >>> 0).toString(36);
}
