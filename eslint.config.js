import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  {
    files: ['public/**/*.js', 'docs/design/bron/support.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js', '*.config.js', 'docs/design/bron/*.mjs'],
    languageOptions: { globals: globals.node },
  },
];
