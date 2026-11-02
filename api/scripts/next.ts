import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { CoverageEntry } from '../src/coverage.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const coverage = JSON.parse(readFileSync(`${root}coverage.json`, 'utf8')) as Record<string, CoverageEntry>;
const size = Number(process.argv[2] ?? 8);

const counts: Record<string, number> = {};
for (const entry of Object.values(coverage)) counts[entry.status] = (counts[entry.status] ?? 0) + 1;
console.log('progress:', counts);

const todo = Object.entries(coverage)
  .filter(([, e]) => e.status === 'todo')
  .sort(([ka, a], [kb, b]) => a.phase - b.phase || ka.localeCompare(kb));
const phase = todo[0]?.[1].phase;
console.log(`\nnext batch (phase ${phase ?? '-'}):`);
for (const [key, e] of todo.filter(([, entry]) => entry.phase === phase).slice(0, size)) {
  console.log(`  ${key}\n    ${e.controller} [${e.class}/${e.area}] ${e.instances.join(',')}`);
}
