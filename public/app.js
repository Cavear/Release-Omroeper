/**
 * Startpunt van de webapp: DOM, events en weergave.
 * De logica komt uit logic.js, alle zichtbare teksten uit teksten.js.
 * Stap 3.1: concept importeren, controleren en als kaarten tonen; foutmelding, lege staat en laadstaat.
 * @module app
 */
import { valideerConcept, PUBLICATIESTATUS } from './logic.js';
import { algemeen, knoppen, statussen, kaart, leeg, meldingen, fouten, bevestigVervangen } from './teksten.js';

/** Tijdzone van de redactie; tijden in het concept worden hierin getoond. */
const TIJDZONE = 'Europe/Amsterdam';
const tijdOpmaak = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: TIJDZONE });
const datumOpmaak = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIJDZONE });

/**
 * De toestand van de redactie.
 * @type {{ concept: null | { repository: string, periode: { van: string, tot: string }, gegenereerdOp?: string }, berichten: import('./logic.js').Bericht[] }}
 */
const staat = { concept: null, berichten: [] };

/** Vaste elementen uit index.html. */
const el = {
  merk: document.getElementById('merk'),
  kop: document.getElementById('redactie-kop'),
  metaregel: document.getElementById('metaregel'),
  kopknoppen: document.getElementById('kopknoppen'),
  fout: document.getElementById('fout'),
  leeg: document.getElementById('lege-staat'),
  werk: document.getElementById('werk'),
  publicatie: document.getElementById('publicatie'),
  kaarten: document.getElementById('kaarten'),
  kiezer: document.getElementById('bestandskiezer'),
  melding: document.getElementById('melding'),
};

/** Inline SVG-iconen (stroke 1.75, currentColor), altijd naast tekst en verborgen voor schermlezers. */
const ICONEN = {
  importeren: '<path d="M12 15V3M7 8l5-5 5 5M4 15v5h16v-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  extern: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
  waarschuwing: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  'goedgekeurd': '<path d="M5 12l5 5 9-10"/>',
  'meer-info-nodig': '<path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V15M12 18.5v.01"/>',
  'uitgesloten': '<path d="M6 6l12 12M18 6L6 18"/>',
  'concept': '<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/>',
};

/**
 * Maakt een SVG-icoon.
 * @param {keyof typeof ICONEN} naam
 * @param {boolean} [klein] 16 px in plaats van 18 px
 * @returns {SVGSVGElement}
 */
function icoon(naam, klein = false) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', klein ? 'icoon icoon--klein' : 'icoon');
  svg.innerHTML = ICONEN[naam];
  return svg;
}

/**
 * Maakt een element met attributen en kinderen. Tekst wordt altijd als tekst gezet, nooit als HTML.
 * @param {string} tag
 * @param {Record<string, string | boolean>} [attributen]
 * @param {...(Node | string | null | false)} kinderen
 * @returns {HTMLElement}
 */
function maak(tag, attributen = {}, ...kinderen) {
  const element = document.createElement(tag);
  for (const [naam, waarde] of Object.entries(attributen)) {
    if (waarde === false) continue;
    element.setAttribute(naam, waarde === true ? '' : waarde);
  }
  element.append(...kinderen.filter((k) => k !== null && k !== false));
  return element;
}

/**
 * Toont een korte melding in #melding (aria-live) en haalt hem na een paar seconden weer weg.
 * @param {string} tekst
 */
function meld(tekst) {
  el.melding.textContent = tekst;
  clearTimeout(meld.timer);
  meld.timer = setTimeout(() => { el.melding.textContent = ''; }, 4000);
}

/**
 * Maakt een importknop. Er zijn er twee (kop en lege staat); beide openen dezelfde bestandskiezer.
 * @param {boolean} primair de grote rode knop in de lege staat
 * @returns {HTMLButtonElement}
 */
function maakImportknop(primair) {
  const knop = maak('button', { type: 'button', class: primair ? 'knop knop--primair knop--groot' : 'knop', 'data-import': true });
  zetImportknop(knop, false);
  knop.addEventListener('click', () => el.kiezer.click());
  return knop;
}

/**
 * Zet een importknop in de gewone stand of in de laadstand.
 * @param {HTMLButtonElement} knop
 * @param {boolean} bezig
 */
function zetImportknop(knop, bezig) {
  knop.disabled = bezig;
  if (bezig) knop.setAttribute('aria-busy', 'true'); else knop.removeAttribute('aria-busy');
  knop.replaceChildren(bezig ? maak('span', { class: 'spinner', 'aria-hidden': 'true' }) : icoon('importeren'),
    bezig ? knoppen.bezigMetInlezen : knoppen.importeren);
}

/** Vult de vaste teksten en knoppen bij het opstarten. */
function bouwVasteDelen() {
  el.merk.textContent = algemeen.merk;
  el.kop.textContent = algemeen.redactieKop;
  el.kopknoppen.append(maakImportknop(false));

  el.publicatie.append(icoon('info'), maak('span', {}, maak('strong', {}, `${algemeen.publicatiestatus}.`), ` ${algemeen.publicatieUitleg}`));

  el.leeg.append(
    maak('div', { class: 'leeg__intro' },
      maak('p', { class: 'ornament' }, leeg.ornament),
      maak('h2', { id: 'leeg-kop' }, leeg.kop),
      maak('p', {}, leeg.intro)),
    maak('ol', { class: 'stappen' }, ...leeg.stappen.map((stap, i) =>
      maak('li', {}, maak('span', { class: 'stappen__nr', 'aria-hidden': 'true' }, String(i + 1)), maak('strong', {}, stap.titel), maak('span', {}, stap.tekst)))),
    maakImportknop(true),
    maak('a', { href: algemeen.handleidingUrl }, algemeen.handleidingLink));
}

/**
 * Maakt de metaregel onder de paginakop.
 * @param {NonNullable<typeof staat.concept>} concept
 * @returns {string}
 */
function maakMetaregel(concept) {
  const van = new Date(concept.periode.van);
  return algemeen.metaregel({
    repository: concept.repository,
    datum: datumOpmaak.format(van).replace('.', ''),
    van: tijdOpmaak.format(van),
    tot: tijdOpmaak.format(new Date(concept.periode.tot)),
    gegenereerd: concept.gegenereerdOp ? tijdOpmaak.format(new Date(concept.gegenereerdOp)) : algemeen.onbekendeTijd,
  });
}

/**
 * Maakt het statuslabel van een kaart.
 * @param {string} status
 * @returns {HTMLElement}
 */
function maakStatuslabel(status) {
  return maak('span', { class: 'status' },
    maak('span', { class: `label label--${status}` }, icoon(status, true), statussen[status].label));
}

/**
 * Maakt de kaart van één bericht.
 * @param {import('./logic.js').Bericht} b
 * @returns {HTMLElement}
 */
function maakKaart(b) {
  const kopId = `kop-${b.prNummer}`;
  const modifier = { 'meer-info-nodig': ' kaart--let-op', 'uitgesloten': ' kaart--uit' }[b.status] ?? '';
  const meta = b.gemergdOp ? kaart.meta(b.prNummer, tijdOpmaak.format(new Date(b.gemergdOp))) : kaart.metaZonderTijd(b.prNummer);
  return maak('article', { class: `kaart${modifier}`, 'data-testid': 'kaart', 'data-pr': String(b.prNummer), 'aria-labelledby': kopId },
    maak('div', { class: 'kaart__boven' }, maak('span', { class: 'kaart__meta' }, meta), maakStatuslabel(b.status)),
    maak('p', { class: 'kaart__origineel' }, `${kaart.origineel} `, maak('span', {}, b.origineleTitel)),
    maak('h3', { class: 'kaart__kop', id: kopId }, b.kop),
    maak('p', { class: 'kaart__uitleg' }, b.uitleg),
    maak('p', { class: 'kaart__wie' }, `${kaart.voor} ${b.voorWie ?? kaart.voorOnbekend}`),
    maak('div', { class: 'kaart__acties knoppenrij' },
      maak('a', { class: 'knop knop--link', href: b.bronUrl, target: '_blank', rel: 'noopener' }, knoppen.bronOpenen, icoon('extern', true))));
}

/** Toont de redactie volgens de huidige staat: lege staat of kaarten. */
function toonRedactie() {
  const heeftConcept = staat.concept !== null;
  el.metaregel.hidden = !heeftConcept;
  if (heeftConcept) el.metaregel.textContent = maakMetaregel(staat.concept);
  const heeftBerichten = staat.berichten.length > 0;
  el.leeg.hidden = heeftBerichten;
  el.werk.hidden = !heeftBerichten;
  el.kaarten.replaceChildren(...staat.berichten.map(maakKaart));
}

/**
 * Toont de foutmelding na een mislukte import. Het huidige werk blijft staan.
 * @param {string} bestandsnaam
 * @param {import('./logic.js').Fout[]} lijst
 */
function toonFout(bestandsnaam, lijst) {
  el.fout.replaceChildren(
    icoon('waarschuwing'),
    maak('div', { class: 'fout__inhoud' },
      maak('h2', {}, fouten.kop),
      maak('p', {}, fouten.intro(bestandsnaam, lijst.length)),
      maak('ul', {}, ...lijst.map((f) => maak('li', {}, fouten.regel(f)))),
      maak('p', { class: 'fout__oplossing' }, fouten.oplossing)));
  el.fout.hidden = false;
}

/** Verbergt de foutmelding. */
function verbergFout() {
  el.fout.hidden = true;
  el.fout.replaceChildren();
}

/**
 * Leest een bestand in, controleert het en laadt het alleen als het helemaal klopt.
 * Bij een fout of annuleren blijft het huidige werk staan.
 * @param {File} bestand
 * @returns {Promise<boolean>} true als het concept is ingeladen
 */
async function laadBestand(bestand) {
  let tekst;
  try {
    tekst = await bestand.text();
  } catch {
    toonFout(bestand.name, [{ bericht: null, veld: 'bestand', melding: fouten.nietLeesbaar }]);
    return false;
  }
  const uitkomst = valideerConcept(tekst);
  if (!uitkomst.geldig) {
    toonFout(bestand.name, uitkomst.fouten);
    return false;
  }
  if (staat.berichten.length > 0 && !window.confirm(bevestigVervangen)) {
    meld(meldingen.importGeannuleerd);
    return false;
  }
  const concept = JSON.parse(tekst);
  staat.concept = { repository: concept.repository, periode: concept.periode, gegenereerdOp: concept.gegenereerdOp };
  staat.berichten = concept.berichten.map((b) => ({ ...b, publicatiestatus: PUBLICATIESTATUS }));
  verbergFout();
  toonRedactie();
  meld(meldingen.ingeladen(staat.berichten.length));
  return true;
}

/**
 * Importeert een gekozen bestand, met laadstand op de importknoppen en de focus daarna op een logische plek.
 * @param {File} bestand
 */
async function importeer(bestand) {
  const importknoppen = [...document.querySelectorAll('[data-import]')];
  // Uitgeschakelde knoppen verliezen de focus; onthoud waar die was om hem daarna terug te zetten.
  const vorigeFocus = document.activeElement;
  importknoppen.forEach((k) => zetImportknop(k, true));
  const geladen = await laadBestand(bestand);
  importknoppen.forEach((k) => zetImportknop(k, false));
  el.kiezer.value = '';
  // De importknop in de lege staat verdwijnt na een geslaagde import; zet de focus dan op die in de kop.
  if (geladen && el.leeg.contains(vorigeFocus)) el.kopknoppen.querySelector('[data-import]').focus();
  else if (importknoppen.includes(vorigeFocus)) vorigeFocus.focus();
}

el.kiezer.addEventListener('change', () => {
  const [bestand] = el.kiezer.files;
  if (bestand) importeer(bestand);
});

bouwVasteDelen();
toonRedactie();
