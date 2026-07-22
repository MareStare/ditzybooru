// Unwraps `@layer NAME { ... }` blocks in a built CSS file: the wrapper is
// removed while the rules inside are kept at top level. This is needed because
// our target browsers (see `minify:css`) don't support cascade layers, so any
// rules left inside `@layer` would be dropped by those engines entirely.
//
// Statement-form declarations (`@layer components;`) are removed outright.
// Brace matching is depth-tracked and skips comments/strings, so nested
// at-rules (e.g. `@supports` inside `@layer properties`) are handled correctly.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Removes `@layer` wrappers from `css`, keeping the rules inside at top level. */
export function stripCssLayers(css) {
  const n = css.length;
  const isWord = ch => ch != null && /[\w-]/.test(ch);

  let out = '';
  let i = 0;
  // One entry per open brace. `true` = opened by an `@layer` we're unwrapping,
  // so its matching `}` must be dropped; `false` = a normal brace to keep.
  const stack = [];

  while (i < n) {
    const c = css[i];

    // Honor backslash escaping (Tailwind escapes `'`, `[`, etc. in selectors).
    // Copy the escaped pair verbatim so an escaped quote isn't read as a string.
    if (c === '\\') {
      out += css.slice(i, i + 2);
      i += 2;
      continue;
    }

    // Preserve comments verbatim so braces inside them don't skew the counter.
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? n : end + 2;
      out += css.slice(i, stop);
      i = stop;
      continue;
    }

    // Preserve string literals verbatim (they may contain `{`, `}`, or `*/`).
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c) {
        if (css[j] === '\\') j++;
        j++;
      }
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // `@layer` — unwrap block form, delete statement form.
    if (c === '@' && css.startsWith('@layer', i) && !isWord(css[i + 6])) {
      let j = i + 6;
      while (j < n && css[j] !== '{' && css[j] !== ';') j++;
      if (css[j] === ';') {
        i = j + 1; // drop `@layer NAME;`
      } else {
        stack.push(true); // drop prelude + opening `{`; its `}` is dropped later
        i = j + 1;
      }
      continue;
    }

    if (c === '{') {
      stack.push(false);
      out += c;
    } else if (c === '}') {
      const droppedLayer = stack.pop();
      if (!droppedLayer) out += c;
    } else {
      out += c;
    }
    i++;
  }

  return out;
}

// CLI: `node strip-css-layers.mjs <file.css>` rewrites the file in place.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: strip-css-layers.mjs <file.css>');
    process.exit(1);
  }
  writeFileSync(file, stripCssLayers(readFileSync(file, 'utf8')));
}
