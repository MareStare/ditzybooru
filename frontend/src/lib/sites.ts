/**
 * The Philomena sites one instance can serve, and what each looks like.
 *
 * The incoming `Host` picks the site. The origin it reads from and its branding
 * (name, logo, default accent) come from, in order of priority: the config
 * file, what the live site says about itself, and a built-in default.
 *
 * This file is shared by the server and the browser, so it has no file access.
 * See `lib/sites.server.ts` for loading the config and the discovery cache.
 */

import { THEME_COLORS } from '#/lib/theme';
import type { ThemeColor } from '#/lib/theme';

export interface Site {
  /** The Philomena server the site reads from, with no trailing slash. */
  origin: string;
  /** What the site calls itself. */
  name: string;
  /** Absolute URL of the logo image, or `null` for the letter mark. */
  logo: string | null;
  /** The accent the site starts with, until a visitor picks another. */
  themeColor: ThemeColor;
}

/** One entry of the config file. Only `origin` is required. */
export interface SiteConfig extends Partial<Omit<Site, 'origin'>> {
  origin: string;
}

/** What a live site tells us about itself. Every field is optional. */
export type SiteBranding = Partial<Omit<Site, 'origin'>>;

/** The site every unknown host gets. */
const DEFAULT_ORIGIN = 'https://derpibooru.org';

/** Origins whose branding is known without asking them. The live site cannot
 *  always be read: Derpibooru's pages sit behind a bot challenge. */
const BUILT_IN_BRANDING: Record<string, Required<SiteBranding>> = {
  [DEFAULT_ORIGIN]: {
    name: 'Derpibooru',
    logo: 'https://derpicdn.net/favicon.svg',
    themeColor: 'blue',
  },
};

/** The hue each accent is closest to, in degrees. Gray is chosen by saturation. */
const ACCENT_HUES: Array<[ThemeColor, number]> = [
  ['red', 0],
  ['orange', 30],
  ['yellow', 55],
  ['green', 130],
  ['teal', 175],
  ['blue', 215],
  ['purple', 275],
  ['pink', 330],
];

/** Below this saturation (0-1) a color reads as gray, whatever its hue. */
const GRAY_SATURATION = 0.12;

function isThemeColor(value: unknown): value is ThemeColor {
  return THEME_COLORS.some(color => color.id === value);
}

/** The accent closest to a `#rrggbb` color, or `undefined` if it is not one. */
export function accentFromHex(hex: string): ThemeColor | undefined {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (match === null) {
    return undefined;
  }

  const [r = 0, g = 0, b = 0] = match.slice(1).map(part => parseInt(part, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (max === 0 || delta / max < GRAY_SATURATION) {
    return 'gray';
  }

  let hue: number;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  hue = (hue * 60 + 360) % 360;

  let best: ThemeColor = 'blue';
  let bestDistance = Infinity;
  for (const [color, accentHue] of ACCENT_HUES) {
    const difference = Math.abs(hue - accentHue);
    const distance = Math.min(difference, 360 - difference);
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  }
  return best;
}

/** The accent a `data-theme` name such as `dark-purple` refers to. */
export function accentFromThemeName(name: string): ThemeColor | undefined {
  const color = name
    .trim()
    .toLowerCase()
    .replace(/^(dark|light)-/, '');
  return isThemeColor(color) ? color : undefined;
}

/** `Host` header to bare lowercase hostname: no port, no trailing dot. */
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

function parseOrigin(value: unknown, where: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${where}: origin must be a string, got ${JSON.stringify(value)}`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${where}: origin ${JSON.stringify(value)} is not a URL`);
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`${where}: origin ${JSON.stringify(value)} must be http(s)://host with no path`);
  }
  return url.origin;
}

function parseLogo(value: unknown, where: string): string {
  if (typeof value !== 'string' || !/^https?:\/\//.test(value)) {
    throw new Error(`${where}: logo must be an absolute http(s) URL, got ${JSON.stringify(value)}`);
  }
  return value;
}

/**
 * Validates the parsed config file: `{ "<host>": "<origin>" }`, or an object in
 * place of the origin when the branding is set by hand too.
 */
export function parseSiteTable(raw: unknown): Map<string, SiteConfig> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('The sites file must be an object mapping hosts to sites');
  }

  const table = new Map<string, SiteConfig>();
  for (const [key, entry] of Object.entries(raw)) {
    const host = normalizeHost(key);
    const where = `Sites file, "${key}"`;
    if (!/^[a-z0-9.-]+$/.test(host)) {
      throw new Error(`${where}: the key must be a bare hostname`);
    }

    if (typeof entry === 'string') {
      table.set(host, { origin: parseOrigin(entry, where) });
      continue;
    }
    if (typeof entry !== 'object' || entry === null) {
      throw new Error(`${where}: expected an origin or an object, got ${JSON.stringify(entry)}`);
    }

    const { origin, name, logo, themeColor } = entry as Record<string, unknown>;
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      throw new Error(`${where}: name must be a non-empty string`);
    }
    if (themeColor !== undefined && !isThemeColor(themeColor)) {
      throw new Error(`${where}: themeColor must be one of ${THEME_COLORS.map(color => color.id).join(', ')}`);
    }
    table.set(host, {
      origin: parseOrigin(origin, where),
      ...(name === undefined ? {} : { name: name.trim() }),
      ...(logo === undefined ? {} : { logo: parseLogo(logo, where) }),
      ...(themeColor === undefined ? {} : { themeColor }),
    });
  }
  return table;
}

/**
 * The site for a host. `discovered` is what the live site said about the
 * origin, if anything has been read yet.
 *
 * Priority per field: config, discovered, built-in, then a plain fallback.
 */
export function resolveSite(
  host: string,
  table: ReadonlyMap<string, SiteConfig>,
  discovered: (origin: string) => SiteBranding | undefined,
): Site {
  const config = table.get(normalizeHost(host)) ?? { origin: DEFAULT_ORIGIN };
  const live = discovered(config.origin);
  const builtIn = BUILT_IN_BRANDING[config.origin];

  return {
    origin: config.origin,
    name: config.name ?? live?.name ?? builtIn?.name ?? new URL(config.origin).hostname,
    logo: config.logo ?? live?.logo ?? builtIn?.logo ?? null,
    themeColor: config.themeColor ?? live?.themeColor ?? builtIn?.themeColor ?? 'blue',
  };
}
