import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { importeer, alsBestand, verwachtKaarten, testdata } from './hulp.js';

/** Kolommen per viewport-project (CLAUDE.md: 1 / 2 / 3). */
const KOLOMMEN = { mobiel: 1, tablet: 2, desktop: 3 };

/**
 * Een concept met de langste kop uit de testdata en een kop van 90 tekens (de grens uit CLAUDE.md),
 * beide goedgekeurd, zodat ze in de uitzending komen.
 * @returns {object}
 */
function conceptMetLangeKoppen() {
  const concept = JSON.parse(readFileSync(testdata('geldig-5-berichten.json'), 'utf8'));
  const langste = concept.berichten.reduce((a, b) => (b.kop.length > a.kop.length ? b : a));
  langste.status = 'goedgekeurd';
  const negentig = concept.berichten.find((b) => b !== langste);
  negentig.kop = 'Winkelmandje vergeet voortaan helemaal niets meer, zelfs niet na drie keer verversen ervan!!'.slice(0, 90);
  negentig.status = 'goedgekeurd';
  return concept;
}

/**
 * Controleert wat op elk scherm moet gelden: niet horizontaal scrollen, alle knoppen minstens 44x44,
 * en geen ernstige of kritieke toegankelijkheidsfouten (axe).
 * @param {import('@playwright/test').Page} page
 * @param {string} scherm naam voor de foutmelding
 */
async function controleerScherm(page, scherm) {
  const breedte = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(breedte.scroll, `${scherm}: horizontaal scrollen`).toBeLessThanOrEqual(breedte.client);
  // De uitzending is een vaste laag met overflow: hidden; te brede inhoud zou daar weggeknipt worden in plaats
  // van te scrollen. Meet daarom ook dat geen zichtbaar element rechts buiten beeld valt.
  const buitenBeeld = await page.evaluate(() => [...document.querySelectorAll('#uitzending:not([hidden]) .uitzending__frame *')]
    .filter((e) => e.getClientRects().length && e.getBoundingClientRect().right > innerWidth + 1)
    .map((e) => e.tagName + '.' + e.className));
  expect(buitenBeeld, `${scherm}: buiten beeld`).toEqual([]);

  const teKlein = await page.evaluate(() => [...document.querySelectorAll('button, a.knop, [role=button], summary')]
    .filter((e) => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden')
    .map((e) => ({ tekst: e.textContent.trim() || e.getAttribute('aria-label'), r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.width < 44 || r.height < 44)
    .map(({ tekst, r }) => `${tekst} (${Math.round(r.width)}x${Math.round(r.height)})`));
  expect(teKlein, `${scherm}: knoppen kleiner dan 44x44`).toEqual([]);

  const { violations } = await new AxeBuilder({ page }).analyze();
  const ernstig = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.length}x (${v.help})`);
  expect(ernstig, `${scherm}: axe`).toEqual([]);
}

test.describe('responsive en toegankelijk', () => {
  test('lege staat', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByTestId('lege-staat')).toBeVisible();
    await controleerScherm(page, 'lege staat');
  });

  test('redactie met 5 berichten: kolommen per viewport', async ({ page }, testInfo) => {
    await importeer(page, 'geldig-5-berichten.json');
    await verwachtKaarten(page, 5);
    const kolommen = await page.getByTestId('kaart').evaluateAll((kaarten) =>
      new Set(kaarten.map((k) => Math.round(k.getBoundingClientRect().left))).size);
    expect(kolommen).toBe(KOLOMMEN[testInfo.project.name]);
    await controleerScherm(page, 'redactie');
  });

  test('Help-paneel', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Hoe werkt het?' })).toBeVisible();
    await controleerScherm(page, 'help');
  });

  test('bewerkstand en opengeklapte uitleg bij een status', async ({ page }) => {
    await importeer(page, 'geldig-5-berichten.json');
    await verwachtKaarten(page, 5);
    await page.getByRole('button', { name: 'Uitleg over de status concept' }).first().click();
    await page.getByRole('button', { name: 'Bewerken' }).first().click();
    await expect(page.getByRole('textbox', { name: 'Kop' })).toBeVisible();
    await controleerScherm(page, 'bewerkstand');
  });

  test('foutmelding na een ongeldig bestand', async ({ page }) => {
    await importeer(page, 'fout-21-berichten.json');
    await expect(page.getByTestId('fout')).toBeVisible();
    await controleerScherm(page, 'foutmelding');
  });

  test('elk uitzendframe, ook met de langste koppen', async ({ page }) => {
    await importeer(page, alsBestand(conceptMetLangeKoppen()));
    await page.getByRole('button', { name: 'Start uitzending' }).click();
    await expect(page.getByRole('timer')).toBeVisible();
    await controleerScherm(page, 'leader');

    await page.getByRole('button', { name: 'Aftellen overslaan' }).click();
    await controleerScherm(page, 'titelkaart');

    for (let i = 0; i < 2; i += 1) {
      await page.getByRole('button', { name: 'Volgende' }).click();
      const frame = page.getByTestId('nieuwsframe');
      await expect(frame).toBeVisible();
      // De hele kop staat binnen beeld en boven de lopende balk.
      const binnen = await page.evaluate(() => {
        const kop = document.querySelector('.nieuwsframe__kop').getBoundingClientRect();
        const balk = document.querySelector('.balk').getBoundingClientRect();
        return kop.left >= 0 && kop.right <= innerWidth && kop.top >= 0 && kop.bottom <= balk.top;
      });
      expect(binnen, `kop van bericht ${i + 1} binnen beeld`).toBe(true);
      await controleerScherm(page, `nieuwsframe ${i + 1}`);
    }

    await page.getByRole('button', { name: 'Volgende' }).click();
    await expect(page.getByTestId('totaaloverzicht')).toBeVisible();
    await controleerScherm(page, 'eindscherm');
  });

  test('vegen naar links werkt als Volgende op mobiel', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobiel', 'vegen is een touchgebaar');
    await importeer(page, alsBestand(conceptMetLangeKoppen()));
    await page.getByRole('button', { name: 'Start uitzending' }).click();
    await page.getByRole('button', { name: 'Aftellen overslaan' }).click();
    const uitzending = page.getByTestId('uitzending');
    const veeg = (van, naar) => uitzending.evaluate((el, [x1, x2]) => {
      el.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', clientX: x1, clientY: 400, bubbles: true }));
      el.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', clientX: x2, clientY: 410, bubbles: true }));
    }, [van, naar]);

    await veeg(300, 280); // te kort: blijft op de titelkaart
    await expect(page.getByTestId('nieuwsframe')).toHaveCount(0);
    await veeg(320, 60); // naar links: Volgende
    await expect(page.getByTestId('nieuwsframe')).toContainText('BERICHT 1 VAN 2');
  });

  test.describe('met reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('animaties staan uit; de leader telt wel', async ({ page }) => {
      await importeer(page, alsBestand(conceptMetLangeKoppen()));
      await page.getByRole('button', { name: 'Start uitzending' }).click();
      const animaties = await page.evaluate(() => ['.effect-flikker', '.effect-kras', '.balk__loop', '.leader__cijfer']
        .map((s) => getComputedStyle(document.querySelector(s)).animationName));
      expect(animaties).toEqual(['none', 'none', 'none', 'none']);
      await expect(page.getByRole('timer')).toHaveText('2', { timeout: 2500 });
    });
  });

  test('zonder reduced motion lopen de animaties', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await importeer(page, alsBestand(conceptMetLangeKoppen()));
    await page.getByRole('button', { name: 'Start uitzending' }).click();
    const animaties = await page.evaluate(() => ['.effect-flikker', '.effect-kras', '.balk__loop', '.leader__cijfer']
      .map((s) => getComputedStyle(document.querySelector(s)).animationName));
    expect(animaties).toEqual(['flikker', 'kras', 'schuif', 'pols']);
  });

  test.describe('telefoon liggend (844x390)', () => {
    test.use({ viewport: { width: 844, height: 390 } });

    test('een kop van 90 tekens past binnen beeld en boven de balk', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobiel', 'liggend is een telefoonmaat');
      await importeer(page, alsBestand(conceptMetLangeKoppen()));
      await page.getByRole('button', { name: 'Start uitzending' }).click();
      await page.getByRole('button', { name: 'Aftellen overslaan' }).click();
      for (let i = 0; i < 2; i += 1) {
        await page.getByRole('button', { name: 'Volgende' }).click();
        await expect(page.getByTestId('nieuwsframe')).toBeVisible();
        const binnen = await page.evaluate(() => {
          const kop = document.querySelector('.nieuwsframe__kop').getBoundingClientRect();
          const balk = document.querySelector('.balk').getBoundingClientRect();
          return kop.left >= 0 && kop.right <= innerWidth && kop.top >= 0 && kop.bottom <= balk.top;
        });
        expect(binnen, `kop van bericht ${i + 1} liggend binnen beeld`).toBe(true);
        await controleerScherm(page, `liggend nieuwsframe ${i + 1}`);
      }
      await page.getByRole('button', { name: 'Volgende' }).click();
      await controleerScherm(page, 'liggend eindscherm');
    });
  });
});
