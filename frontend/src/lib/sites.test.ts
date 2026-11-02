import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseHomepage } from '#/lib/site-discovery';
import { accentFromHex, accentFromThemeName, normalizeHost, parseSiteTable, resolveSite } from '#/lib/sites';

const fixture = (name: string): string => readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');

describe('normalizeHost', () => {
  it('drops the port, the case and a trailing dot', () => {
    expect(normalizeHost('Furb.Example.org:8443')).toBe('furb.example.org');
    expect(normalizeHost('furb.example.org.')).toBe('furb.example.org');
  });
});

describe('parseSiteTable', () => {
  it('accepts an origin or an object', () => {
    const table = parseSiteTable({
      'a.example.org': 'https://derpibooru.org/',
      'b.example.org': { origin: 'https://furbooru.org', name: ' Furs ', themeColor: 'teal' },
    });
    expect(table.get('a.example.org')).toEqual({ origin: 'https://derpibooru.org' });
    expect(table.get('b.example.org')).toEqual({ origin: 'https://furbooru.org', name: 'Furs', themeColor: 'teal' });
  });

  it.each([
    [[]],
    [{ 'a.example.org': 'ftp://x.org' }],
    [{ 'a.example.org': 'https://x.org/path' }],
    [{ 'a.example.org': 5 }],
    [{ 'a/b': 'https://x.org' }],
    [{ 'a.example.org': { origin: 'https://x.org', themeColor: 'mauve' } }],
    [{ 'a.example.org': { origin: 'https://x.org', logo: 'javascript:alert(1)' } }],
  ])('rejects %j', raw => {
    expect(() => parseSiteTable(raw)).toThrow();
  });
});

describe('resolveSite', () => {
  const table = parseSiteTable({
    'furb.example.org': 'https://furbooru.org',
    'mine.example.org': { origin: 'https://furbooru.org', name: 'Mine', themeColor: 'red' },
  });
  const live = (origin: string) =>
    origin === 'https://furbooru.org'
      ? { name: 'Furbooru', logo: 'https://furbooru.org/f.svg', themeColor: 'purple' as const }
      : undefined;

  it('falls back to Derpibooru for an unknown host', () => {
    expect(resolveSite('localhost:3000', table, () => undefined)).toEqual({
      origin: 'https://derpibooru.org',
      name: 'Derpibooru',
      logo: 'https://derpicdn.net/favicon.svg',
      themeColor: 'blue',
    });
  });

  it('uses what the live site said', () => {
    expect(resolveSite('FURB.example.org:443', table, live)).toEqual({
      origin: 'https://furbooru.org',
      name: 'Furbooru',
      logo: 'https://furbooru.org/f.svg',
      themeColor: 'purple',
    });
  });

  it('prefers the config over the live site', () => {
    expect(resolveSite('mine.example.org', table, live)).toMatchObject({ name: 'Mine', themeColor: 'red' });
  });

  it('names a site nothing is known about after its hostname', () => {
    const other = parseSiteTable({ 'x.example.org': 'https://booru.example.net' });
    expect(resolveSite('x.example.org', other, () => undefined)).toEqual({
      origin: 'https://booru.example.net',
      name: 'booru.example.net',
      logo: null,
      themeColor: 'blue',
    });
  });
});

describe('accents', () => {
  it('maps colors to the nearest accent', () => {
    expect(accentFromHex('#36274e')).toBe('purple');
    expect(accentFromHex('#ff0000')).toBe('red');
    expect(accentFromHex('#3b82f6')).toBe('blue');
    expect(accentFromHex('#808080')).toBe('gray');
    expect(accentFromHex('red')).toBeUndefined();
  });

  it('maps theme names', () => {
    expect(accentFromThemeName('dark-purple')).toBe('purple');
    expect(accentFromThemeName('light-teal')).toBe('teal');
    expect(accentFromThemeName('neon')).toBeUndefined();
  });
});

describe('parseHomepage', () => {
  it('reads the branding off a Philomena home page', () => {
    expect(parseHomepage(fixture('furbooru-home.html'), 'https://furbooru.org')).toEqual({
      name: 'Furbooru',
      themeColor: 'purple',
      logo: 'https://furbooru.org/favicon.svg',
    });
  });

  it('ignores a bot challenge', () => {
    expect(parseHomepage(fixture('derpibooru-challenge.html'), 'https://derpibooru.org')).toBeUndefined();
  });

  it('picks the part of the title that is the hostname, in either order', () => {
    const page = (title: string) => `<html><head><title>${title}</title></head></html>`;
    expect(parseHomepage(page('Furbooru - Homepage'), 'https://furbooru.org')?.name).toBe('Furbooru');
    expect(parseHomepage(page('Homepage - Furbooru'), 'https://furbooru.org')?.name).toBe('Furbooru');
  });
});
