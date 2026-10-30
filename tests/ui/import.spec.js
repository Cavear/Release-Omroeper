import { test, expect } from '@playwright/test';
import { importeer, verwachtKaarten } from './hulp.js';

test.describe('importeren', () => {
  test('geldig-5-berichten toont 5 kaarten en een melding', async ({ page }) => {
    await importeer(page, 'geldig-5-berichten.json');
    await verwachtKaarten(page, 5);
    await expect(page.getByTestId('lege-staat')).toBeHidden();
    await expect(page.getByTestId('fout')).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: '5 berichten ingeladen' })).toBeVisible();
  });

  test('fout-6-berichten toont een foutmelding en laadt niets', async ({ page }) => {
    await importeer(page, 'fout-6-berichten.json');
    const fout = page.getByTestId('fout');
    await expect(fout).toBeVisible();
    await expect(fout).toContainText('Dit bestand is niet ingeladen');
    await expect(fout).toContainText('Het bestand heeft 6 berichten; het maximum is 5.');
    await expect(page.getByTestId('kaart')).toHaveCount(0);
    await expect(page.getByTestId('lege-staat')).toBeVisible();
  });

  test('fout-geen-json toont een foutmelding en laadt niets', async ({ page }) => {
    await importeer(page, 'fout-geen-json.txt');
    await expect(page.getByTestId('fout')).toContainText('Het bestand is geen geldige JSON');
    await expect(page.getByTestId('kaart')).toHaveCount(0);
  });

  test('een fout bestand na een geldig concept laat het werk staan', async ({ page }) => {
    await importeer(page, 'geldig-5-berichten.json');
    await verwachtKaarten(page, 5);
    await importeer(page, 'fout-6-berichten.json');
    await expect(page.getByTestId('fout')).toContainText('je huidige werk is onveranderd');
    await verwachtKaarten(page, 5);
  });
});
