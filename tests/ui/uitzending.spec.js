import { test, expect } from '@playwright/test';
import { importeer, kaartVan, verwachtKaarten } from './hulp.js';

const NIEUWE_KOP = 'Adresboek houdt voortaan alles netjes vast';

/**
 * Zet de redactie klaar: #42 krijgt een nieuwe kop en wordt goedgekeurd, #43 wordt uitgesloten,
 * de rest blijft concept.
 * @param {import('@playwright/test').Page} page
 */
async function redigeer(page) {
  await importeer(page, 'geldig-5-berichten.json');
  await verwachtKaarten(page, 5);
  const k42 = kaartVan(page, 42);
  await k42.getByRole('button', { name: 'Bewerken' }).click();
  await k42.getByLabel('Kop').fill(NIEUWE_KOP);
  await k42.getByRole('button', { name: 'Opslaan' }).click();
  await expect(k42.getByRole('heading', { level: 3 })).toHaveText(NIEUWE_KOP);
  await k42.getByRole('button', { name: 'Goedkeuren' }).click();
  await kaartVan(page, 43).getByRole('button', { name: 'Uitsluiten' }).click();
  await expect(page.getByTestId('teller')).toContainText('1 van 5 goedgekeurd');
}

/**
 * Start de uitzending en gaat via Aftellen overslaan naar de titelkaart.
 * @param {import('@playwright/test').Page} page
 */
async function startTotTitelkaart(page) {
  await page.getByRole('button', { name: 'Start uitzending' }).click();
  const uitzending = page.getByTestId('uitzending');
  await expect(uitzending).toBeVisible();
  await uitzending.getByRole('button', { name: 'Aftellen overslaan' }).click();
  await expect(uitzending.getByRole('heading', { level: 1 })).toHaveText(/uit de werkplaats/i);
}

test.describe('redactie en uitzending', () => {
  test('alleen het goedgekeurde bericht verschijnt, met de aangepaste kop', async ({ page }) => {
    await redigeer(page);
    await startTotTitelkaart(page);
    await expect(page.getByTestId('uitzending')).toContainText('Release van 30 oktober 2026 · 1 bericht');

    await page.getByRole('button', { name: 'Volgende' }).click();
    const frame = page.getByTestId('nieuwsframe');
    await expect(frame.getByRole('heading', { level: 1 })).toHaveText(NIEUWE_KOP);
    await expect(frame).toContainText('BERICHT 1 VAN 1');
    await expect(frame).toContainText('Publicatiestatus: niet gecontroleerd');

    // Bronlink: wijst naar de PR en opent in een nieuw tabblad.
    const bron = frame.getByRole('link', { name: /PR #42/ });
    await expect(bron).toHaveAttribute('href', 'https://github.com/Cavear/vibe_webshop/pull/42');
    await expect(bron).toHaveAttribute('target', '_blank');

    // Volgende naar het eindscherm met het totaaloverzicht.
    await page.getByRole('button', { name: 'Volgende' }).click();
    const overzicht = page.getByTestId('totaaloverzicht');
    await expect(overzicht).toContainText(NIEUWE_KOP);
    await expect(overzicht).toContainText('https://github.com/Cavear/vibe_webshop/pull/42');
    await expect(overzicht).not.toContainText('Voorraad komt uit de schaduw');
    await expect(page.getByRole('listitem').filter({ hasText: 'pull/' })).toHaveCount(1);
  });

  test('Kopieer overzicht zet het totaaloverzicht op het klembord', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'klembordrechten alleen in Chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await redigeer(page);
    await startTotTitelkaart(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: 'Kopieer overzicht' }).click();
    await expect(page.getByRole('button', { name: 'Gekopieerd' })).toBeVisible();
    // Het Windows-klembord maakt van elke regelovergang \r\n; normaliseer dat.
    const klembord = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');
    expect(klembord).toBe(`1. ${NIEUWE_KOP}\n   Na het wijzigen van een adres blijven de gegevens bewaard na verversen.\n   https://github.com/Cavear/vibe_webshop/pull/42\n\nPublicatiestatus: niet gecontroleerd\n`);
  });

  test('Volgende werkt met pijltje rechts; Esc sluit met de focus op Start uitzending', async ({ page }) => {
    await redigeer(page);
    await startTotTitelkaart(page);
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('nieuwsframe')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('totaaloverzicht')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('uitzending')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Start uitzending' })).toBeFocused();
  });

  test('de aftelleader gaat vanzelf door naar de titelkaart', async ({ page }) => {
    await redigeer(page);
    await page.getByRole('button', { name: 'Start uitzending' }).click();
    await expect(page.getByRole('timer')).toHaveText('3');
    await expect(page.getByTestId('uitzending').getByRole('heading', { level: 1 })).toHaveText(/uit de werkplaats/i, { timeout: 6000 });
  });

  test('de muziekknop zet de muziek uit en aan, ook met M, en onthoudt de keuze', async ({ page }) => {
    await redigeer(page);
    await startTotTitelkaart(page);
    const uitzending = page.getByTestId('uitzending');
    await uitzending.getByRole('button', { name: 'Muziek uit' }).click();
    await expect(uitzending.getByRole('button', { name: 'Muziek aan' })).toBeVisible();
    await expect(page.locator('#melding')).toHaveText('De muziek staat uit.');
    await page.keyboard.press('m');
    await expect(uitzending.getByRole('button', { name: 'Muziek uit' })).toBeVisible();
    await expect(page.locator('#melding')).toHaveText('De muziek staat aan.');

    // Uit blijft uit bij de volgende uitzending.
    await page.keyboard.press('m');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Start uitzending' }).click();
    await expect(uitzending.getByRole('button', { name: 'Muziek aan' })).toBeVisible();
  });

  test('Start uitzending staat uit zolang er niets is goedgekeurd', async ({ page }) => {
    await importeer(page, 'geldig-5-berichten.json');
    await expect(page.getByRole('button', { name: 'Start uitzending' })).toBeDisabled();
    await expect(page.getByTestId('teller')).toContainText('Keur minstens één bericht goed');
  });
});
