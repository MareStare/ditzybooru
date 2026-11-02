/**
 * Reads a Philomena site's branding off its home page.
 *
 * Philomena has no API for this, but its pages carry a `<title>`, a
 * `theme-color` meta tag, a `data-theme` on `<body>` and a favicon link. The
 * parsing is kept apart from the fetching (`lib/sites.server.ts`) so it can be
 * tested against saved pages.
 */

import { accentFromHex, accentFromThemeName } from '#/lib/sites';
import type { SiteBranding } from '#/lib/sites';

/** Only the head and the start of the body matter. */
const MAX_HTML_LENGTH = 64 * 1024;

function attribute(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match === null ? undefined : (match[1] ?? match[2] ?? match[3]);
}

function tags(html: string, name: string): Array<string> {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? [];
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'");
}

/** The site's own name out of a title like `Homepage - Furbooru`: the part that
 *  appears in the hostname, or else the last part. */
function nameFromTitle(title: string, hostname: string): string | undefined {
  const parts = decodeEntities(title)
    .split(/\s[-|–—]\s/)
    .map(part => part.trim())
    .filter(part => part !== '');
  const compactHost = hostname.toLowerCase();
  const match = parts.find(part => compactHost.includes(part.toLowerCase().replace(/\s+/g, '')));
  return match ?? parts[parts.length - 1];
}

/** A bot challenge looks like a page but says nothing about the site. */
function isChallenge(html: string): boolean {
  return /anubis|cf-challenge|just a moment/i.test(html) || /<meta[^>]*name=["']robots["'][^>]*noindex/i.test(html);
}

/**
 * What the page says about the site, or `undefined` when it is not the site's
 * own page (a challenge or an error) and so says nothing worth keeping.
 */
export function parseHomepage(html: string, origin: string): SiteBranding | undefined {
  const head = html.slice(0, MAX_HTML_LENGTH);
  if (isChallenge(head)) {
    return undefined;
  }

  const branding: SiteBranding = {};

  const siteName = tags(head, 'meta')
    .filter(tag => attribute(tag, 'property') === 'og:site_name')
    .map(tag => attribute(tag, 'content'))
    .find(content => content !== undefined && content.trim() !== '');
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(head)?.[1];
  const name = siteName ?? (title === undefined ? undefined : nameFromTitle(title, new URL(origin).hostname));
  if (name !== undefined && name.trim() !== '') {
    branding.name = decodeEntities(name).trim();
  }

  const themeColor = tags(head, 'meta')
    .filter(tag => attribute(tag, 'name')?.toLowerCase() === 'theme-color')
    .map(tag => attribute(tag, 'content'))
    .find(content => content !== undefined);
  const dataTheme = /<body\b[^>]*\sdata-theme\s*=\s*["']([^"']+)["']/i.exec(head)?.[1];
  const accent =
    (dataTheme === undefined ? undefined : accentFromThemeName(dataTheme)) ??
    (themeColor === undefined ? undefined : accentFromHex(themeColor));
  if (accent !== undefined) {
    branding.themeColor = accent;
  }

  const icons = tags(head, 'link').filter(tag => /\bicon\b/i.test(attribute(tag, 'rel') ?? ''));
  const icon =
    icons.find(tag => /svg/i.test(attribute(tag, 'type') ?? '') || /\.svg(\?|$)/i.test(attribute(tag, 'href') ?? '')) ??
    icons[0];
  const href = icon === undefined ? undefined : attribute(icon, 'href');
  if (href !== undefined) {
    try {
      branding.logo = new URL(decodeEntities(href), origin).href;
    } catch {
      // A broken link is no logo.
    }
  }

  return Object.keys(branding).length === 0 ? undefined : branding;
}
