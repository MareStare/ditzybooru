// Vite plugin that builds a legacy-browser fallback stylesheet.
//
// `src/global.css` compiles to *layered* Tailwind CSS. Browsers without cascade
// layer support drop everything inside `@layer {}`, so they'd render unstyled.
// This plugin produces a flattened, un-layered, down-leveled copy of that CSS and:
//   - dev:   serves it from memory at `/<FILE_NAME>` (so the <link> doesn't 404)
//   - build: emits it straight into the output dir as `dist/<FILE_NAME>`
// The <link> and the feature-detection that disables it live in `index.html`.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripCssLayers } from './strip-css-layers.mjs';

const FILE_NAME = 'legacy-browsers-fallback.min.css';
// Match the browser matrix of the modern bundle (see `build.target` in vite.config).
const LEGACY_TARGETS = 'chrome 80, firefox 69, edge 80, safari 13, ios_saf 13, opera 63';

const bin = name => join('node_modules', '.bin', name);

/** Compiles `src/global.css`, strips its `@layer` wrappers, and minifies for old browsers. */
function generateLegacyCss(root) {
  const dir = mkdtempSync(join(tmpdir(), 'legacy-css-'));
  try {
    const layered = join(dir, 'layered.css');
    const flat = join(dir, 'flat.css');
    const min = join(dir, 'min.css');
    const run = (cmd, args) => execFileSync(bin(cmd), args, { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });

    run('tailwindcss', ['--optimize', '-i', 'src/global.css', '-o', layered]);
    writeFileSync(flat, stripCssLayers(readFileSync(layered, 'utf8')));
    run('lightningcss', ['--minify', '--bundle', '--targets', LEGACY_TARGETS, flat, '-o', min]);
    return readFileSync(min, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function legacyCssPlugin() {
  let root = process.cwd();
  return {
    name: 'legacy-browsers-fallback-css',

    configResolved(config) {
      root = config.root;
    },

    // Dev: generate lazily on first request and cache. The fallback is disabled by
    // the feature-detection in index.html on modern browsers anyway, so serving a
    // cached copy is only about avoiding a 404 (and letting you test the fallback).
    configureServer(server) {
      let cached;
      server.middlewares.use((req, res, next) => {
        if ((req.url ?? '').split('?')[0] !== `/${FILE_NAME}`) return next();
        cached ??= generateLegacyCss(root);
        res.setHeader('Content-Type', 'text/css');
        res.end(cached);
      });
    },

    // Build: emit the fallback into the output dir under a stable (unhashed) name so
    // the static <link href="/legacy-browsers-fallback.min.css"> in index.html resolves.
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: FILE_NAME, source: generateLegacyCss(root) });
    },
  };
}
