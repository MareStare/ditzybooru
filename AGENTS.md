- Never touch git index, never `git rm`. Leave changes unstaged for human to review/stage.
- Developer may already run `npm run dev` server. Never kill it, reuse it.
- Project unreleased: make breaking changes freely for clean code. No backwards compatibility, no deprecations.
- Use regular dash instead of em-dash everywhere.

## Terminology

- Never say "byte-identical" or "bit identical". Say "equal" or "the same" instead.
- Never say "load-bearing". Say "important" instead.

## Comments

- No comments on simple functions up to 5 statements.
- No comments for what code already shows.
- Never write comment longer than 3 lines or 80 characters wide.

# Code Conventions

- Never write untyped JavaScript, use TypeScript.
- Use `unwrap()` from `lib/assertions` instead of non-null assertions (`!` suffix). Prefer type system that avoids nulls.
