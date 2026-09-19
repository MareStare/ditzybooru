//  @ts-check
import { tanstackConfig } from '@tanstack/eslint-config';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintReact from '@eslint-react/eslint-plugin';
import router from '@tanstack/eslint-plugin-router';
import vitest from '@vitest/eslint-plugin';
import { includeIgnoreFile } from 'eslint/config';

export default [
  // Keeps the lint file set the same locally and on CI: gitignored paths are
  // absent from a CI checkout, so linting them only ever fails on a dev box.
  includeIgnoreFile(fileURLToPath(new URL('.gitignore', import.meta.url))),
  ...tanstackConfig,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat['recommended-latest'],
  eslintReact.configs['strict-type-checked'],
  ...router.configs['flat/recommended'],
  {
    // `@eslint-react` reimplements the React Compiler rules of
    // `eslint-plugin-react-hooks` v7. This preset names every such pair, but
    // resolves it the other way: it turns off the react-hooks copy. Keep the
    // first-party copy instead.
    rules: Object.fromEntries(
      Object.keys(
        /** @type {import('eslint').Linter.RulesRecord} */ (
          eslintReact.configs['disable-conflict-eslint-plugin-react-hooks'].rules
        ),
      ).map(rule => [rule.replace('react-hooks/', '@eslint-react/'), 'off']),
    ),
  },
  {
    files: ['frontend/tests/**/*.ts'],
    ...vitest.configs.recommended,
  },
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',

      // Not in any `@eslint-react` preset.
      '@eslint-react/no-duplicate-key': 'error',
      '@eslint-react/no-unused-state': 'error',
      '@eslint-react/no-implicit-children': 'error',
      '@eslint-react/no-implicit-key': 'error',
      '@eslint-react/no-implicit-ref': 'error',

      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportNamedDeclaration[source=null][declaration=null]',
          message: 'Use inline exports, such as `export function Foo() {}`, instead of a separate export block.',
        },
        {
          selector: ':matches(Literal[value=/—/], TemplateElement[value.raw=/—/], JSXText[value=/—/])',
          message: 'Use a regular dash instead of an em-dash.',
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
