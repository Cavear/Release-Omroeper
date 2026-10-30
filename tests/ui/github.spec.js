import { test, expect } from '@playwright/test';
import { alsBestand } from './hulp.js';

test.describe('GitHub ophalen', () => {
  test('toont een fallback als de doelgroep leeg is', async ({ page }) => {
    await page.goto('./');
    await page.setInputFiles('#bestandskiezer', alsBestand({
      repository: 'eigenaar/webshop',
      periode: { van: '2026-10-29T00:00:00Z', tot: '2026-10-30T23:59:59Z' },
      berichten: [{
        prNummer: 7,
        bronUrl: 'https://github.com/eigenaar/webshop/pull/7',
        origineleTitel: 'Testbericht',
        kop: 'Testkop',
        uitleg: 'Zakelijke uitleg.',
        voorWie: '',
        status: 'concept',
      }],
    }));

    await expect(page.getByTestId('kaart')).toContainText('Voor: nog onbekend');
  });

  test('haalt een gemergde PR op als ongekeurd concept', async ({ page }) => {
    await page.route('https://api.github.com/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/search/issues') {
        await route.fulfill({ json: { total_count: 1, incomplete_results: false, items: [{ number: 42 }] } });
      } else if (url.pathname.endsWith('/pulls/42')) {
        await route.fulfill({ json: {
          number: 42,
          title: 'Zoeken in producten',
          body: 'De productlijst kan nu worden doorzocht.',
          merged_at: '2026-10-29T12:30:00Z',
        } });
      } else {
        await route.fulfill({ status: 404, json: {} });
      }
    });

    await page.goto('./');
    await page.getByRole('button', { name: 'GitHub ophalen' }).first().click();
    const dialoog = page.getByRole('dialog', { name: 'Gemergde PR’s ophalen' });
    await dialoog.getByLabel('Repository (owner/repo)').fill('eigenaar/webshop');
    await dialoog.getByLabel('Gemergd vanaf').fill('2026-10-29');
    await dialoog.getByLabel('Gemergd tot en met').fill('2026-10-30');
    await dialoog.getByRole('button', { name: 'Pull requests ophalen' }).click();

    const kaart = page.getByTestId('kaart').filter({ hasText: 'PR #42' });
    await expect(kaart).toContainText('Zoeken in producten');
    await expect(kaart).toContainText('De productlijst kan nu worden doorzocht.');
    await expect(kaart).toContainText('Voor: nog onbekend');
    await expect(kaart.getByText('concept')).toBeVisible();
    await expect(page.locator('#melding')).toContainText('1 bericht opgehaald uit GitHub');
  });

  test('laadt niets als de repository niet openbaar is', async ({ page }) => {
    await page.route('https://api.github.com/**', (route) => route.fulfill({ status: 422, json: { message: 'Validation Failed' } }));

    await page.goto('./');
    await page.getByRole('button', { name: 'GitHub ophalen' }).first().click();
    const dialoog = page.getByRole('dialog', { name: 'Gemergde PR’s ophalen' });
    await dialoog.getByLabel('Repository (owner/repo)').fill('eigenaar/prive');
    await dialoog.getByRole('button', { name: 'Pull requests ophalen' }).click();

    await expect(page.locator('#github-fout')).toContainText('alleen publieke repositories');
    await expect(page.locator('#github-fout')).toBeFocused();
    await expect(page.getByTestId('kaart')).toHaveCount(0);
    await expect(dialoog).toBeVisible();
  });

  test('een opgehaald concept dat niet aan het contract voldoet, toont de fout zichtbaar en laadt niets', async ({ page }) => {
    await page.route('https://api.github.com/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/search/issues') {
        await route.fulfill({ json: { total_count: 1, incomplete_results: false, items: [{ number: 5 }] } });
      } else {
        // Buiten de gekozen periode gemergd: valideerConcept keurt dit af.
        await route.fulfill({ json: { number: 5, title: 'Iets', body: 'Uitleg.', merged_at: '2026-11-05T12:00:00Z' } });
      }
    });

    await page.goto('./');
    await page.getByRole('button', { name: 'GitHub ophalen' }).first().click();
    const dialoog = page.getByRole('dialog', { name: 'Gemergde PR’s ophalen' });
    await dialoog.getByLabel('Repository (owner/repo)').fill('eigenaar/webshop');
    await dialoog.getByLabel('Gemergd vanaf').fill('2026-10-29');
    await dialoog.getByLabel('Gemergd tot en met').fill('2026-10-30');
    await dialoog.getByRole('button', { name: 'Pull requests ophalen' }).click();

    await expect(dialoog).toBeHidden();
    await expect(page.getByTestId('fout')).toBeVisible();
    await expect(page.getByTestId('fout')).toContainText('De pull requests zijn niet ingeladen');
    await expect(page.getByTestId('kaart')).toHaveCount(0);
  });
});