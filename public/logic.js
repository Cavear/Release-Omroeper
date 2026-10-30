/**
 * Pure logica van de Release-omroeper (validatie, selectie, redactie, export).
 * Zonder DOM, zodat alles met Vitest te testen is.
 * @module logic
 */
import { fouten as meldingen, algemeen } from './teksten.js';

/** De vier geldige statussen van een bericht. */
export const STATUSSEN = ['concept', 'meer-info-nodig', 'goedgekeurd', 'uitgesloten'];

/** Maximaal aantal berichten in één journaal. */
export const MAX_BERICHTEN = 20;

/** Publicatiestatus van elk bericht zolang een mens het niet heeft nagelopen. */
export const PUBLICATIESTATUS = 'niet gecontroleerd';

/** Verplichte tekstvelden per bericht (naast prNummer). */
const VERPLICHTE_TEKSTVELDEN = ['bronUrl', 'origineleTitel', 'kop', 'uitleg', 'status'];

/** ISO 8601-tijd met datum, tijd en tijdzone, bijvoorbeeld 2026-10-30T09:40:00+01:00. */
const ISO_TIJD = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-](\d{2}):(\d{2}))$/;

/** Repository in de vorm owner/repo. */
const REPOSITORY = /^[^/\s]+\/[^/\s]+$/;

/**
 * Een fout in het conceptbestand.
 * @typedef {{ bericht: number|null, veld: string, melding: string }} Fout
 */

/**
 * Zet een ISO 8601-tijd om naar milliseconden.
 * @param {unknown} waarde
 * @returns {number|null} de tijd in ms, of null als de waarde geen geldige ISO 8601-tijd is
 */
function leesTijd(waarde) {
  const delen = typeof waarde === 'string' ? ISO_TIJD.exec(waarde) : null;
  if (!delen) return null;
  const [jaar, maand, dag, uur, minuut, seconde, zoneUur, zoneMinuut] = delen.slice(1).map((d) => Number(d ?? 0));
  // Date.parse rekent 30 februari stilletjes door naar maart; daarom eerst zelf de onderdelen controleren.
  const dagenInMaand = new Date(Date.UTC(jaar, maand, 0)).getUTCDate();
  const klopt = maand >= 1 && maand <= 12 && dag >= 1 && dag <= dagenInMaand
    && uur < 24 && minuut < 60 && seconde < 60 && zoneUur < 24 && zoneMinuut < 60;
  return klopt ? Date.parse(waarde) : null;
}

/**
 * Ontbreekt de waarde, of is het een tekst met alleen spaties?
 * @param {unknown} waarde
 * @returns {boolean}
 */
function isLeeg(waarde) {
  return waarde === undefined || (typeof waarde === 'string' && waarde.trim() === '');
}

/**
 * Is de waarde een gewoon object (geen lijst, geen null)?
 * @param {unknown} waarde
 * @returns {boolean}
 */
function isObject(waarde) {
  return typeof waarde === 'object' && waarde !== null && !Array.isArray(waarde);
}

/**
 * Controleert de velden op bestandsniveau: repository, periode en gegenereerdOp.
 * @param {Record<string, unknown>} concept
 * @param {(veld: string, melding: string) => void} fout voegt een fout zonder berichtnummer toe
 * @returns {{ repository: string|null, van: number|null, tot: number|null }} de bruikbare waarden voor de berichtcontrole
 */
function controleerBestand(concept, fout) {
  let repository = null;
  if (isLeeg(concept.repository)) {
    fout('repository', meldingen.ontbreekt('repository'));
  } else if (typeof concept.repository !== 'string' || !REPOSITORY.test(concept.repository)) {
    fout('repository', meldingen.verkeerdType('repository'));
  } else {
    repository = concept.repository;
  }

  let van = null;
  let tot = null;
  if (concept.periode === undefined) {
    fout('periode', meldingen.ontbreekt('periode'));
  } else if (!isObject(concept.periode)) {
    fout('periode', meldingen.verkeerdType('periode'));
  } else {
    for (const deel of ['van', 'tot']) {
      const waarde = concept.periode[deel];
      const veld = `periode.${deel}`;
      if (isLeeg(waarde)) {
        fout(veld, meldingen.ontbreekt(veld));
      } else if (leesTijd(waarde) === null) {
        fout(veld, meldingen.verkeerdType(veld));
      }
    }
    van = leesTijd(concept.periode.van);
    tot = leesTijd(concept.periode.tot);
    if (van !== null && tot !== null && van > tot) {
      fout('periode', meldingen.periodeOmgedraaid);
      van = null;
      tot = null;
    }
  }

  if (concept.gegenereerdOp !== undefined && leesTijd(concept.gegenereerdOp) === null) {
    fout('gegenereerdOp', meldingen.verkeerdType('gegenereerdOp'));
  }

  return { repository, van, tot };
}

/**
 * Controleert één bericht.
 * @param {unknown} bericht
 * @param {{ repository: string|null, van: number|null, tot: number|null }} bestand
 * @param {Set<number>} gezien PR-nummers van eerdere berichten; wordt aangevuld
 * @param {(veld: string, melding: string) => void} fout voegt een fout voor dit bericht toe
 */
function controleerBericht(bericht, bestand, gezien, fout) {
  if (!isObject(bericht)) {
    fout('bericht', meldingen.verkeerdType('bericht'));
    return;
  }

  const nr = bericht.prNummer;
  const nrGeldig = Number.isInteger(nr) && nr > 0;
  if (nr === undefined) {
    fout('prNummer', meldingen.ontbreekt('prNummer'));
  } else if (!nrGeldig) {
    fout('prNummer', meldingen.verkeerdType('prNummer'));
  } else if (gezien.has(nr)) {
    fout('prNummer', meldingen.dubbelNummer(nr));
  } else {
    gezien.add(nr);
  }

  for (const veld of VERPLICHTE_TEKSTVELDEN) {
    const waarde = bericht[veld];
    if (isLeeg(waarde)) {
      fout(veld, meldingen.ontbreekt(veld));
    } else if (typeof waarde !== 'string') {
      fout(veld, meldingen.verkeerdType(veld));
    }
  }

  if (typeof bericht.bronUrl === 'string' && !isLeeg(bericht.bronUrl) && nrGeldig && bestand.repository !== null) {
    const verwacht = `https://github.com/${bestand.repository}/pull/${nr}`;
    if (bericht.bronUrl !== verwacht) {
      fout('bronUrl', meldingen.verkeerdeUrl(bestand.repository, nr));
    }
  }

  if (typeof bericht.status === 'string' && !isLeeg(bericht.status) && !STATUSSEN.includes(bericht.status)) {
    fout('status', meldingen.onbekendeStatus(bericht.status));
  }

  if (bericht.voorWie !== undefined && typeof bericht.voorWie !== 'string') {
    fout('voorWie', meldingen.verkeerdType('voorWie'));
  }

  if (bericht.gemergdOp !== undefined) {
    const gemergd = leesTijd(bericht.gemergdOp);
    if (gemergd === null) {
      fout('gemergdOp', meldingen.verkeerdType('gemergdOp'));
    } else if (bestand.van !== null && bestand.tot !== null && (gemergd < bestand.van || gemergd > bestand.tot)) {
      fout('gemergdOp', meldingen.buitenPeriode);
    }
  }
}

/**
 * Controleert een conceptbestand volgens docs/contract.md.
 * Geeft alle gevonden fouten tegelijk terug; bij één fout of meer is het bestand ongeldig
 * en hoort de app niets te laden.
 *
 * @param {string|unknown} json de inhoud van journaal-concept.json als tekst, of al ingelezen als object
 * @returns {{ geldig: boolean, fouten: Fout[] }}
 *   per fout het berichtnummer (vanaf 1, of null voor het hele bestand), het veld en de melding uit teksten.fouten
 */
export function valideerConcept(json) {
  /** @type {Fout[]} */
  const fouten = [];
  const uitkomst = () => ({ geldig: fouten.length === 0, fouten });
  const bestandsfout = (veld, melding) => fouten.push({ bericht: null, veld, melding });

  let concept = json;
  if (typeof json === 'string') {
    if (json.trim() === '') {
      bestandsfout('bestand', meldingen.leeg);
      return uitkomst();
    }
    try {
      concept = JSON.parse(json);
    } catch {
      bestandsfout('bestand', meldingen.geenJson);
      return uitkomst();
    }
  }

  if (!isObject(concept)) {
    bestandsfout('bestand', meldingen.verkeerdType('bestand'));
    return uitkomst();
  }

  const bestand = controleerBestand(concept, bestandsfout);

  if (concept.berichten === undefined) {
    bestandsfout('berichten', meldingen.ontbreekt('berichten'));
    return uitkomst();
  }
  if (!Array.isArray(concept.berichten)) {
    bestandsfout('berichten', meldingen.verkeerdType('berichten'));
    return uitkomst();
  }
  if (concept.berichten.length > MAX_BERICHTEN) {
    bestandsfout('berichten', meldingen.teVeel(concept.berichten.length));
  }

  const gezien = new Set();
  concept.berichten.forEach((bericht, index) => {
    controleerBericht(bericht, bestand, gezien, (veld, melding) =>
      fouten.push({ bericht: index + 1, veld, melding })
    );
  });

  return uitkomst();
}

/**
 * Welke statusovergang hoort bij welke knop op de kaart.
 * Goedkeuren: concept of meer-info-nodig → goedgekeurd. Terug naar concept: goedgekeurd → concept.
 * Uitsluiten: elke status behalve uitgesloten → uitgesloten. Weer opnemen: uitgesloten → concept.
 * Op een uitgesloten kaart is Goedkeuren dus uitgeschakeld; meer-info-nodig komt na een wijziging niet terug.
 * Zie de tabel in docs/contract.md.
 */
export const OVERGANGEN = Object.freeze({
  'concept': Object.freeze(['goedgekeurd', 'uitgesloten']),
  'meer-info-nodig': Object.freeze(['goedgekeurd', 'uitgesloten']),
  'goedgekeurd': Object.freeze(['concept', 'uitgesloten']),
  'uitgesloten': Object.freeze(['concept']),
});

/**
 * Een bericht uit het conceptbestand (zie docs/contract.md).
 * @typedef {{ prNummer: number, bronUrl: string, origineleTitel: string, gemergdOp?: string, kop: string,
 *   uitleg: string, voorWie?: string, status: string, publicatiestatus?: string }} Bericht
 */

/**
 * Zoekt de plek van een bericht in de lijst.
 * @param {Bericht[]} berichten
 * @param {number} prNummer een getal; zet een waarde uit een data-attribuut eerst om met Number()
 * @returns {number} de index van het bericht
 * @throws {RangeError} als er geen bericht met dit PR-nummer is
 */
function zoekIndex(berichten, prNummer) {
  const index = berichten.findIndex((b) => b.prNummer === prNummer);
  if (index === -1) throw new RangeError(`Er is geen bericht met PR-nummer ${prNummer}.`);
  return index;
}

/**
 * Vervangt één bericht in een kopie van de lijst; de originele lijst blijft ongewijzigd.
 * @param {Bericht[]} berichten
 * @param {number} index
 * @param {Partial<Bericht>} wijziging
 * @returns {Bericht[]}
 */
function vervang(berichten, index, wijziging) {
  return berichten.map((b, i) => (i === index ? { ...b, ...wijziging } : b));
}

/**
 * Kiest de berichten voor de uitzending: alleen de goedgekeurde,
 * in dezelfde volgorde als op de redactietafel (de volgorde van het concept).
 * @param {Bericht[]} berichten
 * @returns {Bericht[]} een nieuwe lijst; de originele lijst blijft ongewijzigd
 */
export function selecteerUitzending(berichten) {
  return berichten.filter((b) => b.status === 'goedgekeurd');
}

/**
 * Past de kop en/of de uitleg van één bericht aan. Andere velden, zoals de status, blijven zoals ze waren:
 * een goedgekeurd bericht blijft na bewerken goedgekeurd. Spaties aan het begin en eind worden weggehaald.
 * @param {Bericht[]} berichten
 * @param {number} prNummer het bericht dat je bewerkt
 * @param {{ kop?: string, uitleg?: string }} wijziging alleen de velden die veranderen
 * @returns {Bericht[]} een nieuwe lijst met het bewerkte bericht
 * @throws {RangeError} als het bericht niet bestaat, of als kop of uitleg leeg wordt
 */
export function bewerkBericht(berichten, prNummer, wijziging = {}) {
  const index = zoekIndex(berichten, prNummer);
  /** @type {Partial<Bericht>} */
  const nieuw = {};
  for (const veld of /** @type {const} */ (['kop', 'uitleg'])) {
    if (wijziging[veld] === undefined) continue;
    const waarde = typeof wijziging[veld] === 'string' ? wijziging[veld].trim() : '';
    if (waarde === '') throw new RangeError(`De ${veld} van bericht #${prNummer} mag niet leeg zijn.`);
    nieuw[veld] = waarde;
  }
  return vervang(berichten, index, nieuw);
}

/**
 * Zet een bericht op een nieuwe status, als die overgang mag (zie OVERGANGEN).
 * @param {Bericht[]} berichten
 * @param {number} prNummer het bericht dat je wijzigt
 * @param {string} nieuweStatus concept, goedgekeurd of uitgesloten
 * @returns {Bericht[]} een nieuwe lijst met het gewijzigde bericht
 * @throws {RangeError} als het bericht niet bestaat of de overgang niet mag
 */
export function wijzigStatus(berichten, prNummer, nieuweStatus) {
  const index = zoekIndex(berichten, prNummer);
  const huidig = berichten[index].status;
  if (!(OVERGANGEN[huidig] ?? []).includes(nieuweStatus)) {
    throw new RangeError(`Bericht #${prNummer} kan niet van ${huidig} naar ${nieuweStatus}.`);
  }
  return vervang(berichten, index, { status: nieuweStatus });
}

/** Velden van het bestand, in de volgorde van docs/contract.md. */
const BESTANDSVELDEN = ['repository', 'periode', 'gegenereerdOp', 'berichten'];

/** Velden van een bericht, in de volgorde van docs/contract.md. */
const BERICHTVELDEN = ['prNummer', 'bronUrl', 'origineleTitel', 'gemergdOp', 'kop', 'uitleg', 'voorWie', 'status', 'publicatiestatus'];

/**
 * Neemt alleen de genoemde velden over, in die volgorde; ontbrekende velden worden overgeslagen.
 * @param {Record<string, unknown>} bron
 * @param {string[]} velden
 * @returns {Record<string, unknown>}
 */
function kiesVelden(bron, velden) {
  return Object.fromEntries(velden.filter((v) => bron[v] !== undefined).map((v) => [v, bron[v]]));
}

/**
 * Maakt het totaaloverzicht om te kopiëren: per goedgekeurd bericht de kop, de uitleg en de link,
 * genummerd in de volgorde van de uitzending, met de publicatiestatus als laatste regel.
 * Een regeleinde in een kop of uitleg blijft staan; de inspringing van de volgende regel klopt dan niet meer.
 * @param {Bericht[]} berichten alle berichten; alleen de goedgekeurde komen in het overzicht
 * @returns {string} platte tekst, of een lege tekst als er niets is goedgekeurd
 */
export function maakTotaaloverzicht(berichten) {
  const goedgekeurd = selecteerUitzending(berichten);
  if (goedgekeurd.length === 0) return '';
  const blokken = goedgekeurd.map((b, i) => `${i + 1}. ${b.kop}\n   ${b.uitleg}\n   ${b.bronUrl}`);
  return `${blokken.join('\n\n')}\n\n${algemeen.publicatiestatus}\n`;
}

/**
 * Maakt het nagekeken journaal als JSON, in het formaat van docs/contract.md, met alle berichten
 * (ook concept en uitgesloten) en hun bewerkte kop, uitleg en status. Het resultaat slaagt weer voor
 * valideerConcept, zodat je het later opnieuw kunt importeren en verder kunt werken.
 * Velden buiten het contract worden weggelaten; de publicatiestatus blijft "niet gecontroleerd".
 * @param {{ repository: string, periode: { van: string, tot: string }, gegenereerdOp?: string }} concept het ingeladen concept
 * @param {Bericht[]} berichten de berichten zoals ze nu op de redactietafel staan
 * @returns {string} ingesprongen JSON met een regeleinde aan het eind
 */
export function exporteerJournaal(concept, berichten) {
  const journaal = kiesVelden(
    {
      ...concept,
      periode: { van: concept.periode.van, tot: concept.periode.tot },
      berichten: berichten.map((b) => kiesVelden({ ...b, publicatiestatus: PUBLICATIESTATUS }, BERICHTVELDEN)),
    },
    BESTANDSVELDEN
  );
  return `${JSON.stringify(journaal, null, 2)}\n`;
}
