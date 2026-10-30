/**
 * Alleen-lezen toegang tot gemergde pull requests van publieke GitHub-repositories.
 * @module github
 */
import { MAX_BERICHTEN } from './logic.js';
import { github as teksten } from './teksten.js';

/** Een foutcode die de UI vertaalt naar een zichtbare melding. */
export class GitHubFout extends Error {
  /**
  * @param {'repository'|'periode'|'teVeel'|'netwerk'|'privé'|'limiet'|'onvolledig'|'api'} code
   */
  constructor(code) {
    super(code);
    this.name = 'GitHubFout';
    this.code = code;
  }
}

/**
 * Controleert een ISO-datum zonder tijdzone.
 * @param {string} waarde
 * @returns {boolean}
 */
function isDatum(waarde) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(waarde)) return false;
  const datum = new Date(`${waarde}T00:00:00.000Z`);
  return !Number.isNaN(datum.valueOf()) && datum.toISOString().slice(0, 10) === waarde;
}

/**
 * Haalt JSON op en vertaalt netwerk- en GitHub-fouten naar vaste foutcodes.
 * @param {string} url
 * @param {(url: string, opties?: RequestInit) => Promise<Response>} fetcher
 * @returns {Promise<unknown>}
 */
async function haalJson(url, fetcher) {
  let response;
  try {
    response = await fetcher(url, { headers: { Accept: 'application/vnd.github+json' } });
  } catch {
    throw new GitHubFout('netwerk');
  }
  if (response.status === 404) throw new GitHubFout('privé');
  if (response.status === 403 || response.status === 429) throw new GitHubFout('limiet');
  if (!response.ok) throw new GitHubFout('api');
  try {
    return await response.json();
  } catch {
    throw new GitHubFout('api');
  }
}

/**
 * Haalt maximaal vijf gemergde PR’s op en maakt er een ongekeurd journaalconcept van.
 * Bij meer resultaten wordt niets ingeladen.
 * Kop en uitleg zijn brongegevens; er worden geen samenvattingen of voordelen verzonnen.
 * @param {string} repository GitHub-repository in de vorm owner/repo
 * @param {string} van Begindatum inclusief
 * @param {string} tot Einddatum inclusief
 * @param {(url: string, opties?: RequestInit) => Promise<Response>} [fetcher]
 * @returns {Promise<{repository: string, periode: {van: string, tot: string}, gegenereerdOp: string, berichten: object[]}>}
 */
export async function haalGitHubConcept(repository, van, tot, fetcher = globalThis.fetch) {
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9](?:[A-Za-z0-9._-]{0,99})$/.test(repository)) {
    throw new GitHubFout('repository');
  }
  if (!isDatum(van) || !isDatum(tot) || van > tot) throw new GitHubFout('periode');

  const [eigenaar, naam] = repository.split('/');
  const zoek = new URLSearchParams({
    q: `repo:${repository} is:pr is:merged merged:${van}..${tot}`,
    sort: 'updated',
    order: 'desc',
    per_page: '100',
  });
  const resultaat = await haalJson(`https://api.github.com/search/issues?${zoek}`, fetcher);
  if (!resultaat || !Array.isArray(resultaat.items) || !Number.isInteger(resultaat.total_count)
    || typeof resultaat.incomplete_results !== 'boolean') {
    throw new GitHubFout('api');
  }
  if (resultaat.incomplete_results) throw new GitHubFout('onvolledig');
  if (resultaat.total_count > MAX_BERICHTEN || resultaat.items.length !== resultaat.total_count) {
    throw new GitHubFout('teVeel');
  }

  const details = await Promise.all(resultaat.items.map((item) => {
    if (!Number.isInteger(item.number) || item.number < 1) throw new GitHubFout('api');
    const pad = [eigenaar, naam, 'pulls', String(item.number)].map(encodeURIComponent).join('/');
    return haalJson(`https://api.github.com/repos/${pad}`, fetcher);
  }));

  const berichten = details.map((pr) => {
    if (!pr || pr.merged_at === null || typeof pr.merged_at !== 'string' || typeof pr.title !== 'string') {
      throw new GitHubFout('api');
    }
    return {
      prNummer: pr.number,
      bronUrl: `https://github.com/${repository}/pull/${pr.number}`,
      origineleTitel: pr.title,
      gemergdOp: pr.merged_at,
      kop: pr.title,
      uitleg: typeof pr.body === 'string' && pr.body.trim() ? pr.body.trim() : teksten.ontbrekendeBeschrijving,
      status: 'concept',
    };
  }).sort((a, b) => Date.parse(b.gemergdOp) - Date.parse(a.gemergdOp));

  return {
    repository,
    periode: { van: `${van}T00:00:00Z`, tot: `${tot}T23:59:59Z` },
    gegenereerdOp: new Date().toISOString(),
    berichten,
  };
}