/**
 * Similar to Rust's `unwrap()`, but this one throws an error if the value is
 * `null` or `undefined`. An optional error message can be provided as a second
 * parameter.
 *
 * Note the complex conditional return type signature of this function. It makes
 * sure that `unwrap()` is only ever used with types that contain `null` or
 * `undefined` values. If the type doesn't contain `null` or `undefined`, the
 * return type will be `unknown` - this should be an indication that `unwrap()`
 * is useless in that context.
 */
export function unwrap<T>(
  value: T,
  message?: string,
): undefined extends T ? T & {} : null extends T ? T & {} : unknown {
  if (value != null) {
    return value;
  }

  const err = new Error(message ?? `BUG: unwrap() called on a ${String(value)} value`);
  console.error(err);
  throw err;
}
