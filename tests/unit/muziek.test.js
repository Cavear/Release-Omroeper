import { test, expect } from 'vitest';
import { PARTITUUR, MAAT, kanMuziek } from '../../public/muziek.js';

test('elke maat van de mars is precies een maat 2/4 lang', () => {
  PARTITUUR.forEach((maat, i) => {
    const lengte = maat.melodie.reduce((som, [, duur]) => som + duur, 0);
    expect(lengte, `maat ${i + 1}`).toBe(MAAT);
  });
});

test('de mars heeft twee frasen van acht maten, elk afgesloten met een roffel', () => {
  expect(PARTITUUR).toHaveLength(16);
  expect(PARTITUUR.map((m, i) => (m.roffel ? i + 1 : null)).filter(Boolean)).toEqual([8, 16]);
});

test('zonder Web Audio API is er geen muziek', () => {
  expect(kanMuziek()).toBe(false);
});
