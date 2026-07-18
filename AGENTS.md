- Don't automatically update the git index, don't use `git rm`. Instead, leave your changes unstaged letting the human review/stage them manually.

# Code Conventions

- Use a plain long string literal for class names even if it's going to be very long. Don't wrap static class names string with `cn()` unnecessarily.
- Use `unwrap()` from `lib/assertions` instead of non-null assertions (`!` suffix), but prefer using the type system to avoid nulls in the first place.
