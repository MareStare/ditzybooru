- Don't automatically update the git index, don't use `git rm`. Instead, leave your changes unstaged letting the human review/stage them manually.
- The developer may already be running an `npm run dev` server. Don't terminate this process, reuse it.
- The project isn't released yet, do any breaking changes to keep the code clean, no handling of backwards compatibility, deprecations.

## Comments

- Don't add comments for simple functions with up to 5 statements.
- Don't add comments for what's already obvious from code.
- Never write a comment that is longer than 3 lines and 80 characters wide.

# Code Conventions

- Don't write untyped JavaScript, use TypeScript instead.
- Use `unwrap()` from `lib/assertions` instead of non-null assertions (`!` suffix), but prefer using the type system to avoid nulls.
