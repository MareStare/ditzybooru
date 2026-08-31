import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { devtools } from '@tanstack/devtools-vite';
import viteReact from '@vitejs/plugin-react';

/** The JS floor, deliberately low. Lower than the CSS floor below on purpose -
 *  see the TODO there. */
const buildTarget = ['es2019', 'chrome80', 'firefox69', 'edge80', 'safari13', 'ios13', 'opera63'];

/**
 * One modern CSS feature keeps our browser floor high right now: `color-mix()`
 * + `oklab` together with `var()` prevent lightningcss from precomputing them.
 * This however, allows us to share a lot of code between different color themes
 * (dark blue, light gray, etc.).
 *
 * Everything else modern in the stylesheet degrades rather than breaks -
 * view transitions, `backdrop-filter`, `corner-shape`, `text-wrap`,
 * `scrollbar-*` - so none of them raises the floor.
 *
 * TODO: bring this floor back down. The plan is a precompiled fallback
 * stylesheet for browsers without `color-mix()`: resolve every custom property
 * against one fixed theme (dark blue) at build time, which turns each
 * `color-mix()` into a literal that LightningCSS folds to a plain sRGB color.
 * A LightningCSS `visitor` substituting `Variable` nodes does the resolution;
 * it has to be a second pass over the whole stylesheet rather than a step in
 * this pipeline, since two thirds of the `color-mix()` calls are inline in
 * component rules rather than in custom properties. The cost is that the
 * Display Settings customization does not survive it - corner radius, outline
 * width, shadow depth, spacing, text size and motion are baked in at their
 * defaults, because a `calc()` in a `color-mix()` percentage stops it folding.
 * That is an acceptable trade for a fallback, but it is why this cannot simply
 * be turned on for everyone.
 *
 * `major << 16 | minor << 8`, LightningCSS's version encoding.
 */
const cssTargets = {
  chrome: 111 << 16,
  edge: 111 << 16,
  firefox: 113 << 16,
  safari: (16 << 16) | (2 << 8),
  ios_saf: (16 << 16) | (2 << 8),
  opera: 97 << 16,
};

export default defineConfig({
  css: {
    // Important LightningCSS transforms we depend on:
    // - `light-dark()` inside custom properties.
    // - custom media query aliases
    transformer: 'lightningcss',
    lightningcss: { targets: cssTargets, drafts: { customMedia: true } },
  },
  html: {
    // TODO: enable CSP nonce checks. Requires backend support.
    // cspNonce: 'nonce-{RANDOM}',
  },
  build: { cssMinify: 'lightningcss' },
  resolve: { tsconfigPaths: true },
  environments: {
    // Scoped to the browser build: the Worker runs on workerd, and handing it
    // this list collides with the target the Cloudflare plugin sets.
    client: { build: { target: buildTarget } },
  },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      // Workaround for https://github.com/TanStack/router/issues/7794 (fix
      // pending in https://github.com/TanStack/router/pull/7830): Start's
      // dev-only SSR stylesheet is collected by crawling the module graph,
      // which emits `styles/index.css` (with its `@import`s already inlined)
      // AND every imported file a second time, in module-graph order. The
      // duplicate half overrides the first, so the pre-hydration paint has the
      // wrong cascade. `__root.tsx` links the real stylesheet instead.
      dev: { ssrStyles: { enabled: false } },
      router: {
        generatedRouteTree: 'route-tree.gen.ts',
        semicolons: true,
      },
    }),
    viteReact(),
  ],
});
