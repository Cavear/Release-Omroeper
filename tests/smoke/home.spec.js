import { test, expect } from '@playwright/test';

/**
 * Smoketest na een deploy naar STRATO: laadt de pagina, en staat de echte app erop?
 * De kop "De redactietafel" staat alleen in de app, niet op een oude testpagina met dezelfde titel.
 * De URL komt uit BASE_URL; zonder BASE_URL wordt de testomgeving gebruikt.
 */
const BASE_URL = process.env.BASE_URL ?? 'http://app1-test.caitlinveenendaal.nl/';

test('de pagina laadt en toont de redactie', async ({ page }) => {
  const antwoord = await page.goto(BASE_URL);
  expect(antwoord?.ok(), `${BASE_URL} gaf status ${antwoord?.status()}`).toBe(true);
  await expect(page).toHaveTitle(/Release-omroeper/);
  await expect(page.getByRole('heading', { level: 1, name: 'De redactietafel' })).toBeVisible();
});
