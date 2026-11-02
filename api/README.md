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

- Our API lives under `/api/v1`, camelCase fields, numeric ids, one pagination
  envelope `{ items, total, page, perPage }`, one error envelope.
- Selector preference: `data-*` / `js-*` hooks, then ids, then structural
  classes. Never styling-only classes when a hook exists.
- Flavor differences use `flavors` on strategies, never forked operations.
- `:new` / `:edit` form GETs are not operations; they become `form.page` of the
  write they belong to. Skip them in `coverage.json` with a `note`.
