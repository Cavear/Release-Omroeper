import { test, expect } from 'vitest';
import { kiesStem, leesTijd, kanVoorlezen, STEM } from '../../public/voorlezer.js';
import { voorlezen } from '../../public/teksten.js';

test('de omroeper spreekt twee keer zo snel als eerst (0,9 en 0,82)', () => {
  expect(STEM.tempo).toBeCloseTo(1.8);
  expect(STEM.kopTempo).toBeCloseTo(1.64);
});

const stem = (name, lang) => ({ name, lang });

test('de omroeper is bij voorkeur een Nederlandse mannenstem', () => {
  const stemmen = [
    stem('Google US English', 'en-US'),
    stem('Google Nederlands', 'nl-NL'),
    stem('Microsoft Fenna Online (Natural) - Dutch (Netherlands)', 'nl-NL'),
    stem('Microsoft Maarten Online (Natural) - Dutch (Netherlands)', 'nl-NL'),
  ];
  expect(kiesStem(stemmen).name).toMatch(/Maarten/);
});

test('zonder mannenstem wordt het een Nederlandse stem, liefst uit Nederland', () => {
  expect(kiesStem([stem('Ellen', 'nl-BE'), stem('Google Nederlands', 'nl-NL')]).name).toBe('Google Nederlands');
  expect(kiesStem([stem('Ellen', 'nl_BE')]).name).toBe('Ellen');
});

test('een stem in een andere taal leest nooit Nederlands voor', () => {
  expect(kiesStem([stem('Daniel', 'en-GB'), stem('Male voice', 'de-DE')])).toBeNull();
  expect(kiesStem([])).toBeNull();
});

test('de leestijd groeit met het aantal woorden, met een minimum per scherm', () => {
  expect(leesTijd('Kort.')).toBe(5000);
  expect(leesTijd(Array(30).fill('woord').join(' '))).toBe(30 * 420);
});

test('zonder spraak in de omgeving is er geen voice-over', () => {
  expect(kanVoorlezen()).toBe(false);
});

test('de titel noemt datum en aantal berichten, en het slotwoord sluit af', () => {
  expect(voorlezen.titel('30 oktober 2026', 1)).toContain('De release van 30 oktober 2026, in 1 bericht.');
  expect(voorlezen.titel('30 oktober 2026', 3).at(-1)).toMatch(/3 berichten\.$/);
  expect(voorlezen.einde[0]).toBe('Dat was het Release-Bioscoopjournaal.');
});
