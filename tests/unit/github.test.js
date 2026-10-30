import { describe, expect, it, vi } from 'vitest';
import { valideerConcept } from '../../public/logic.js';
import { GitHubFout, haalGitHubConcept } from '../../public/github.js';

/** Maakt een eenvoudige JSON-response voor fetch-tests.
 * @param {unknown} data
 * @param {number} [status]
 * @returns {{ok: boolean, status: number, json: () => Promise<unknown>}}
 */
function antwoord(data, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300, status, json: async () => data,
    headers: { get: (naam) => headers[naam.toLowerCase()] ?? null },
  };
}

/**
 * Een fetcher die de PR's als één pagina zoekresultaten geeft; de zoek-API levert titel, beschrijving en merge-moment.
 * @param {object[]} prs
 * @returns {import('vitest').Mock}
 */
function fetcherMet(prs) {
  return vi.fn().mockResolvedValueOnce(antwoord({ total_count: prs.length, incomplete_results: false, items: prs }));
}

/**
 * Een gemergde PR zoals de zoek-API hem teruggeeft, met standaardwaarden.
 * @param {{ number?: number, title?: string, body?: string | null, merged_at?: string }} velden
 * @returns {object}
 */
function pr({ merged_at: gemergd = '2026-10-29T12:00:00Z', ...velden } = {}) {
  return { number: 1, title: 'Titel', body: 'Uitleg.', pull_request: { merged_at: gemergd }, ...velden };
}

describe('haalGitHubConcept', () => {
  it('maakt geldige, ongekeurde conceptberichten van gemergde PR’s, met één verzoek', async () => {
    const fetcher = fetcherMet([pr({
      number: 12,
      title: 'Zoeken in producten',
      body: 'De productlijst kan nu worden doorzocht.',
      merged_at: '2026-10-29T12:30:00Z',
    })]);

    const { concept, totaal } = await haalGitHubConcept('eigenaar/webshop', '2026-10-29', '2026-10-30', fetcher);
    expect(totaal).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(1);

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

  it('weigert onvolledige zoekresultaten', async () => {
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

    const { concept } = await haalGitHubConcept(repository, '2026-10-29', '2026-10-30', fetcher);

    expect(concept.repository).toBe(repository);
  });

  it('neemt bij meer dan twintig PR’s de twintig meest recent gemergde', async () => {
    // 25 PR's, door elkaar: PR n is gemergd op dag n van oktober.
    const prs = Array.from({ length: 25 }, (_, i) => {
      const n = ((i * 7) % 25) + 1;
      return pr({ number: n, merged_at: `2026-10-${String(n).padStart(2, '0')}T12:00:00Z` });
    });

    const { concept, totaal } = await haalGitHubConcept('a/b', '2026-10-01', '2026-10-30', fetcherMet(prs));

    expect(totaal).toBe(25);
    expect(concept.berichten.map((b) => b.prNummer)).toEqual(Array.from({ length: 20 }, (_, i) => 25 - i));
    expect(valideerConcept(concept).geldig).toBe(true);
  });

  it('haalt meer pagina’s op als er meer dan honderd resultaten zijn', async () => {
    const pagina = (van, aantal) => Array.from({ length: aantal }, (_, i) => pr({
      number: van + i, merged_at: `2026-10-${String(1 + ((van + i) % 29)).padStart(2, '0')}T12:00:00Z`,
    }));
    const fetcher = vi.fn()
      .mockResolvedValueOnce(antwoord({ total_count: 130, incomplete_results: false, items: pagina(1, 100) }))
      .mockResolvedValueOnce(antwoord({ total_count: 130, incomplete_results: false, items: pagina(101, 30) }));

    const { concept, totaal } = await haalGitHubConcept('a/b', '2026-10-01', '2026-10-30', fetcher);

    expect(totaal).toBe(130);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new URL(fetcher.mock.calls[1][0]).searchParams.get('page')).toBe('2');
    expect(concept.berichten).toHaveLength(20);
    expect(valideerConcept(concept).geldig).toBe(true);
  });

  it('geeft api als een zoekresultaat geen merge-moment heeft', async () => {
    await expect(haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', fetcherMet([{ number: 3, title: 'X', body: 'Y' }])))
      .rejects.toMatchObject({ code: 'api' });
  });

  it('geeft een herkenbare fout voor een privé- of onbekende repository', async () => {
    const fetcher = vi.fn().mockResolvedValue(antwoord({}, 404));

    await expect(haalGitHubConcept('eigenaar/webshop', '2026-10-29', '2026-10-30', fetcher))
      .rejects.toBeInstanceOf(GitHubFout);
    await expect(haalGitHubConcept('eigenaar/webshop', '2026-10-29', '2026-10-30', fetcher))
      .rejects.toMatchObject({ code: 'privé' });
  });

  it('vertaalt de 422 van de zoek-API (onbekende of privé-repository) naar privé', async () => {
    const fetcher = vi.fn().mockResolvedValue(antwoord({ message: 'Validation Failed' }, 422));

    await expect(haalGitHubConcept('eigenaar/bestaatniet', '2026-10-29', '2026-10-30', fetcher))
      .rejects.toMatchObject({ code: 'privé' });
  });

  it('herkent de rate limit aan 429 of aan een 403 met lege limiet; een andere 403 is api', async () => {
    const r = (s, h) => vi.fn().mockResolvedValue(antwoord({}, s, h));
    await expect(haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', r(429)))
      .rejects.toMatchObject({ code: 'limiet' });
    await expect(haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', r(403, { 'x-ratelimit-remaining': '0' })))
      .rejects.toMatchObject({ code: 'limiet' });
    await expect(haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', r(403, { 'x-ratelimit-remaining': '42' })))
      .rejects.toMatchObject({ code: 'api' });
  });

  it('geeft netwerk als fetch zelf faalt, en api bij ongeldige JSON of een serverfout', async () => {
    await expect(haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', vi.fn().mockRejectedValue(new TypeError('offline'))))
      .rejects.toMatchObject({ code: 'netwerk' });
    const kapotteJson = vi.fn().mockResolvedValue({ ok: true, status: 200, headers: { get: () => null }, json: async () => { throw new SyntaxError(); } });
    await expect(haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', kapotteJson))
      .rejects.toMatchObject({ code: 'api' });
    await expect(haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', vi.fn().mockResolvedValue(antwoord({}, 500))))
      .rejects.toMatchObject({ code: 'api' });
  });

  it('weigert een ongeldige periode zonder request', async () => {
    const fetcher = vi.fn();
    await expect(haalGitHubConcept('a/b', '2026-10-30', '2026-10-29', fetcher)).rejects.toMatchObject({ code: 'periode' });
    await expect(haalGitHubConcept('a/b', '2026-02-30', '2026-03-01', fetcher)).rejects.toMatchObject({ code: 'periode' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('sorteert op merge-moment, nieuwste eerst', async () => {
    const { concept } = await haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', fetcherMet([
      pr({ number: 1, merged_at: '2026-10-29T08:00:00Z' }),
      pr({ number: 2, merged_at: '2026-10-29T18:00:00Z' }),
    ]));
    expect(concept.berichten.map((b) => b.prNummer)).toEqual([2, 1]);
  });

  it('zet een PR zonder beschrijving op meer-info-nodig met een vaste uitleg', async () => {
    const { concept } = await haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', fetcherMet([
      pr({ number: 3, body: null }),
      pr({ number: 4, body: '<!-- sjabloon -->\n\n## Checklist\n- [ ] getest' }),
    ]));
    for (const bericht of concept.berichten) {
      expect(bericht.status).toBe('meer-info-nodig');
      expect(bericht.uitleg).toContain('geen beschrijving');
    }
    expect(valideerConcept(concept).geldig).toBe(true);
  });

  it('neemt alleen de eerste alinea over, zonder sjablooncommentaar, en verwijst naar de bron', async () => {
    const body = '<!-- Beschrijf je wijziging -->\nHet zoekveld filtert nu ook op beschrijving.\n\n## Testen\n- [x] lokaal\n\nMeer details.';
    const { concept: { berichten: [bericht] } } = await haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', fetcherMet([pr({ body })]));
    expect(bericht.uitleg).toBe('Het zoekveld filtert nu ook op beschrijving. (Ingekort; zie de bron.)');
    expect(bericht.status).toBe('concept');
  });

  it('kort een te lange titel in tot 90 tekens als kop, met de volledige titel als origineleTitel', async () => {
    const titel = `Lange titel ${'woord '.repeat(40)}`.trim();
    const { concept: { berichten: [bericht] } } = await haalGitHubConcept('a/b', '2026-10-29', '2026-10-30', fetcherMet([pr({ title: titel })]));
    expect(bericht.kop.length).toBeLessThanOrEqual(90);
    expect(bericht.kop.endsWith('…')).toBe(true);
    expect(bericht.origineleTitel).toBe(titel);
    expect(bericht.status).toBe('meer-info-nodig');
  });
});

describe('periode in Nederlandse tijd', () => {
  it('zoekt en bewaart de gekozen dagen in Nederlandse tijd, met winter- en zomertijd', async () => {
    const leeg = () => vi.fn().mockResolvedValue(antwoord({ total_count: 0, incomplete_results: false, items: [] }));
    const winter = leeg();
    const { concept } = await haalGitHubConcept('a/b', '2026-10-27', '2026-10-28', winter);
    expect(concept.periode).toEqual({ van: '2026-10-27T00:00:00+01:00', tot: '2026-10-28T23:59:59+01:00' });
    expect(new URL(winter.mock.calls[0][0]).searchParams.get('q'))
      .toContain('merged:2026-10-27T00:00:00+01:00..2026-10-28T23:59:59+01:00');

    const { concept: zomer } = await haalGitHubConcept('a/b', '2026-07-01', '2026-07-01', leeg());
    expect(zomer.periode).toEqual({ van: '2026-07-01T00:00:00+02:00', tot: '2026-07-01T23:59:59+02:00' });
  });

  it('neemt een PR die om 00:30 Nederlandse tijd is gemergd mee in die dag', async () => {
    const { concept } = await haalGitHubConcept('a/b', '2026-10-28', '2026-10-28', fetcherMet([
      pr({ number: 9, merged_at: '2026-10-27T23:30:00Z' }),
    ]));
    expect(valideerConcept(concept).geldig).toBe(true);
  });
});
