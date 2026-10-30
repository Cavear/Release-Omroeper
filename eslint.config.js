import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', '.playwright-mcp/'] },
  js.configs.recommended,
  {
    files: ['public/**/*.js', 'docs/design/bron/support.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js', '*.config.js', 'docs/design/bron/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // In UI- en smoketests draait code binnen page.evaluate in de browser.
    files: ['tests/ui/**/*.js', 'tests/smoke/**/*.js', 'testbewijs/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
