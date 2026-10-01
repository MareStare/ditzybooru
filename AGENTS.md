- Developer may already run `npm run dev` server. Never kill it, reuse it.
- Project unreleased: make breaking changes freely for clean code. No backwards compatibility, no deprecations.
- Use regular dash instead of em-dash everywhere.
- Before changing TanStack Router, Start, Query or devtools code, read the matching `node_modules/@tanstack/*/skills/**/SKILL.md`. It matches the installed version.

## Terminology

- Never say "byte-identical" or "bit identical". Say just "identical" or "equal" or "the same" instead.
- Never say "load-bearing". Say "important" instead.

## Code Conventions

- Never write untyped JavaScript, use TypeScript.
- Avoid premature exports. Only use `export` if another file needs to import something.
- Use `unwrap()` from `lib/assertions` instead of non-null assertions (`!` suffix). Prefer type system that avoids nulls.

## Git

- Write commit messages in the Conventional Commits format.
- Cloudflare Workers Builds deploys every push to `main` to production.
