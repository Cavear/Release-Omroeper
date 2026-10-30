/**
 * De voice-over van de uitzending: de browser leest elk scherm voor met de Web Speech API,
 * zo plechtig als het kan: een Nederlandse mannenstem, lager en trager, met elke zin los uitgesproken.
 * @module voorlezer
 */

/** Toonhoogte en tempo van de omroeper (1 = normaal); de kop iets plechtiger dan de rest. */
export const STEM = { toonhoogte: 0.8, tempo: 0.9, kopToonhoogte: 0.75, kopTempo: 0.82 };

/**
 * Voorkeur voor de stem, in volgorde: Nederlandse mannenstemmen van Edge, Apple en Windows.
 * Daarna telt elke Nederlandse stem; een stem in een andere taal leest nooit Nederlandse tekst voor.
 */
const VOORKEUR = [/maarten/i, /arnaud/i, /xander/i, /frank/i, /\bmale\b|\bman\b/i];

/** Leestijd per woord en minimale duur van een scherm (ms), voor als er geen stem is. */
const MS_PER_WOORD = 420;
const MINIMALE_DUUR = 5000;

/** Gekozen stem en de lopende beurt; een nieuwe beurt laat de vorige ophouden. */
const voorlezer = { stem: /** @type {SpeechSynthesisVoice | null} */ (null), beurt: 0 };

/**
 * Kiest de stem van de omroeper uit de beschikbare stemmen.
 * @param {{ name: string, lang: string }[]} stemmen
 * @returns {{ name: string, lang: string } | null} de beste Nederlandse stem, of null als er geen is
 */
export function kiesStem(stemmen) {
  const nederlands = stemmen.filter((s) => /^nl\b/i.test(s.lang.replace('_', '-')));
  for (const patroon of VOORKEUR) {
    const gevonden = nederlands.find((s) => patroon.test(s.name));
    if (gevonden) return gevonden;
  }
  return nederlands.find((s) => /^nl-NL$/i.test(s.lang.replace('_', '-'))) ?? nederlands[0] ?? null;
}

/**
 * Schat hoe lang het voorlezen van een tekst duurt; de film gebruikt dit als er geen stem is.
 * @param {string} tekst
 * @returns {number} duur in ms, minimaal MINIMALE_DUUR
 */
export function leesTijd(tekst) {
  const woorden = tekst.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(MINIMALE_DUUR, woorden * MS_PER_WOORD);
}

/** Zoekt de stem opnieuw op; browsers laden hun stemmen vaak pas na een tijdje. */
function laadStem() {
  voorlezer.stem = /** @type {SpeechSynthesisVoice | null} */ (kiesStem(window.speechSynthesis.getVoices()));
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  laadStem();
  window.speechSynthesis.addEventListener?.('voiceschanged', laadStem);
}

/**
 * Geeft aan of er een Nederlandse stem is om mee voor te lezen.
 * @returns {boolean}
 */
export function kanVoorlezen() {
  return typeof window !== 'undefined' && Boolean(window.speechSynthesis) && voorlezer.stem !== null;
}

/**
 * Spreekt één zin uit. Lost op als de zin klaar is, ook als de browser het einde niet meldt (dan na een ruime leestijd).
 * @param {string} zin
 * @param {boolean} kop de kop klinkt plechtiger
 * @returns {Promise<void>}
 */
function spreekZin(zin, kop) {
  return new Promise((klaar) => {
    const uiting = new SpeechSynthesisUtterance(zin);
    uiting.voice = voorlezer.stem;
    uiting.lang = voorlezer.stem.lang;
    uiting.pitch = kop ? STEM.kopToonhoogte : STEM.toonhoogte;
    uiting.rate = kop ? STEM.kopTempo : STEM.tempo;
    // Sommige browsers melden het einde niet; dan gaat de film toch door.
    const vangnet = setTimeout(klaar, leesTijd(zin) * 2 + 3000);
    const einde = () => { clearTimeout(vangnet); klaar(); };
    uiting.addEventListener('end', einde);
    uiting.addEventListener('error', einde);
    window.speechSynthesis.speak(uiting);
  });
}

/**
 * Leest de zinnen van een scherm voor, één voor één. De eerste zin is de kop.
 * Stopt vanzelf als intussen stopVoorlezen of een nieuwe spreek-aanroep kwam.
 * @param {string[]} zinnen
 * @param {{ bijStart?: () => void }} [opties] bijStart: vlak voor de eerste zin (om de muziek zachter te zetten)
 * @returns {Promise<boolean>} true als alles is voorgelezen, false als het werd onderbroken
 */
export async function spreek(zinnen, { bijStart } = {}) {
  stopVoorlezen();
  const beurt = voorlezer.beurt;
  bijStart?.();
  for (const [i, zin] of zinnen.entries()) {
    if (beurt !== voorlezer.beurt) return false;
    await spreekZin(zin, i === 0);
  }
  return beurt === voorlezer.beurt;
}

/** Breekt het voorlezen direct af. */
export function stopVoorlezen() {
  voorlezer.beurt += 1;
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}
