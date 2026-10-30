import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { maakTotaaloverzicht, exporteerJournaal, valideerConcept, bewerkBericht, wijzigStatus } from '../../public/logic.js';

/**
 * Een verse kopie van een bestand uit testdata/.
 * @param {string} naam
 * @returns {any}
 */
function lees(naam) {
  return JSON.parse(readFileSync(new URL(`../../testdata/${naam}`, import.meta.url), 'utf8'));
}

describe('maakTotaaloverzicht', () => {
  test('per goedgekeurd bericht kop, uitleg en link, genummerd, met de publicatiestatus', () => {
    const berichten = [
      { prNummer: 1, kop: 'Kop een', uitleg: 'Uitleg een.', bronUrl: 'https://github.com/o/r/pull/1', status: 'goedgekeurd' },
      { prNummer: 2, kop: 'Kop twee', uitleg: 'Uitleg twee.', bronUrl: 'https://github.com/o/r/pull/2', status: 'concept' },
      { prNummer: 3, kop: 'Kop drie', uitleg: 'Uitleg drie.', bronUrl: 'https://github.com/o/r/pull/3', status: 'goedgekeurd' },
    ];
    expect(maakTotaaloverzicht(berichten)).toBe(
      '1. Kop een\n   Uitleg een.\n   https://github.com/o/r/pull/1\n\n'
      + '2. Kop drie\n   Uitleg drie.\n   https://github.com/o/r/pull/3\n\n'
      + 'Publicatiestatus: niet gecontroleerd\n'
    );
  });

  test('concept, meer-info-nodig en uitgesloten staan er niet in', () => {
    const { berichten } = lees('geldig-met-meer-info.json');
    const tekst = maakTotaaloverzicht(berichten);
    expect(tekst).toContain(berichten[0].kop);
    for (const b of berichten.slice(1)) {
      expect(tekst).not.toContain(b.kop);
      expect(tekst).not.toContain(b.bronUrl);
    }
  });

  test('de bewerkte kop staat in het overzicht', () => {
    let { berichten } = lees('geldig-5-berichten.json');
    berichten = bewerkBericht(berichten, 43, { kop: 'Voorraad zegt eindelijk wat hij weet' });
    berichten = wijzigStatus(berichten, 43, 'goedgekeurd');
    expect(maakTotaaloverzicht(berichten)).toMatch(/^1\. Voorraad zegt eindelijk wat hij weet\n/);
  });

  test('niets goedgekeurd geeft een lege tekst', () => {
    expect(maakTotaaloverzicht(lees('geldig-5-berichten.json').berichten)).toBe('');
  });
});

describe('exporteerJournaal', () => {
  test('het geëxporteerde bestand slaagt weer voor valideerConcept', () => {
    const concept = lees('geldig-met-meer-info.json');
    let berichten = bewerkBericht(concept.berichten, 43, { kop: 'Nieuwe kop', uitleg: 'Nieuwe uitleg.' });
    berichten = wijzigStatus(berichten, 43, 'goedgekeurd');
    berichten = wijzigStatus(berichten, 44, 'uitgesloten');
    const json = exporteerJournaal(concept, berichten);
    expect(valideerConcept(json)).toEqual({ geldig: true, fouten: [] });
  });

  test('bevat alle berichten met hun bewerkte kop, uitleg en status', () => {
    const concept = lees('geldig-5-berichten.json');
    let berichten = bewerkBericht(concept.berichten, 42, { kop: 'Aangepaste kop' });
    berichten = wijzigStatus(berichten, 42, 'goedgekeurd');
    berichten = wijzigStatus(berichten, 46, 'uitgesloten');
    const uit = JSON.parse(exporteerJournaal(concept, berichten));
    expect(uit.berichten).toHaveLength(5);
    expect(uit.berichten[0]).toMatchObject({ prNummer: 42, kop: 'Aangepaste kop', status: 'goedgekeurd' });
    expect(uit.berichten[4]).toMatchObject({ prNummer: 46, status: 'uitgesloten' });
    expect(uit).toMatchObject({ repository: concept.repository, periode: concept.periode, gegenereerdOp: concept.gegenereerdOp });
  });

  test('velden buiten het contract worden weggelaten, de publicatiestatus blijft niet gecontroleerd', () => {
    const concept = { ...lees('voorbeeld.json'), extra: 'weg' };
    const berichten = concept.berichten.map((b) => ({ ...b, publicatiestatus: 'gecontroleerd', bewerkstand: true }));
    const uit = JSON.parse(exporteerJournaal(concept, berichten));
    expect(uit).not.toHaveProperty('extra');
    expect(uit.berichten[0]).not.toHaveProperty('bewerkstand');
    expect(uit.berichten.map((b) => b.publicatiestatus)).toEqual(Array(3).fill('niet gecontroleerd'));
  });

  test('optionele velden die ontbreken, blijven weg', () => {
    const concept = lees('voorbeeld.json');
    delete concept.gegenereerdOp;
    const uit = JSON.parse(exporteerJournaal(concept, concept.berichten));
    expect(uit).not.toHaveProperty('gegenereerdOp');
    expect(uit.berichten[2]).not.toHaveProperty('voorWie');
  });

  test('de velden staan in de volgorde van het contract', () => {
    const concept = lees('voorbeeld.json');
    const uit = JSON.parse(exporteerJournaal(concept, concept.berichten));
    expect(Object.keys(uit)).toEqual(['repository', 'periode', 'gegenereerdOp', 'berichten']);
    expect(Object.keys(uit.berichten[0])).toEqual([
      'prNummer', 'bronUrl', 'origineleTitel', 'gemergdOp', 'kop', 'uitleg', 'voorWie', 'status', 'publicatiestatus',
    ]);
  });

  test('ongewijzigd exporteren geeft hetzelfde bestand als voorbeeld.json', () => {
    const tekst = readFileSync(new URL('../../testdata/voorbeeld.json', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
    const concept = JSON.parse(tekst);
    expect(JSON.parse(exporteerJournaal(concept, concept.berichten))).toEqual(JSON.parse(tekst));
  });
});
