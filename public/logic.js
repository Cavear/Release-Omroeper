/**
 * Pure logica van de Release-omroeper (validatie, selectie, redactie, export).
 * Zonder DOM, zodat alles met Vitest te testen is.
 * @module logic
 */
import { fouten as meldingen } from './teksten.js';

/** De vier geldige statussen van een bericht. */
export const STATUSSEN = ['concept', 'meer-info-nodig', 'goedgekeurd', 'uitgesloten'];

/** Maximaal aantal berichten in één journaal. */
export const MAX_BERICHTEN = 5;

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
