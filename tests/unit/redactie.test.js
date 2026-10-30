import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { selecteerUitzending, bewerkBericht, wijzigStatus, OVERGANGEN, STATUSSEN } from '../../public/logic.js';

/**
 * De berichten uit testdata/geldig-5-berichten.json (allemaal concept).
 * @returns {any[]}
 */
function vijfBerichten() {
  const tekst = readFileSync(new URL('../../testdata/geldig-5-berichten.json', import.meta.url), 'utf8');
  return JSON.parse(tekst).berichten;
}

describe('selecteerUitzending', () => {
  test('conceptberichten komen niet in de uitzending', () => {
    const berichten = [
      { prNummer: 1, status: 'goedgekeurd' },
      { prNummer: 2, status: 'concept' },
      { prNummer: 3, status: 'uitgesloten' },
    ];
    expect(selecteerUitzending(berichten).map((b) => b.prNummer)).toEqual([1]);
  });

  test('meer-info-nodig komt ook niet in de uitzending', () => {
    const berichten = [
      { prNummer: 1, status: 'meer-info-nodig' },
      { prNummer: 2, status: 'goedgekeurd' },
    ];
    expect(selecteerUitzending(berichten).map((b) => b.prNummer)).toEqual([2]);
  });

  test('de volgorde van de redactietafel blijft behouden', () => {
    const berichten = [
      { prNummer: 46, status: 'goedgekeurd' },
      { prNummer: 42, status: 'concept' },
      { prNummer: 44, status: 'goedgekeurd' },
      { prNummer: 43, status: 'goedgekeurd' },
    ];
    expect(selecteerUitzending(berichten).map((b) => b.prNummer)).toEqual([46, 44, 43]);
  });

  test('niets goedgekeurd geeft een lege lijst', () => {
    expect(selecteerUitzending(vijfBerichten())).toEqual([]);
  });

  test('de originele lijst blijft ongewijzigd', () => {
    const berichten = [{ prNummer: 1, status: 'goedgekeurd' }, { prNummer: 2, status: 'concept' }];
    const kopie = structuredClone(berichten);
    selecteerUitzending(berichten);
    expect(berichten).toEqual(kopie);
  });
});

describe('bewerkBericht', () => {
  test('een aangepaste kop blijft bewaard, de rest blijft gelijk', () => {
    const berichten = vijfBerichten();
    const na = bewerkBericht(berichten, 43, { kop: 'Voorraadteller zet de deur op een kier' });
    const bericht = na.find((b) => b.prNummer === 43);
    expect(bericht.kop).toBe('Voorraadteller zet de deur op een kier');
    expect(bericht.uitleg).toBe(berichten[1].uitleg);
    expect(bericht.status).toBe('concept');
    expect(na.filter((b) => b.prNummer !== 43)).toEqual(berichten.filter((b) => b.prNummer !== 43));
  });

  test('kop en uitleg tegelijk aanpassen, met spaties weggehaald', () => {
    const na = bewerkBericht(vijfBerichten(), 42, { kop: '  Nieuwe kop ', uitleg: ' Nieuwe uitleg.  ' });
    expect(na[0]).toMatchObject({ kop: 'Nieuwe kop', uitleg: 'Nieuwe uitleg.' });
  });

  test('de aanpassing blijft bewaard na een statuswijziging', () => {
    let berichten = bewerkBericht(vijfBerichten(), 44, { uitleg: 'Aangevuld na overleg met de maker.' });
    berichten = wijzigStatus(berichten, 44, 'goedgekeurd');
    expect(selecteerUitzending(berichten)).toEqual([
      expect.objectContaining({ prNummer: 44, uitleg: 'Aangevuld na overleg met de maker.', status: 'goedgekeurd' }),
    ]);
  });

  test('alleen kop en uitleg zijn te bewerken', () => {
    const na = bewerkBericht(vijfBerichten(), 42, { kop: 'Andere kop', status: 'goedgekeurd', prNummer: 99 });
    expect(na[0]).toMatchObject({ prNummer: 42, status: 'concept', kop: 'Andere kop' });
  });

  test('de originele lijst blijft ongewijzigd', () => {
    const berichten = vijfBerichten();
    const kopie = structuredClone(berichten);
    bewerkBericht(berichten, 42, { kop: 'Andere kop' });
    expect(berichten).toEqual(kopie);
  });

  test.each(['kop', 'uitleg'])('een lege %s mag niet', (veld) => {
    expect(() => bewerkBericht(vijfBerichten(), 42, { [veld]: '   ' })).toThrow(RangeError);
  });

  test.each([null, 5])('een kop die geen tekst is (%s) mag niet', (waarde) => {
    expect(() => bewerkBericht(vijfBerichten(), 42, { kop: waarde })).toThrow(RangeError);
  });

  test('zonder wijziging blijft het bericht gelijk', () => {
    const berichten = vijfBerichten();
    expect(bewerkBericht(berichten, 42)).toEqual(berichten);
  });

  test('een goedgekeurd bericht blijft na bewerken goedgekeurd', () => {
    const berichten = wijzigStatus(vijfBerichten(), 42, 'goedgekeurd');
    const na = bewerkBericht(berichten, 42, { kop: 'Scherpere kop' });
    expect(na[0]).toMatchObject({ kop: 'Scherpere kop', status: 'goedgekeurd' });
  });

  test('een onbekend PR-nummer geeft een fout', () => {
    expect(() => bewerkBericht(vijfBerichten(), 999, { kop: 'x' })).toThrow(RangeError);
  });
});

describe('wijzigStatus', () => {
  test.each([
    ['concept', 'goedgekeurd'],
    ['concept', 'uitgesloten'],
    ['meer-info-nodig', 'goedgekeurd'],
    ['meer-info-nodig', 'uitgesloten'],
    ['goedgekeurd', 'concept'],
    ['goedgekeurd', 'uitgesloten'],
    ['uitgesloten', 'concept'],
  ])('van %s naar %s mag', (van, naar) => {
    const na = wijzigStatus([{ prNummer: 1, status: van }], 1, naar);
    expect(na[0].status).toBe(naar);
  });

  test.each([
    ['uitgesloten', 'goedgekeurd'],
    ['concept', 'concept'],
    ['goedgekeurd', 'goedgekeurd'],
    ['concept', 'meer-info-nodig'],
    ['concept', 'gepubliceerd'],
  ])('van %s naar %s mag niet', (van, naar) => {
    expect(() => wijzigStatus([{ prNummer: 1, status: van }], 1, naar)).toThrow(RangeError);
  });

  test('elke status heeft overgangen', () => {
    expect(Object.keys(OVERGANGEN).sort()).toEqual([...STATUSSEN].sort());
  });

  test('de overgangen zijn van buitenaf niet aan te passen', () => {
    expect(Object.isFrozen(OVERGANGEN)).toBe(true);
    expect(Object.isFrozen(OVERGANGEN.uitgesloten)).toBe(true);
  });

  test('een bericht met een onbekende status kan nergens heen', () => {
    expect(() => wijzigStatus([{ prNummer: 1, status: 'raar' }], 1, 'concept')).toThrow(RangeError);
  });

  test('alleen het gekozen bericht verandert, en de originele lijst blijft gelijk', () => {
    const berichten = vijfBerichten();
    const kopie = structuredClone(berichten);
    const na = wijzigStatus(berichten, 45, 'goedgekeurd');
    expect(na.map((b) => b.status)).toEqual(['concept', 'concept', 'concept', 'goedgekeurd', 'concept']);
    expect(berichten).toEqual(kopie);
  });

  test('goedkeuren, uitsluiten en weer opnemen achter elkaar', () => {
    let berichten = vijfBerichten();
    berichten = wijzigStatus(berichten, 42, 'goedgekeurd');
    berichten = wijzigStatus(berichten, 42, 'uitgesloten');
    expect(selecteerUitzending(berichten)).toEqual([]);
    berichten = wijzigStatus(berichten, 42, 'concept');
    expect(berichten[0].status).toBe('concept');
  });

  test('een onbekend PR-nummer geeft een fout', () => {
    expect(() => wijzigStatus(vijfBerichten(), 999, 'goedgekeurd')).toThrow(RangeError);
  });
});
