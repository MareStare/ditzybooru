import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import customMedia from 'postcss-custom-media';

export default defineConfig({
  build: {
    target: ['es2019', 'chrome80', 'firefox69', 'edge80', 'safari13', 'ios13', 'opera63'],
  },
  css: {
    // TODO: re-visit some of the postcss plugins we use here. LightningCSS
    // supports some of these transformations already, and it's already our
    // dependency via vite. We can't use LightningCSS as a transformer directly,
    // because it doesn't support all the transforms some of the PostCSS plugins
    // do. However we could use `postcss-lightningcss` plugin to combine both
    // PostCSS transforms and LightningCSS. The caveats to research: source maps
    // support.
    postcss: { plugins: [customMedia()] },
  },
  html: {
    // TODO: enable CSP nonce checks. Requires backend support.
    // cspNonce: 'nonce-{RANDOM}',
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      generatedRouteTree: './src/route-tree.gen.ts',
      semicolons: true,
    }),
    viteReact(),
  ],
});
