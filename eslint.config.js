//  @ts-check
import { tanstackConfig } from '@tanstack/eslint-config';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';
import reactHooks from 'eslint-plugin-react-hooks';
import { includeIgnoreFile } from 'eslint/config';

export default [
  // Keeps the lint file set the same locally and on CI: gitignored paths are
  // absent from a CI checkout, so linting them only ever fails on a dev box.
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  ...tanstackConfig,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat['recommended-latest'],
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportNamedDeclaration[source=null][declaration=null]',
          message: 'Use inline exports, such as `export function Foo() {}`, instead of a separate export block.',
        },
      ],
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
        },
      ],
    },
  },
  {
    ignores: ['eslint.config.js'],
  },
];
