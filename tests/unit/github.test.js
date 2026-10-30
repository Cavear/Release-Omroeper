import { describe, expect, it, vi } from 'vitest';
import { valideerConcept } from '../../public/logic.js';
import { GitHubFout, haalGitHubConcept } from '../../public/github.js';

/** Maakt een eenvoudige JSON-response voor fetch-tests.
 * @param {unknown} data
 * @param {number} [status]
 * @returns {{ok: boolean, status: number, json: () => Promise<unknown>}}
 */
function antwoord(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

describe('haalGitHubConcept', () => {
  it('maakt geldige, ongekeurde conceptberichten van gemergde PR’s', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(antwoord({ total_count: 1, incomplete_results: false, items: [{ number: 12 }] }))
      .mockResolvedValueOnce(antwoord({
        number: 12,
        title: 'Zoeken in producten',
        body: 'De productlijst kan nu worden doorzocht.',
        merged_at: '2026-10-29T12:30:00Z',
      }));

    const concept = await haalGitHubConcept('eigenaar/webshop', '2026-10-29', '2026-10-30', fetcher);

    expect(concept.berichten[0]).toMatchObject({
      prNummer: 12,
      bronUrl: 'https://github.com/eigenaar/webshop/pull/12',
      kop: 'Zoeken in producten',
      status: 'concept',
    });
    expect(concept.berichten[0]).not.toHaveProperty('voorWie');
    expect(valideerConcept(concept).geldig).toBe(true);
    expect(fetcher.mock.calls.every(([, opties]) => opties.method === undefined
      && !Object.keys(opties.headers).some((naam) => naam.toLowerCase() === 'authorization'))).toBe(true);
  });

  it('weigert ongeldige repositorynamen voordat er een request wordt gedaan', async () => {
    const fetcher = vi.fn();

    await expect(haalGitHubConcept('eigenaar is:pr/webshop', '2026-10-29', '2026-10-30', fetcher))
      .rejects.toMatchObject({ code: 'repository' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('weigert onvolledige zoekresultaten zonder PR-details op te halen', async () => {
    const fetcher = vi.fn().mockResolvedValue(antwoord({
      total_count: 1,
      incomplete_results: true,
      items: [{ number: 12 }],
    }));

    await expect(haalGitHubConcept('eigenaar/webshop', '2026-10-29', '2026-10-30', fetcher))
      .rejects.toMatchObject({ code: 'onvolledig' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('accepteert een repositorynaam van precies honderd tekens', async () => {
    const repository = `eigenaar/${'a'.repeat(99)}`;
    const fetcher = vi.fn().mockResolvedValue(antwoord({
      total_count: 0,
      incomplete_results: false,
      items: [],
    }));

    const concept = await haalGitHubConcept(repository, '2026-10-29', '2026-10-30', fetcher);

    expect(concept.repository).toBe(repository);
  });

  it('weigert periodes met meer dan vijf resultaten in plaats van stil af te kappen', async () => {
    const fetcher = vi.fn().mockResolvedValue(antwoord({
      total_count: 6,
      incomplete_results: false,
      items: Array(6).fill({ number: 1 }),
    }));

    await expect(haalGitHubConcept('eigenaar/webshop', '2026-10-01', '2026-10-30', fetcher))
      .rejects.toMatchObject({ code: 'teVeel' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('geeft een herkenbare fout voor een privé- of onbekende repository', async () => {
    const fetcher = vi.fn().mockResolvedValue(antwoord({}, 404));

    await expect(haalGitHubConcept('eigenaar/webshop', '2026-10-29', '2026-10-30', fetcher))
      .rejects.toBeInstanceOf(GitHubFout);
    await expect(haalGitHubConcept('eigenaar/webshop', '2026-10-29', '2026-10-30', fetcher))
      .rejects.toMatchObject({ code: 'privé' });
  });
});