// Stap 5.3 — de hele flow op de test-URL, per stap en viewport een screenshot.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Gebruik: node testbewijs/stap-5.3/maak-screenshots.mjs (vanuit de root van de repo).
// Gemaakt met een Playwright-script in plaats van de Playwright MCP: dezelfde browser, maar in één keer voor drie viewports.
const ADRES = 'http://app1-test.caitlinveenendaal.nl/';
const DATA = fileURLToPath(new URL('../../testdata/geldig-5-berichten.json', import.meta.url));
const DOEL = 'testbewijs/stap-5.3';
mkdirSync(DOEL, { recursive: true });
const viewports = [
  { naam: 'mobiel', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { naam: 'tablet', viewport: { width: 768, height: 1024 }, hasTouch: true },
  { naam: 'desktop', viewport: { width: 1440, height: 900 } },
];
const browser = await chromium.launch();
for (const v of viewports) {
  const { naam, ...opties } = v;
  const context = await browser.newContext({ ...opties, reducedMotion: 'reduce' });
  const p = await context.newPage();
  const foto = async (nr, stap) => {
    await p.evaluate(() => { document.getElementById('melding').textContent = ''; });
    await p.screenshot({ path: `${DOEL}/${nr}-${stap}-${naam}.jpg`, type: 'jpeg', quality: 80 });
  };
  await p.goto(ADRES);
  await p.evaluate('document.fonts.ready');
  await foto('01', 'lege-staat');

  await p.setInputFiles('#bestandskiezer', DATA);
  await p.waitForSelector('[data-testid="kaart"]');
  await foto('02', 'geimporteerd');

  const k42 = p.locator('[data-pr="42"]');
  await k42.getByRole('button', { name: 'Bewerken' }).click();
  await k42.getByLabel('Kop').fill('Adresboek houdt voortaan alles netjes vast');
  await k42.locator('[data-bewerk]').scrollIntoViewIfNeeded();
  await foto('03', 'bewerken');
  await k42.getByRole('button', { name: 'Opslaan' }).click();
  await k42.getByRole('button', { name: 'Goedkeuren' }).click();
  await p.locator('[data-pr="43"]').getByRole('button', { name: 'Goedkeuren' }).click();
  await p.locator('[data-pr="44"]').getByRole('button', { name: 'Uitsluiten' }).click();
  await p.locator('[data-pr="42"]').scrollIntoViewIfNeeded();
  await foto('04', 'geredigeerd');

  await p.getByRole('button', { name: 'Start uitzending' }).click();
  await p.getByRole('timer').waitFor();
  await foto('05', 'uitzending-leader');
  await p.getByRole('button', { name: 'Aftellen overslaan' }).click();
  await foto('06', 'uitzending-titelkaart');
  await p.getByRole('button', { name: 'Volgende' }).click();
  await foto('07', 'uitzending-bericht-1');
  await p.getByRole('button', { name: 'Volgende' }).click();
  await foto('08', 'uitzending-bericht-2');
  await p.getByRole('button', { name: 'Volgende' }).click();
  await p.getByTestId('totaaloverzicht').waitFor();
  await foto('09', 'uitzending-eindscherm');
  await context.close();
  console.log(`${naam}: 9 screenshots`);
}
await browser.close();
