import { defineConfig } from 'vitest/config';

// Alleen de unit-tests; de Playwright-tests in tests/ui en tests/smoke draaien apart.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
  },
});
