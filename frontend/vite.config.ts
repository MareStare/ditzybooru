import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
  build: {
    target: ['es2019', 'chrome80', 'firefox69', 'edge80', 'safari13', 'ios13', 'opera63'],
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
