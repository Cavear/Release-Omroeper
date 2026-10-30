import { test, expect } from 'vitest';
import { fouten } from '../../public/teksten.js';

test('een fout over het hele bestand begint met een hoofdletter', () => {
  expect(fouten.regel({ bericht: null, veld: 'repository', melding: fouten.ontbreekt('repository') }))
    .toBe('Het verplichte veld repository ontbreekt');
});

test('een fout in een bericht noemt bericht en veld', () => {
  expect(fouten.regel({ bericht: 2, veld: 'kop', melding: fouten.ontbreekt('kop') }))
    .toBe('Bericht 2, veld kop: het verplichte veld kop ontbreekt');
});
