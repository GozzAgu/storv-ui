import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

/**
 * Minimal config. `npm run lint` checks only files changed against main (scripts/lint-changed.mjs);
 * `npm run lint:all` runs everything and is not yet expected to pass.
 */
export default tseslint.config(
  {
    ignores: [
      '.nuxt/**',
      '.output/**',
      'dist/**',
      'node_modules/**',
      'ios/**',
      'android/**',
      'coverage/**',
      'public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Nuxt auto-imports (useRuntimeConfig, defineEventHandler, ref...) are not visible to ESLint.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'vue/multi-word-component-names': 'off',
      // Every icon is Storvv's own (icons/README.md). Draw a missing one in icons/sets.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@lucide/vue',
              message:
                "Import icons from '~/icons'. Need a new one? Draw it in icons/sets (see icons/README.md).",
            },
          ],
        },
      ],
    },
  },
  {
    // The preview script compares Storvv icons with the Lucide originals.
    files: ['scripts/icons/**'],
    rules: { 'no-restricted-imports': 'off' },
  }
)
