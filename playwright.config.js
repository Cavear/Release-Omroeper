import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright-instellingen voor de UI-tests (tests/ui) en de smoketest (tests/smoke).
 * Elke UI-test draait op drie viewports: mobiel, tablet en desktop.
 * De app wordt geserveerd door scripts/serve.js op poort 4173 (geen XAMPP nodig, ook in de CI).
 */
export default defineConfig({
  testDir: './tests',
  // Alleen *.spec.js; de unit-tests (*.test.js) zijn voor Vitest.
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:4173/',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
  projects: [
    {
      name: 'mobiel',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
    {
      name: 'tablet',
      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
