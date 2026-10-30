import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { valideerConcept } from '../../public/logic.js';
import { fouten as meldingen } from '../../public/teksten.js';
import { maakTestdata } from '../../scripts/genereer-testdata.js';

/**
 * Leest een bestand uit testdata/.
 * @param {string} naam
 * @returns {string}
 */
function lees(naam) {
  return readFileSync(new URL(`../../testdata/${naam}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
}

/** Per fout bestand precies de fout die het moet geven. */
const VERWACHTE_FOUTEN = {
  'fout-ontbrekend-veld.json': { bericht: 2, veld: 'kop', melding: meldingen.ontbreekt('kop') },
  'fout-verkeerde-url.json': { bericht: 3, veld: 'bronUrl', melding: meldingen.verkeerdeUrl('Cavear/vibe_webshop', 44) },
  'fout-6-berichten.json': { bericht: null, veld: 'berichten', melding: meldingen.teVeel(6) },
  'fout-dubbel-prnummer.json': { bericht: 3, veld: 'prNummer', melding: meldingen.dubbelNummer(42) },
  'fout-buiten-periode.json': { bericht: 2, veld: 'gemergdOp', melding: meldingen.buitenPeriode },
  'fout-geen-json.txt': { bericht: null, veld: 'bestand', melding: meldingen.geenJson },
  'leeg.json': { bericht: null, veld: 'bestand', melding: meldingen.leeg },
};

describe('testdatagenerator', () => {
  test('maakt 9 bestanden', () => {
    expect(Object.keys(maakTestdata())).toHaveLength(9);
  });

  test('de bestanden in testdata/ zijn bijgewerkt (anders: npm run testdata)', () => {
    for (const [naam, inhoud] of Object.entries(maakTestdata())) {
      expect(lees(naam), naam).toBe(inhoud);
    }
  });
});

describe('valideerConcept met de testdata', () => {
  test('geldig-5-berichten.json is geldig en heeft 5 berichten', () => {
    const tekst = lees('geldig-5-berichten.json');
    expect(valideerConcept(tekst)).toEqual({ geldig: true, fouten: [] });
    expect(JSON.parse(tekst).berichten).toHaveLength(5);
  });

  test('geldig-met-meer-info.json is geldig en heeft een meer-info-nodig-bericht', () => {
    const tekst = lees('geldig-met-meer-info.json');
    expect(valideerConcept(tekst)).toEqual({ geldig: true, fouten: [] });
    expect(JSON.parse(tekst).berichten.map((b) => b.status)).toContain('meer-info-nodig');
  });

  test.each(Object.entries(VERWACHTE_FOUTEN))('%s geeft precies de verwachte fout', (naam, verwacht) => {
    expect(valideerConcept(lees(naam))).toEqual({ geldig: false, fouten: [verwacht] });
  });
});
