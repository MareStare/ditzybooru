- Don't automatically update the git index, don't use `git rm`. Instead, leave your changes unstaged letting the human review/stage them manually.
- The developer may already be running an `npm run dev` server. Don't terminate this process, reuse it.

# Code Conventions

- Use `unwrap()` from `lib/assertions` instead of non-null assertions (`!` suffix), but prefer using the type system to avoid nulls.
