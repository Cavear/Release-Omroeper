import { test, expect } from '@playwright/test';

/**
 * Smoketest na een handmatige upload naar STRATO: laadt de pagina en staat de titel erop?
 * De URL komt uit BASE_URL; zonder BASE_URL wordt de testomgeving gebruikt.
 */
const BASE_URL = process.env.BASE_URL ?? 'http://app1-test.caitlinveenendaal.nl/';

test('de pagina laadt en toont de titel', async ({ page }) => {
  const antwoord = await page.goto(BASE_URL);
  expect(antwoord?.ok(), `${BASE_URL} gaf status ${antwoord?.status()}`).toBe(true);
  await expect(page).toHaveTitle(/Release-omroeper/);
});
