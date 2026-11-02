import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Area, CoverageEntry, RouteClass } from '../src/coverage.ts';

interface Instance {
  origin: string;
  flavor: string;
  /** Container to run `mix phx.routes` in; absent for remote-only instances. */
  appContainer?: string;
}

interface Route {
  method: string;
  path: string;
  controller: string;
  action: string;
}

const root = fileURLToPath(new URL('..', import.meta.url));
const instances = JSON.parse(readFileSync(`${root}instances.json`, 'utf8')) as Record<string, Instance>;
const verbs = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

/** Parses `mix phx.routes` rows: `[helper] VERB /path Controller :action`. */
function parseRoutes(output: string): Route[] {
  const routes: Route[] = [];
  for (const line of output.split('\n')) {
    const tokens = line.trim().split(/\s+/);
    const verbIndex = tokens.findIndex(t => verbs.has(t));
    if (verbIndex < 0 || verbIndex > 1) continue;
    const [method, path, controller, action] = tokens.slice(verbIndex);
    if (!method || !path || !controller || !action) continue;
    routes.push({ method, path, controller, action: action.replace(/^:/, '') });
  }
  return routes;
}

function classify(route: Route): { class: RouteClass; area: Area; phase: number } {
  const { controller, action, method, path } = route;
  const area: Area = controller.includes('.Admin.')
    ? 'admin'
    : controller.includes('.Api.')
      ? 'public'
      : /Moderation|\.Image\.(Delete|Tamper|Hash|Repair|Feature|Lock|Uploader|Anonymous|Destroy|Approve|Scratchpad)|Tag(Change)?\.(Revert|Alias)/.test(
            controller,
          )
        ? 'moderator'
        : /^\/(sessions|registrations|confirmations|passwords|unlocks|reactivations)/.test(path)
          ? 'auth'
          : 'public';
  const isWrite = method !== 'GET' && method !== 'HEAD';
  let cls: RouteClass;
  if (controller.includes('.Api.Json.')) cls = 'api-json';
  else if (controller.includes('.Api.Rss.')) cls = 'rss';
  else if (isWrite) cls = 'mutation';
  else if (action === 'new' || action === 'edit') cls = 'html-form';
  else cls = 'html-page';
  let phase: number;
  if (area === 'admin') phase = 8;
  else if (area === 'moderator') phase = 7;
  else if (area === 'auth') phase = 4;
  else if (cls === 'api-json' || cls === 'rss') phase = 1;
  else if (isWrite || cls === 'html-form') phase = 6;
  else phase = 3;
  return { class: cls, area, phase };
}

const coveragePath = `${root}coverage.json`;
const coverage: Record<string, CoverageEntry> = existsSync(coveragePath)
  ? (JSON.parse(readFileSync(coveragePath, 'utf8')) as Record<string, CoverageEntry>)
  : {};
const seen = new Set<string>();

for (const [name, instance] of Object.entries(instances)) {
  if (!instance.appContainer) continue;
  const output = execFileSync('podman', ['exec', instance.appContainer, 'mix', 'phx.routes'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const routes = parseRoutes(output);
  writeFileSync(`${root}inventory/${name}.routes.json`, JSON.stringify(routes, null, 2) + '\n');
  console.log(`${name}: ${routes.length} routes`);
  for (const route of routes) {
    const key = `${route.method} ${route.path}`;
    seen.add(key);
    const existing = coverage[key];
    if (existing) {
      existing.controller = `${route.controller}#${route.action}`;
      if (!existing.instances.includes(name)) existing.instances.push(name);
    } else {
      coverage[key] = {
        controller: `${route.controller}#${route.action}`,
        instances: [name],
        ...classify(route),
        status: 'todo',
        operations: [],
        note: '',
      };
    }
  }
}

for (const key of Object.keys(coverage)) {
  if (!seen.has(key)) console.warn(`route no longer upstream: ${key}`);
}

const sorted = Object.fromEntries(Object.entries(coverage).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(coveragePath, JSON.stringify(sorted, null, 2) + '\n');
console.log(`coverage.json: ${Object.keys(sorted).length} entries`);
