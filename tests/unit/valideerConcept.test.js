import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { valideerConcept } from '../../public/logic.js';
import { fouten as meldingen } from '../../public/teksten.js';

const voorbeeldTekst = readFileSync(new URL('../../testdata/voorbeeld.json', import.meta.url), 'utf8');

/**
 * Een verse kopie van voorbeeld.json, die een test mag aanpassen.
 * @returns {any}
 */
function voorbeeld() {
  return JSON.parse(voorbeeldTekst);
}

/**
 * Controleert dat er precies één fout is, met dit bericht, veld en deze melding.
 * @param {any} invoer
 * @param {{ bericht: number|null, veld: string, melding: string }} verwacht
 */
function verwachtEenFout(invoer, verwacht) {
  const uitkomst = valideerConcept(invoer);
  expect(uitkomst.geldig).toBe(false);
  expect(uitkomst.fouten).toEqual([verwacht]);
}

describe('valideerConcept: geldige bestanden', () => {
  test('voorbeeld.json als tekst is geldig', () => {
    expect(valideerConcept(voorbeeldTekst)).toEqual({ geldig: true, fouten: [] });
  });

  test('voorbeeld.json als object is geldig', () => {
    expect(valideerConcept(voorbeeld())).toEqual({ geldig: true, fouten: [] });
  });

  test('nul berichten is geldig (de app toont dan de lege staat)', () => {
    const c = voorbeeld();
    c.berichten = [];
    expect(valideerConcept(c).geldig).toBe(true);
  });

  test('optionele velden mogen ontbreken', () => {
    const c = voorbeeld();
    delete c.gegenereerdOp;
    delete c.berichten[0].gemergdOp;
    delete c.berichten[0].voorWie;
    delete c.berichten[0].publicatiestatus;
    expect(valideerConcept(c).geldig).toBe(true);
  });

  test('een andere publicatiestatus is geen fout', () => {
    const c = voorbeeld();
    c.berichten[0].publicatiestatus = 'gecontroleerd';
    expect(valideerConcept(c).geldig).toBe(true);
  });

  test('gemergdOp precies op de grens van de periode is geldig', () => {
    const c = voorbeeld();
    c.berichten[0].gemergdOp = c.periode.van;
    c.berichten[1].gemergdOp = c.periode.tot;
    expect(valideerConcept(c).geldig).toBe(true);
  });
});

describe('valideerConcept: fouten in het hele bestand', () => {
  test('leeg bestand', () => {
    verwachtEenFout('   ', { bericht: null, veld: 'bestand', melding: meldingen.leeg });
  });

  test('geen geldige JSON', () => {
    verwachtEenFout('{ dit is geen json', { bericht: null, veld: 'bestand', melding: meldingen.geenJson });
  });

  test('JSON zonder object, bijvoorbeeld een lijst', () => {
    verwachtEenFout('[]', { bericht: null, veld: 'bestand', melding: meldingen.verkeerdType('bestand') });
  });

  test.each(['repository', 'periode', 'berichten'])('verplicht veld %s ontbreekt', (veld) => {
    const c = voorbeeld();
    delete c[veld];
    verwachtEenFout(c, { bericht: null, veld, melding: meldingen.ontbreekt(veld) });
  });

  test('repository zonder owner/repo-vorm', () => {
    const c = voorbeeld();
    c.repository = 'vibe_webshop';
    verwachtEenFout(c, { bericht: null, veld: 'repository', melding: meldingen.verkeerdType('repository') });
  });

  test('periode.van ontbreekt', () => {
    const c = voorbeeld();
    delete c.periode.van;
    verwachtEenFout(c, { bericht: null, veld: 'periode.van', melding: meldingen.ontbreekt('periode.van') });
  });

  test('periode.tot is geen geldige tijd', () => {
    const c = voorbeeld();
    c.periode.tot = 'vanmiddag';
    verwachtEenFout(c, { bericht: null, veld: 'periode.tot', melding: meldingen.verkeerdType('periode.tot') });
  });

  test('periode.van ligt na periode.tot', () => {
    const c = voorbeeld();
    [c.periode.van, c.periode.tot] = [c.periode.tot, c.periode.van];
    verwachtEenFout(c, { bericht: null, veld: 'periode', melding: meldingen.periodeOmgedraaid });
  });

  test('gegenereerdOp is geen geldige tijd', () => {
    const c = voorbeeld();
    c.gegenereerdOp = 'gisteren';
    verwachtEenFout(c, { bericht: null, veld: 'gegenereerdOp', melding: meldingen.verkeerdType('gegenereerdOp') });
  });

  test('berichten is geen lijst', () => {
    const c = voorbeeld();
    c.berichten = {};
    verwachtEenFout(c, { bericht: null, veld: 'berichten', melding: meldingen.verkeerdType('berichten') });
  });

  test('6 berichten is te veel', () => {
    const c = voorbeeld();
    for (let nr = 45; nr <= 47; nr++) {
      c.berichten.push({ ...c.berichten[0], prNummer: nr, bronUrl: `https://github.com/Cavear/vibe_webshop/pull/${nr}` });
    }
    verwachtEenFout(c, { bericht: null, veld: 'berichten', melding: meldingen.teVeel(6) });
  });
});

describe('valideerConcept: fouten in een bericht', () => {
  test.each(['prNummer', 'bronUrl', 'origineleTitel', 'kop', 'uitleg', 'status'])(
    'verplicht veld %s ontbreekt in bericht 2',
    (veld) => {
      const c = voorbeeld();
      delete c.berichten[1][veld];
      const uitkomst = valideerConcept(c);
      expect(uitkomst.geldig).toBe(false);
      expect(uitkomst.fouten).toContainEqual({ bericht: 2, veld, melding: meldingen.ontbreekt(veld) });
    }
  );

  test('lege kop telt als ontbrekend', () => {
    const c = voorbeeld();
    c.berichten[0].kop = '  ';
    verwachtEenFout(c, { bericht: 1, veld: 'kop', melding: meldingen.ontbreekt('kop') });
  });

  test('prNummer als tekst ("43") is fout', () => {
    const c = voorbeeld();
    c.berichten[1].prNummer = '43';
    verwachtEenFout(c, { bericht: 2, veld: 'prNummer', melding: meldingen.verkeerdType('prNummer') });
  });

  test('dubbel prNummer wordt bij het tweede bericht gemeld', () => {
    const c = voorbeeld();
    c.berichten[2].prNummer = 42;
    c.berichten[2].bronUrl = 'https://github.com/Cavear/vibe_webshop/pull/42';
    verwachtEenFout(c, { bericht: 3, veld: 'prNummer', melding: meldingen.dubbelNummer(42) });
  });

  test('bronUrl naar een andere repository', () => {
    const c = voorbeeld();
    c.berichten[0].bronUrl = 'https://github.com/iemand/anders/pull/42';
    verwachtEenFout(c, { bericht: 1, veld: 'bronUrl', melding: meldingen.verkeerdeUrl('Cavear/vibe_webshop', 42) });
  });

  test('bronUrl met een ander PR-nummer', () => {
    const c = voorbeeld();
    c.berichten[0].bronUrl = 'https://github.com/Cavear/vibe_webshop/pull/420';
    verwachtEenFout(c, { bericht: 1, veld: 'bronUrl', melding: meldingen.verkeerdeUrl('Cavear/vibe_webshop', 42) });
  });

  test('onbekende status', () => {
    const c = voorbeeld();
    c.berichten[0].status = 'gepubliceerd';
    verwachtEenFout(c, { bericht: 1, veld: 'status', melding: meldingen.onbekendeStatus('gepubliceerd') });
  });

  test('gemergdOp buiten de periode', () => {
    const c = voorbeeld();
    c.berichten[2].gemergdOp = '2026-10-30T14:00:00+01:00';
    verwachtEenFout(c, { bericht: 3, veld: 'gemergdOp', melding: meldingen.buitenPeriode });
  });

  test('gemergdOp is geen geldige tijd', () => {
    const c = voorbeeld();
    c.berichten[0].gemergdOp = '30-10-2026';
    verwachtEenFout(c, { bericht: 1, veld: 'gemergdOp', melding: meldingen.verkeerdType('gemergdOp') });
  });

  test('een bericht dat geen object is', () => {
    const c = voorbeeld();
    c.berichten[1] = 'los bericht';
    verwachtEenFout(c, { bericht: 2, veld: 'bericht', melding: meldingen.verkeerdType('bericht') });
  });

  test('meerdere fouten komen allemaal terug, elk met bericht en veld', () => {
    const c = voorbeeld();
    delete c.berichten[0].kop;
    c.berichten[2].status = 'klaar';
    const { geldig, fouten } = valideerConcept(c);
    expect(geldig).toBe(false);
    expect(fouten).toEqual([
      { bericht: 1, veld: 'kop', melding: meldingen.ontbreekt('kop') },
      { bericht: 3, veld: 'status', melding: meldingen.onbekendeStatus('klaar') },
    ]);
  });

  test('de foutregel voor de UI noemt bericht en veld', () => {
    const c = voorbeeld();
    delete c.berichten[1].uitleg;
    const [fout] = valideerConcept(c).fouten;
    expect(meldingen.regel(fout)).toBe('Bericht 2, veld uitleg: het verplichte veld uitleg ontbreekt');
  });
});

describe('valideerConcept: regel 9, verkeerde typen en randgevallen', () => {
  test.each([0, 1.5, -3, null])('prNummer %s is fout', (waarde) => {
    const c = voorbeeld();
    c.berichten[0].prNummer = waarde;
    verwachtEenFout(c, { bericht: 1, veld: 'prNummer', melding: meldingen.verkeerdType('prNummer') });
  });

  test('tekstveld dat geen tekst is (kop: 5)', () => {
    const c = voorbeeld();
    c.berichten[0].kop = 5;
    verwachtEenFout(c, { bericht: 1, veld: 'kop', melding: meldingen.verkeerdType('kop') });
  });

  test('voorWie dat geen tekst is', () => {
    const c = voorbeeld();
    c.berichten[0].voorWie = ['klanten'];
    verwachtEenFout(c, { bericht: 1, veld: 'voorWie', melding: meldingen.verkeerdType('voorWie') });
  });

  test('status met een spatie erachter is onbekend', () => {
    const c = voorbeeld();
    c.berichten[0].status = 'concept ';
    verwachtEenFout(c, { bericht: 1, veld: 'status', melding: meldingen.onbekendeStatus('concept ') });
  });

  test('periode die geen object is', () => {
    const c = voorbeeld();
    c.periode = '30 oktober';
    verwachtEenFout(c, { bericht: null, veld: 'periode', melding: meldingen.verkeerdType('periode') });
  });

  test('periode.tot ontbreekt', () => {
    const c = voorbeeld();
    delete c.periode.tot;
    verwachtEenFout(c, { bericht: null, veld: 'periode.tot', melding: meldingen.ontbreekt('periode.tot') });
  });

  test('repository met alleen spaties telt als ontbrekend', () => {
    const c = voorbeeld();
    c.repository = '   ';
    expect(valideerConcept(c).fouten[0]).toEqual({ bericht: null, veld: 'repository', melding: meldingen.ontbreekt('repository') });
  });

  test('bronUrl met alleen spaties geeft één fout, geen twee', () => {
    const c = voorbeeld();
    c.berichten[0].bronUrl = '  ';
    verwachtEenFout(c, { bericht: 1, veld: 'bronUrl', melding: meldingen.ontbreekt('bronUrl') });
  });

  test.each([
    ['zonder tijdzone', '2026-10-30T09:40:00'],
    ['30 februari', '2026-02-30T09:40:00Z'],
    ['maand 13', '2026-13-01T09:40:00Z'],
    ['uur 25', '2026-10-30T25:00:00+01:00'],
  ])('gemergdOp %s is geen geldige tijd', (_, waarde) => {
    const c = voorbeeld();
    c.berichten[0].gemergdOp = waarde;
    verwachtEenFout(c, { bericht: 1, veld: 'gemergdOp', melding: meldingen.verkeerdType('gemergdOp') });
  });

  test('29 februari in een schrikkeljaar is een geldige tijd', () => {
    const c = voorbeeld();
    c.periode = { van: '2028-02-29T09:00:00+01:00', tot: '2028-02-29T13:00:00+01:00' };
    c.berichten.forEach((b) => { b.gemergdOp = '2028-02-29T10:00:00+01:00'; });
    expect(valideerConcept(c).geldig).toBe(true);
  });

  test.each(['null', '"tekst"'])('JSON %s is geen conceptbestand', (tekst) => {
    verwachtEenFout(tekst, { bericht: null, veld: 'bestand', melding: meldingen.verkeerdType('bestand') });
  });
});
