/**
 * Alleen-lezen toegang tot gemergde pull requests van publieke GitHub-repositories.
 * @module github
 */
import { MAX_BERICHTEN } from './logic.js';
import { github as teksten } from './teksten.js';

/** Een foutcode die de UI vertaalt naar een zichtbare melding. */
export class GitHubFout extends Error {
  /**
   * @param {'repository'|'periode'|'netwerk'|'privé'|'limiet'|'onvolledig'|'api'} code
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

/** De gekozen dagen gelden in Nederlandse tijd, net als de tijden in de redactie. */
const TIJDZONE = 'Europe/Amsterdam';
const afwijkingOpmaak = new Intl.DateTimeFormat('en-US', { timeZone: TIJDZONE, timeZoneName: 'longOffset' });

/**
 * Maakt een tijdstip in Nederlandse tijd met de UTC-afwijking van die dag (winter- of zomertijd).
 * @param {string} datum JJJJ-MM-DD
 * @param {string} tijd UU:MM:SS
 * @returns {string} Bijvoorbeeld 2026-10-27T00:00:00+01:00
 */
function lokaalTijdstip(datum, tijd) {
  // De afwijking rond het middaguur van die dag; een wissel van zomer- naar wintertijd valt 's nachts.
  const naam = afwijkingOpmaak.formatToParts(new Date(`${datum}T12:00:00Z`))
    .find((deel) => deel.type === 'timeZoneName').value;
  const afwijking = naam === 'GMT' ? '+00:00' : naam.slice(3);
  return `${datum}T${tijd}${afwijking}`;
}

/** Maximale lengte van een kop, zodat hij in de uitzending binnen beeld past. */
const MAX_KOP = 90;
/** Maximale lengte van de overgenomen uitleg. */
const MAX_UITLEG = 280;

/**
 * Kort een tekst in op een woordgrens en zet er een beletselteken achter.
 * @param {string} tekst
 * @param {number} max
 * @returns {string}
 */
function kortIn(tekst, max) {
  if (tekst.length <= max) return tekst;
  const stuk = tekst.slice(0, max - 1);
  const grens = stuk.lastIndexOf(' ');
  return `${(grens > max / 2 ? stuk.slice(0, grens) : stuk).trimEnd()}…`;
}

/** Titels die niets zeggen over de wijziging; daar verzinnen we geen onderwerp bij. */
const VAGE_TITEL = /^((minor |small |kleine )?(fix(es|ed)?|bugs?|bug ?fix(es)?|updates?|updated|wip|changes|misc|tweaks?|typos?|aanpassing(en)?)( (a |the |some )?(bugs?|typos?))?( #\d+)?|(fix(es|ed)?|closes|resolves) #\d+|#\d+)$/i;

/** Bekende voorvoegsels (conventional commits) en de soort wijziging die erbij hoort. */
const VOORVOEGSELS = {
  feat: 'nieuw', feature: 'nieuw', fix: 'herstel', bugfix: 'herstel', hotfix: 'herstel',
  docs: 'docs', doc: 'docs', test: 'test', tests: 'test', style: 'stijl', ci: 'ci', build: 'onderhoud',
  refactor: 'opruim', revert: 'revert', deps: 'onderhoud', 'dependency-update': 'onderhoud',
  chore: null, perf: null,
};
const VOORVOEGSEL = /^\[?([a-z-]+)(\(([^)]*)\))?!?\]?:\s*/i;

/**
 * Maakt een journaalkop van een PR-titel: een vaste opener per soort wijziging (uit teksten.js)
 * met het onderwerp uit de titel. Er komt geen inhoud bij die niet in de titel staat.
 * @param {string} titel De originele PR-titel
 * @param {number} prNummer Kiest deterministisch een van de openers, zodat koppen variëren
 * @returns {{kop: string, nakijken: boolean}} nakijken is true bij een vage of ingekorte titel
 */
function maakKop(titel, prNummer) {
  const { koppen } = teksten;
  const schoon = titel.trim();
  // Alleen bekende voorvoegsels ('feat:', 'fix(mandje):', 'Dependency-update:') verdwijnen uit de kop;
  // bij 'Winkelmandje: toont weer…' blijft alles staan.
  const voorvoegsel = schoon.match(VOORVOEGSEL);
  const bekend = voorvoegsel && Object.hasOwn(VOORVOEGSELS, voorvoegsel[1].toLowerCase());
  // Bij 'chore(deps):' telt de scope.
  const sleutel = bekend && (voorvoegsel[3]?.toLowerCase() === 'deps' ? 'deps' : voorvoegsel[1].toLowerCase());
  const onderwerp = (bekend ? schoon.slice(voorvoegsel[0].length) : schoon).replace(/[.\s]+$/, '');
  if (onderwerp.length < 4 || VAGE_TITEL.test(onderwerp)) {
    return { kop: koppen.vaag[prNummer % koppen.vaag.length], nakijken: true };
  }
  // Een bekend voorvoegsel bepaalt de soort; anders (ook bij 'chore:') de eerste soort met een trefwoord.
  const vast = sleutel ? VOORVOEGSELS[sleutel] : null;
  const soort = (vast && koppen.soorten.find((s) => s.soort === vast))
    || koppen.soorten.find(({ woorden }) => woorden.test(onderwerp));
  const openers = soort ? soort.openers : koppen.algemeen;
  const opener = openers[prNummer % openers.length];
  // Hoofdletters blijven zoals in de titel (namen als GitHub of Playwright); een tweede dubbele punt wordt een streepje.
  const volledig = koppen.kop(opener, onderwerp.replace(/:\s+/g, ' – '));
  const kop = kortIn(volledig, MAX_KOP);
  return { kop, nakijken: kop !== volledig };
}

/**
 * Maakt van een PR-beschrijving een korte uitleg: zonder HTML-commentaar, koppen en checklists,
 * alleen de eerste alinea. Er komt niets bij behalve een vaste verwijzing naar de bron.
 * @param {unknown} body De ruwe PR-beschrijving
 * @returns {{uitleg: string, volledig: boolean}} volledig is false als er geen bruikbare beschrijving is
 */
function maakUitleg(body) {
  if (typeof body !== 'string') return { uitleg: teksten.ontbrekendeBeschrijving, volledig: false };
  const alineas = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\r?\n\s*\r?\n/)
    .map((alinea) => alinea.split(/\r?\n/)
      .filter((regel) => !/^\s*(#{1,6}\s|[-*]\s+\[[ xX]\])/.test(regel))
      .join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (alineas.length === 0) return { uitleg: teksten.ontbrekendeBeschrijving, volledig: false };
  const eerste = kortIn(alineas[0], MAX_UITLEG);
  const ingekort = alineas.length > 1 || eerste !== alineas[0];
  return { uitleg: ingekort ? `${eerste} ${teksten.zieBron}` : eerste, volledig: true };
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
  // Search geeft 422 bij een onbekende of privé-repository, de Pulls-API 404.
  if (response.status === 404 || response.status === 422) throw new GitHubFout('privé');
  const opLimiet = response.headers?.get?.('x-ratelimit-remaining') === '0' || Boolean(response.headers?.get?.('retry-after'));
  if (response.status === 429 || (response.status === 403 && opLimiet)) throw new GitHubFout('limiet');
  if (!response.ok) throw new GitHubFout('api');
  try {
    return await response.json();
  } catch {
    throw new GitHubFout('api');
  }
}

/** Resultaten per pagina van de zoek-API (het maximum van GitHub). */
const PER_PAGINA = 100;
/** De zoek-API geeft hooguit 1000 resultaten, dus 10 pagina’s. */
const MAX_PAGINAS = 10;

/**
 * Het merge-moment van een zoekresultaat.
 * @param {any} item
 * @returns {string | null}
 */
function mergeMoment(item) {
  const moment = item?.pull_request?.merged_at;
  return typeof moment === 'string' ? moment : null;
}

/**
 * Haalt alle zoekresultaten op, pagina voor pagina (hooguit 1000).
 * @param {URLSearchParams} zoek de zoekvraag zonder pagina
 * @param {(url: string, opties?: RequestInit) => Promise<Response>} fetcher
 * @returns {Promise<{totaal: number, items: any[]}>}
 */
async function zoekAlles(zoek, fetcher) {
  const items = [];
  let totaal = 0;
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina += 1) {
    zoek.set('page', String(pagina));
    const resultaat = await haalJson(`https://api.github.com/search/issues?${zoek}`, fetcher);
    if (!resultaat || !Array.isArray(resultaat.items) || !Number.isInteger(resultaat.total_count)
      || typeof resultaat.incomplete_results !== 'boolean') {
      throw new GitHubFout('api');
    }
    if (resultaat.incomplete_results) throw new GitHubFout('onvolledig');
    totaal = resultaat.total_count;
    items.push(...resultaat.items);
    if (resultaat.items.length < PER_PAGINA || items.length >= totaal) break;
  }
  return { totaal, items };
}

/**
 * Haalt de gemergde PR’s uit een periode op en maakt van de nieuwste MAX_BERICHTEN (20) een ongekeurd journaalconcept.
 * Zijn er meer, dan vallen de oudste af; `totaal` zegt hoeveel er waren.
 * Alles komt uit de zoekresultaten (titel, beschrijving, merge-moment), zodat één ophaalactie maar een paar
 * verzoeken kost; zonder token staat GitHub er maar 60 per uur toe.
 * Kop en uitleg zijn brongegevens; er worden geen samenvattingen of voordelen verzonnen.
 * @param {string} repository GitHub-repository in de vorm owner/repo
 * @param {string} van Begindatum inclusief
 * @param {string} tot Einddatum inclusief
 * @param {(url: string, opties?: RequestInit) => Promise<Response>} [fetcher]
 * @returns {Promise<{concept: {repository: string, periode: {van: string, tot: string}, gegenereerdOp: string, berichten: object[]}, totaal: number}>}
 */
export async function haalGitHubConcept(repository, van, tot, fetcher = globalThis.fetch) {
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9](?:[A-Za-z0-9._-]{0,99})$/.test(repository)) {
    throw new GitHubFout('repository');
  }
  if (!isDatum(van) || !isDatum(tot) || van > tot) throw new GitHubFout('periode');

  const begin = lokaalTijdstip(van, '00:00:00');
  const eind = lokaalTijdstip(tot, '23:59:59');
  const zoek = new URLSearchParams({
    q: `repo:${repository} is:pr is:merged merged:${begin}..${eind}`,
    sort: 'updated',
    order: 'desc',
    per_page: String(PER_PAGINA),
  });
  const { totaal, items } = await zoekAlles(zoek, fetcher);

  for (const item of items) {
    if (!Number.isInteger(item?.number) || item.number < 1 || typeof item.title !== 'string' || mergeMoment(item) === null) {
      throw new GitHubFout('api');
    }
  }
  // De nieuwste eerst; bij meer dan MAX_BERICHTEN vallen de oudste af.
  const nieuwste = [...items]
    .sort((a, b) => Date.parse(mergeMoment(b)) - Date.parse(mergeMoment(a)))
    .slice(0, MAX_BERICHTEN);

  const berichten = nieuwste.map((pr) => {
    const { uitleg, volledig } = maakUitleg(pr.body);
    const { kop, nakijken } = maakKop(pr.title, pr.number);
    return {
      prNummer: pr.number,
      bronUrl: `https://github.com/${repository}/pull/${pr.number}`,
      origineleTitel: pr.title,
      gemergdOp: mergeMoment(pr),
      kop,
      uitleg,
      // Zonder beschrijving, of met een vage of ingekorte titel, valt de kaart op, zodat de redactie hem nakijkt.
      status: volledig && !nakijken ? 'concept' : 'meer-info-nodig',
    };
  });

  return {
    concept: {
      repository,
      periode: { van: begin, tot: eind },
      gegenereerdOp: new Date().toISOString(),
      berichten,
    },
    totaal,
  };
}
