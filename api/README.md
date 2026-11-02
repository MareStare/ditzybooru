# api

Version-controlled mapping of Philomena's public surface to Ditzybooru's own
API. `src/` holds typed TS modules; `scripts/build.ts` bundles them into the
tracked `openapi.json` (OpenAPI 3.1). Each operation carries an `x-philomena`
extension saying how the Rust backend serves it from upstream (`json` remap,
`html` selector map or `form` submission). `coverage.json` tracks every
upstream route and is the resume point.

## Workflow loop

1. `pnpm --filter api run inventory` - only when upstream changed. Runs
   `mix phx.routes` in the app containers from `instances.json`, keeps statuses.
2. `pnpm api:next [n]` - prints the next batch of `todo` routes by phase.
3. Read the controller/template in `~/git/philomena-dev/philomena` and
   `~/git/furbooru/philomena`, curl the page on :8080 / :8081, then write or
   extend operations in `src/operations/*.ts` (shared types in `src/schemas`).
4. `pnpm api:build` - regenerates `openapi.json`; routes referenced by an
   operation become `mapped`. `pnpm api:check` fails if outputs are stale.
5. Verify with the Rust verifier (not written yet), which sets `verified`.
6. Commit the batch. Resume = rerun step 2.

## Conventions

- One endpoint per page of the live site, not a fine-grained REST API. An
  endpoint returns everything its page shows, served from whichever upstream
  route renders that page (HTML scrape, or the JSON API when it carries the
  same data). Routes made redundant by a page endpoint are `skipped` with a note.
- Our API lives under `/api/v1`, camelCase fields, numeric ids, one pagination
  envelope `{ items, total, page, perPage }`, one error envelope.
- Selector preference: `data-*` / `js-*` hooks, then ids, then structural
  classes. Never styling-only classes when a hook exists.
- Flavor differences use `flavors` on strategies, never forked operations.
- `:new` / `:edit` form GETs are not operations; they become `form.page` of the
  write they belong to. Skip them in `coverage.json` with a `note`.

## Serving

The Rust backend (`backend/src/api.rs`) registers every GET operation of
`openapi.json` under `/api/v1`. The node build of the frontend proxies
`/api/v1/**` to it (`frontend/api-proxy.ts`, backend address from
`API_BACKEND_URL`, default `http://127.0.0.1:3711`). The proxy passes the
site's `Host` as `X-Forwarded-Host`; the backend picks the Philomena from it
with the same `sites.local.json` (or `SITES_FILE`) as the frontend. An entry may
add `"flavor"`; otherwise it is `furbooru` for furbooru origins and `philomena`
for the rest. Hosts that are not listed get `UPSTREAM_ORIGIN`, or Derpibooru.
Redirects from the upstream are not followed and read as 404.
