import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { importeer, alsBestand, testdata } from './hulp.js';

/**
 * Per status het label en een kernzin uit de uitleg. Bewust hier vastgelegd (en niet uit teksten.js gelezen),
 * zodat de test faalt als een uitlegtekst verdwijnt.
 */
const STATUSSEN = {
  'concept': { label: 'concept', uitleg: 'Nog niet nagekeken' },
  'meer-info-nodig': { label: 'meer informatie nodig', uitleg: 'Vraag de maker om uitleg' },
  'goedgekeurd': { label: 'goedgekeurd', uitleg: 'Alleen deze berichten komen in de uitzending' },
  'uitgesloten': { label: 'uitgesloten', uitleg: 'Met Weer opnemen zet je het terug op concept' },
};

/** Alle knoppen die het Help-paneel moet uitleggen. */
const KNOPPEN = [
  'Concept importeren', 'Help', 'Goedkeuren', 'Terug naar concept', 'Uitsluiten', 'Weer opnemen', 'Bewerken',
  'Bron openen', 'Start uitzending', 'Journaal exporteren', 'Aftellen overslaan', 'Uitzending sluiten',
  'Kopieer overzicht', 'Terug naar de redactie',
];

/**
 * Een concept met elke status één keer (en één extra concept).
 * @returns {object}
 */
function conceptMetAlleStatussen() {
  const concept = JSON.parse(readFileSync(testdata('geldig-5-berichten.json'), 'utf8'));
  ['goedgekeurd', 'concept', 'meer-info-nodig', 'uitgesloten', 'concept']
    .forEach((status, i) => { concept.berichten[i].status = status; });
  return concept;
}

test.describe('de app legt zichzelf uit', () => {
  test('de lege staat toont de 3 stappen en de importknop', async ({ page }) => {
    await page.goto('./');
    const leeg = page.getByTestId('lege-staat');
    await expect(leeg.getByRole('heading', { name: 'Zo maak je een journaal' })).toBeVisible();
    await expect(leeg.getByRole('listitem')).toHaveCount(3);
    await expect(leeg.getByRole('listitem').nth(0)).toContainText('Laat Claude het concept maken');
    await expect(leeg.getByRole('listitem').nth(1)).toContainText('Importeer het concept');
    await expect(leeg.getByRole('listitem').nth(2)).toContainText('Redigeer en zend uit');
    await expect(leeg.getByRole('button', { name: 'Concept importeren' })).toBeVisible();
  });

  test('Help opent met de knop en met ?, sluit met Escape, en legt elke status en knop uit', async ({ page }) => {
    await page.goto('./');
    const help = page.getByRole('dialog', { name: 'Hoe werkt het?' });

    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await expect(help).toBeVisible();
    for (const { label, uitleg } of Object.values(STATUSSEN)) {
      await expect(help.getByText(label, { exact: true })).toBeVisible();
      await expect(help).toContainText(uitleg);
    }
    for (const knop of KNOPPEN) await expect(help, `uitleg bij ${knop}`).toContainText(knop);
    await expect(help).toContainText('Publicatiestatus: niet gecontroleerd');
    await expect(help).toContainText('journaal-concept.json');
    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();
    await expect(page.getByRole('button', { name: 'Help', exact: true })).toBeFocused();

    await page.keyboard.press('?');
    await expect(help).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();
  });

  test('elk statuslabel heeft een uitleg die met toetsenbord en tik opent', async ({ page }, testInfo) => {
    await importeer(page, alsBestand(conceptMetAlleStatussen()));
    const touch = testInfo.project.use.hasTouch;
    for (const { label, uitleg } of Object.values(STATUSSEN)) {
      const icoon = page.getByRole('button', { name: `Uitleg over de status ${label}`, exact: true }).first();
      const tekst = page.locator(`#${await icoon.getAttribute('aria-controls')}`);

      // Toetsenbord: focus en Enter opent, Escape sluit.
      await icoon.focus();
      await page.keyboard.press('Enter');
      await expect(icoon).toHaveAttribute('aria-expanded', 'true');
      await expect(tekst).toBeVisible();
      await expect(tekst).toContainText(uitleg);
      await page.keyboard.press('Escape');
      await expect(tekst).toBeHidden();

      // Tik (touch) of klik.
      if (touch) await icoon.tap(); else await icoon.click();
      await expect(tekst).toBeVisible();
    }
  });

  test('elke knop en elk invoerveld heeft een toegankelijke naam', async ({ page }) => {
    await importeer(page, alsBestand(conceptMetAlleStatussen()));
    // De namen uit de tabel in CLAUDE.md, gezocht zoals een schermlezer of test ze vindt.
    for (const naam of ['Concept importeren', 'Journaal exporteren', 'Help', 'Goedkeuren', 'Terug naar concept',
      'Uitsluiten', 'Weer opnemen', 'Bewerken', 'Start uitzending']) {
      await expect(page.getByRole('button', { name: naam, exact: true }).first(), naam).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Bron openen' }).first()).toBeVisible();

    // Bewerkstand: velden met een zichtbaar label, en Opslaan/Annuleren.
    await page.getByRole('button', { name: 'Bewerken' }).first().click();
    await expect(page.getByRole('textbox', { name: 'Kop' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Uitleg' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Opslaan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Annuleren' })).toBeVisible();

    // En geen enkele zichtbare knop of invoer zonder naam.
    const naamloos = await page.evaluate(() => [...document.querySelectorAll('button, input:not([type=file]), textarea, a[href]')]
      .filter((e) => e.offsetParent !== null)
      .filter((e) => {
        const label = e.labels?.[0]?.textContent ?? '';
        return !(e.getAttribute('aria-label') || e.textContent.trim() || label.trim());
      })
      .map((e) => e.outerHTML.slice(0, 80)));
    expect(naamloos).toEqual([]);
  });

  test('een ongeldig bestand zegt welk bericht en veld fout is, en wat je moet doen', async ({ page }) => {
    await importeer(page, 'fout-ontbrekend-veld.json');
    const fout = page.getByTestId('fout');
    await expect(fout).toBeVisible();
    await expect(fout).toContainText('Bericht 2, veld kop: het verplichte veld kop ontbreekt');
    await expect(fout).toContainText('Pas het bestand aan en kies opnieuw Concept importeren.');
  });

  test('de link naar de handleiding werkt', async ({ page }) => {
    await page.goto('./');
    const link = page.getByTestId('lege-staat').getByRole('link', { name: 'Lees de gebruikershandleiding' });
    await expect(link).toHaveAttribute('href', 'handleiding.html');
    const [handleiding] = await Promise.all([page.context().waitForEvent('page'), link.click()]);
    await expect(handleiding.getByRole('heading', { level: 1 })).toHaveText('Gebruikershandleiding');
    await expect(handleiding.getByRole('link', { name: 'Terug naar de redactie' })).toBeVisible();
  });
});
