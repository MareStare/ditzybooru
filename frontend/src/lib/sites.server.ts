/**
 * Server side of `lib/sites`: the config file and the branding cache.
 *
 * Nothing here may wait on a live site. A request gets the best answer already
 * in memory, and a missing or old answer is refreshed in the background. The
 * answers are cached for a day and written to disk, so a restart or a deploy
 * does not ask the sites again.
 */

import { readFileSync } from 'node:fs';
import { rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { getRequestHost } from '@tanstack/react-start/server';

import { parseHomepage } from '#/lib/site-discovery';
import { parseSiteTable, resolveSite } from '#/lib/sites';
import type { Site, SiteBranding, SiteConfig } from '#/lib/sites';

/** How long a site's branding is used before it is read again. */
const BRANDING_TTL_MS = 24 * 60 * 60 * 1000;

/** How long to wait before asking a site again after it gave no usable answer. */
const MISS_RETRY_MS = 15 * 60 * 1000;

const FETCH_TIMEOUT_MS = 10_000;

interface CacheEntry {
  /** `undefined` while no usable answer has been read. */
  branding: SiteBranding | undefined;
  /** When this entry stops being fresh. */
  expiresAtMs: number;
}

/** The file is in the repository root, next to `package.json`. The server runs
 *  from `frontend/`. */
const SITES_FILE = process.env.SITES_FILE ?? resolve(process.cwd(), '..', 'sites.local.json');
const CACHE_FILE = join(dirname(SITES_FILE), '.site-cache.json');

let table: Map<string, SiteConfig> | undefined;
let cache: Map<string, CacheEntry> | undefined;
const inFlight = new Set<string>();

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    // Absent is normal, and so is a runtime with no files at all.
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      console.warn(`Could not read ${path}:`, error);
    }
    return undefined;
  }
}

function sites(): Map<string, SiteConfig> {
  if (table === undefined) {
    const raw = readJson(SITES_FILE);
    // A bad file must not take the site down, but it must be loud.
    try {
      table = raw === undefined ? new Map() : parseSiteTable(raw);
    } catch (error) {
      console.error(error);
      table = new Map();
    }
  }
  return table;
}

function brandingCache(): Map<string, CacheEntry> {
  if (cache === undefined) {
    cache = new Map();
    const raw = readJson(CACHE_FILE);
    if (typeof raw === 'object' && raw !== null) {
      for (const [origin, entry] of Object.entries(raw)) {
        const { branding, expiresAtMs } = entry as Partial<CacheEntry>;
        if (typeof expiresAtMs === 'number') {
          cache.set(origin, { branding, expiresAtMs });
        }
      }
    }
  }
  return cache;
}

/** Written whole to a temporary file and renamed, so a crash never leaves half. */
async function saveCache(): Promise<void> {
  try {
    const temporary = `${CACHE_FILE}.tmp`;
    await writeFile(temporary, JSON.stringify(Object.fromEntries(brandingCache())));
    await rename(temporary, CACHE_FILE);
  } catch (error) {
    console.warn(`Could not write ${CACHE_FILE}:`, error);
  }
}

async function readBranding(origin: string): Promise<SiteBranding | undefined> {
  const response = await fetch(origin, {
    headers: {
      Accept: 'text/html',
      'User-Agent': `ditzybooru/${import.meta.env.COMMIT_SHA} (${import.meta.env.COMMIT_DATE})`,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`${origin} answered ${response.status}`);
  }
  return parseHomepage(await response.text(), origin);
}

async function refresh(origin: string): Promise<void> {
  try {
    const branding = await readBranding(origin);
    const previous = brandingCache().get(origin)?.branding;
    // A failed read keeps the last good answer and tries again soon.
    brandingCache().set(origin, {
      branding: branding ?? previous,
      expiresAtMs: Date.now() + (branding === undefined ? MISS_RETRY_MS : BRANDING_TTL_MS),
    });
  } catch (error) {
    console.warn(`Could not read the branding of ${origin}:`, error);
    const entries = brandingCache();
    entries.set(origin, {
      branding: entries.get(origin)?.branding,
      expiresAtMs: Date.now() + MISS_RETRY_MS,
    });
  } finally {
    inFlight.delete(origin);
  }
  await saveCache();
}

/** What is known about the origin right now. Starts a refresh when the answer
 *  is missing or old, and still returns it at once. */
function discovered(origin: string): SiteBranding | undefined {
  const entry = brandingCache().get(origin);
  if ((entry === undefined || entry.expiresAtMs <= Date.now()) && !inFlight.has(origin)) {
    inFlight.add(origin);
    void refresh(origin);
  }
  return entry?.branding;
}

/** The site for the request being handled. */
export function requestSite(): Site {
  return resolveSite(getRequestHost(), sites(), discovered);
}
