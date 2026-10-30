/**
 * Gedeelde hulpfuncties voor de UI-tests.
 * @module hulp
 */
import { expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/**
 * Het volledige pad van een bestand in testdata/.
 * @param {string} naam
 * @returns {string}
 */
export function testdata(naam) {
  return fileURLToPath(new URL(`../../testdata/${naam}`, import.meta.url));
}

/**
 * Opent de app en importeert een bestand via de bestandskiezer achter de knop Concept importeren.
 * @param {import('@playwright/test').Page} page
 * @param {string | { name: string, mimeType: string, buffer: Buffer }} bestand naam in testdata/ of een bestand in het geheugen
 */
export async function importeer(page, bestand) {
  if (page.url() === 'about:blank') await page.goto('./');
  await page.setInputFiles('#bestandskiezer', typeof bestand === 'string' ? testdata(bestand) : bestand);
}

/**
 * Een conceptbestand in het geheugen, om in een test te importeren.
 * @param {object} concept
 * @returns {{ name: string, mimeType: string, buffer: Buffer }}
 */
export function alsBestand(concept) {
  return { name: 'journaal-concept.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(concept)) };
}

/**
 * De kaart van een bericht, gevonden via de kop (de toegankelijke naam van het article).
 * @param {import('@playwright/test').Page} page
 * @param {number} pr
 */
export function kaartVan(page, pr) {
  return page.locator(`[data-testid="kaart"][data-pr="${pr}"]`);
}

/**
 * Wacht tot er precies n kaarten staan.
 * @param {import('@playwright/test').Page} page
 * @param {number} n
 */
export async function verwachtKaarten(page, n) {
  await expect(page.getByTestId('kaart')).toHaveCount(n);
}
