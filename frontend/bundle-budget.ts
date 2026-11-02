import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

/**
 * Maximum total size of the JavaScript shipped to browsers. Two limits, both
 * decimal and both must hold: 1 MB minified (parse and memory cost) and 500 kB
 * gzipped (download cost). CSS and static assets do not count, nor does any
 * server code.
 */
const MAX_CLIENT_JS_RAW_BYTES = 1_000_000;
const MAX_CLIENT_JS_GZIP_BYTES = 500_000;

function formatKb(bytes: number): string {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

/** Fails the client build when its JS chunks add up to more than the budget. */
export function bundleBudget(): Plugin {
  return {
    name: 'bundle-budget',
    apply: 'build',
    generateBundle(_options, bundle) {
      if (this.environment.name !== 'client') return;

      const chunks = Object.values(bundle)
        .filter(output => output.type === 'chunk')
        .map(chunk => ({
          name: chunk.fileName,
          raw: Buffer.byteLength(chunk.code),
          gzip: gzipSync(chunk.code).length,
        }))
        .sort((a, b) => b.raw - a.raw);
      const raw = chunks.reduce((sum, chunk) => sum + chunk.raw, 0);
      const gzip = chunks.reduce((sum, chunk) => sum + chunk.gzip, 0);

      const summary =
        `client JS: ${formatKb(raw)} of ${formatKb(MAX_CLIENT_JS_RAW_BYTES)} raw, ` +
        `${formatKb(gzip)} of ${formatKb(MAX_CLIENT_JS_GZIP_BYTES)} gzipped`;
      if (raw <= MAX_CLIENT_JS_RAW_BYTES && gzip <= MAX_CLIENT_JS_GZIP_BYTES) {
        this.info(summary);
        return;
      }

      const largest = chunks
        .slice(0, 5)
        .map(
          chunk =>
            `  ${formatKb(chunk.raw).padStart(10)} raw  ${formatKb(chunk.gzip).padStart(10)} gzip  ${chunk.name}`,
        )
        .join('\n');
      this.error(`Over the client JS budget (bundle-budget.ts): ${summary}. Largest chunks:\n${largest}`);
    },
  };
}
