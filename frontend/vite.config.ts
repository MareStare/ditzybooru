import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { legacyCssPlugin } from './scripts/vite-plugin-legacy-css.mjs';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    legacyCssPlugin(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      generatedRouteTree: './src/route-tree.gen.ts',
      semicolons: true,
    }),
    viteReact(),
  ],
  build: {
    target: ['es2019', 'chrome80', 'firefox69', 'edge80', 'safari13', 'ios13', 'opera63'],
  },
});
