//  @ts-check
import { tanstackConfig } from '@tanstack/eslint-config';
import tseslint from 'typescript-eslint';

export default [
  ...tanstackConfig,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportNamedDeclaration[source=null][declaration=null]',
          message: 'Use inline exports, such as `export function Foo() {}`, instead of a separate export block.',
        },
      ],
    },
  },
  {
    ignores: ['eslint.config.js'],
  },
];
