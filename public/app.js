/**
 * Startpunt van de webapp: DOM, events en weergave.
 * De logica komt uit logic.js, alle zichtbare teksten uit teksten.js.
 * Stap 3.1: concept importeren, controleren en als kaarten tonen; foutmelding, lege staat en laadstaat.
 * Stap 3.2: per kaart goedkeuren, uitsluiten en bewerken; het journaal exporteren.
 * Stap 3.3: teller met Start uitzending; de uitzending met nieuwsframes, Volgende, en het eindscherm.
 * Stap 3.5: aftelleader 3-2-1, titelkaart en de effectlagen (korrel, vignet, flikkering, krassen) in index.html.
 * Stap 3.8: Help-paneel (knop Help en sneltoets ?) en een uitleg-icoon bij elk statuslabel.
 * De uitzending als film: hij loopt vanzelf door, een omroeper leest elk scherm voor (voorlezer.js) boven de muziek uit
 * (muziek.js). Knoppen Pauzeren/Afspelen (P) en Geluid uit/aan (M).
 * @module app
 */
import {
  valideerConcept, wijzigStatus, bewerkBericht, exporteerJournaal, selecteerUitzending, maakTotaaloverzicht, PUBLICATIESTATUS,
} from './logic.js';
import { kanMuziek, startMuziek, stopMuziek, zetMuziek, muziekStaatAan, dempMuziek } from './muziek.js';
import { kanVoorlezen, spreek, stopVoorlezen, leesTijd } from './voorlezer.js';
import {
  algemeen, knoppen, statussen, kaart, teller, leeg, meldingen, fouten, bevestigVervangen, uitzending, help, voorlezen,
} from './teksten.js';

/** Minimale horizontale veegafstand (px) voordat vegen naar links als Volgende telt. */
const VEEG_MIN = 50;

/** Tijdzone van de redactie; tijden in het concept worden hierin getoond. */
const TIJDZONE = 'Europe/Amsterdam';
const tijdOpmaak = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: TIJDZONE });
const datumOpmaak = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIJDZONE });
const datumLang = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIJDZONE });

/** Eerste en laatste stap van de uitzending vóór de nieuwsframes. */
const LEADER = -2;
const TITELKAART = -1;
/** Duur van één cijfer van de aftelleader in ms (token --duur-leader). */
const LEADER_TIK = 1000;

/**
 * De toestand van de redactie. `bewerkt` is het PR-nummer van de kaart in de bewerkstand, of null.
 * `gewijzigd` is waar als er redactiewerk is dat nog niet is geëxporteerd.
 * @type {{ concept: null | { repository: string, periode: { van: string, tot: string }, gegenereerdOp?: string }, berichten: import('./logic.js').Bericht[], bewerkt: number | null, gewijzigd: boolean }}
 */
const staat = { concept: null, berichten: [], bewerkt: null, gewijzigd: false };

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
  teller: document.getElementById('teller'),
  redactie: document.getElementById('redactie'),
  uitzending: document.getElementById('uitzending'),
  frame: document.getElementById('uitzending-frame'),
  balk: document.getElementById('balk'),
  help: document.getElementById('help'),
};

/**
 * De lopende uitzending: de goedgekeurde berichten en welk scherm nu in beeld is.
 * `stap` is LEADER (-2), TITELKAART (-1), 0 t/m n-1 voor een nieuwsframe, of n voor het eindscherm.
 * `teller` is het cijfer op de leader, `klok` de timer ervan.
 * @type {{ berichten: import('./logic.js').Bericht[], stap: number, teller: number, klok: number | null }}
 */
const uz = { berichten: [], stap: LEADER, teller: 3, klok: null };

/** Stilte na het voorlezen van een scherm, voordat de film doorgaat (ms). */
const PAUZE_NA_SCENE = 1500;

/**
 * De regie van de film. `speelt` is onwaar na Pauzeren; `beurt` telt op bij elk nieuw scherm, zodat een oude
 * voorleesbeurt of timer niets meer doet; `klok` is de timer naar het volgende scherm.
 * @type {{ speelt: boolean, beurt: number, klok: number | null }}
 */
const regie = { speelt: true, beurt: 0, klok: null };

/** Inline SVG-iconen (stroke 1.75, currentColor), altijd naast tekst en verborgen voor schermlezers. */
const ICONEN = {
  importeren: '<path d="M12 15V3M7 8l5-5 5 5M4 15v5h16v-5"/>',
  exporteren: '<path d="M12 3v12M7 10l5 5 5-5M4 15v5h16v-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  extern: '<path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5"/>',
  waarschuwing: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  'goedgekeurd': '<path d="M5 12l5 5 9-10"/>',
  'meer-info-nodig': '<path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7V15M12 18.5v.01"/>',
  'uitgesloten': '<path d="M6 6l12 12M18 6L6 18"/>',
  'concept': '<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/>',
  start: '<path d="M7 5l12 7-12 7z"/>',
  volgende: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  sluiten: '<path d="M6 6l12 12M18 6L6 18"/>',
  geluidAan: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  geluidUit: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/>',
  pauzeren: '<path d="M8 5v14M16 5v14"/>',
  kopieer: '<rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17v.01"/>',
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
  el.exportknop = maak('button', { type: 'button', class: 'knop', hidden: true }, icoon('exporteren'), knoppen.exporteren);
  el.exportknop.addEventListener('click', exporteer);
  el.helpknop = maak('button', { type: 'button', class: 'knop', 'aria-keyshortcuts': '?', 'aria-haspopup': 'dialog' }, icoon('help'), knoppen.help);
  el.helpknop.addEventListener('click', openHelp);
  el.kopknoppen.append(el.helpknop, maakImportknop(false), el.exportknop);

  el.publicatie.append(icoon('info'), maak('span', {}, maak('strong', {}, `${algemeen.publicatiestatus}.`), ` ${algemeen.publicatieUitleg}`));

  el.leeg.append(
    maak('div', { class: 'leeg__intro' },
      maak('p', { class: 'ornament' }, leeg.ornament),
      maak('h2', { id: 'leeg-kop' }, leeg.kop),
      maak('p', {}, leeg.intro)),
    maak('ol', { class: 'stappen' }, ...leeg.stappen.map((stap, i) =>
      maak('li', {}, maak('span', { class: 'stappen__nr', 'aria-hidden': 'true' }, String(i + 1)), maak('strong', {}, stap.titel), maak('span', {}, stap.tekst)))),
    maakImportknop(true),
    maak('a', { href: algemeen.handleidingUrl, target: '_blank', rel: 'noopener' }, algemeen.handleidingLink));
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
 * Maakt het statuslabel van een kaart, met een uitleg-icoon dat de korte uitleg bij die status openklapt.
 * @param {string} status
 * @param {string} uitlegId id van de uitlegregel op de kaart
 * @returns {HTMLElement}
 */
function maakStatuslabel(status, uitlegId) {
  return maak('span', { class: 'status' },
    maak('span', { class: `label label--${status}` }, icoon(status, true), statussen[status].label),
    maak('button', {
      type: 'button', class: 'uitleg-icoon', 'data-actie': 'uitleg',
      'aria-label': knoppen.uitlegOverStatus(statussen[status].label), 'aria-expanded': 'false', 'aria-controls': uitlegId,
    }, icoon('info')));
}

/**
 * Maakt een actieknop op een kaart. `data-actie` blijft gelijk als de tekst wisselt, zodat de focus na
 * het opnieuw tekenen op dezelfde knop terugkomt.
 * @param {string} actie goed, uit, bewerk, opslaan of annuleer
 * @param {string} tekst
 * @param {Record<string, string | boolean>} [extra] extra attributen
 * @returns {HTMLButtonElement}
 */
function maakActieknop(actie, tekst, extra = {}) {
  return maak('button', { type: 'button', class: 'knop', 'data-actie': actie, ...extra }, tekst);
}

/**
 * Maakt de actierij van een kaart in de gewone stand.
 * Op een uitgesloten kaart is Goedkeuren uitgeschakeld, met uitleg (zie docs/contract.md).
 * @param {import('./logic.js').Bericht} b
 * @returns {HTMLElement}
 */
function maakActies(b) {
  const uitgesloten = b.status === 'uitgesloten';
  const uitlegId = `eerst-opnemen-${b.prNummer}`;
  // Zoals in het ontwerp: de statusknoppen op de eerste regel, Bewerken en Bron openen op de tweede.
  return maak('div', { class: 'kaart__acties' },
    maak('div', { class: 'knoppenrij' },
      maakActieknop('goed', b.status === 'goedgekeurd' ? knoppen.terugNaarConcept : knoppen.goedkeuren,
        uitgesloten ? { disabled: true, 'aria-describedby': uitlegId } : {}),
      maakActieknop('uit', uitgesloten ? knoppen.weerOpnemen : knoppen.uitsluiten)),
    maak('div', { class: 'knoppenrij' },
      maakActieknop('bewerk', knoppen.bewerken, { class: 'knop knop--tekst' }),
      maak('a', { class: 'knop knop--link', href: b.bronUrl, target: '_blank', rel: 'noopener' }, knoppen.bronOpenen, icoon('extern', true))),
    uitgesloten && maak('span', { id: uitlegId, class: 'visueel-verborgen' }, kaart.eerstOpnemen));
}

/**
 * Maakt het bewerkformulier voor kop en uitleg. Opslaan met de knop of Enter in de kop; Esc of Annuleren breekt af.
 * @param {import('./logic.js').Bericht} b
 * @returns {HTMLFormElement}
 */
function maakBewerkformulier(b) {
  const id = (veld) => `bewerk-${veld}-${b.prNummer}`;
  return maak('form', { class: 'stapel', 'data-bewerk': String(b.prNummer), novalidate: true },
    maak('div', { class: 'veld' },
      maak('label', { for: id('kop') }, kaart.kopLabel),
      maak('input', { id: id('kop'), name: 'kop', type: 'text', value: b.kop, 'aria-describedby': id('fout') })),
    maak('div', { class: 'veld' },
      maak('label', { for: id('uitleg') }, kaart.uitlegLabel),
      maak('textarea', { id: id('uitleg'), name: 'uitleg', 'aria-describedby': id('fout') }, b.uitleg),
      maak('p', { id: id('fout'), class: 'veld__fout', role: 'alert' })),
    maak('div', { class: 'kaart__acties knoppenrij' },
      maak('button', { type: 'submit', class: 'knop knop--primair', 'data-actie': 'opslaan' }, knoppen.opslaan),
      maakActieknop('annuleer', knoppen.annuleren)));
}

/**
 * Maakt de kaart van één bericht, in de gewone stand of in de bewerkstand.
 * @param {import('./logic.js').Bericht} b
 * @returns {HTMLElement}
 */
function maakKaart(b) {
  const kopId = `kop-${b.prNummer}`;
  const bewerkstand = staat.bewerkt === b.prNummer;
  const modifier = { 'meer-info-nodig': ' kaart--let-op', 'uitgesloten': ' kaart--uit' }[b.status] ?? '';
  const meta = b.gemergdOp ? kaart.meta(b.prNummer, tijdOpmaak.format(new Date(b.gemergdOp))) : kaart.metaZonderTijd(b.prNummer);
  return maak('article', { class: `kaart${modifier}`, 'data-testid': 'kaart', 'data-pr': String(b.prNummer), 'aria-labelledby': kopId },
    maak('div', { class: 'kaart__boven' }, maak('span', { class: 'kaart__meta' }, meta), maakStatuslabel(b.status, `uitleg-${b.prNummer}`)),
    maak('p', { class: 'uitleg-pop', id: `uitleg-${b.prNummer}`, hidden: true }, statussen[b.status].uitleg),
    maak('p', { class: 'kaart__origineel' }, `${kaart.origineel} `, maak('span', {}, b.origineleTitel)),
    // In de bewerkstand blijft de kop als verborgen naam van de kaart bestaan.
    maak('h3', { class: bewerkstand ? 'visueel-verborgen' : 'kaart__kop', id: kopId }, b.kop),
    !bewerkstand && maak('p', { class: 'kaart__uitleg' }, b.uitleg),
    maak('p', { class: 'kaart__wie' }, `${kaart.voor} ${b.voorWie ?? kaart.voorOnbekend}`),
    bewerkstand ? maakBewerkformulier(b) : maakActies(b));
}

/**
 * Toont de redactie volgens de huidige staat: lege staat of kaarten.
 * @param {{ pr: number, actie: string } | null} [focus] de knop die na het tekenen de focus krijgt
 */
function toonRedactie(focus = null) {
  // Getypte, nog niet opgeslagen tekst in de open bewerkstand overleeft het opnieuw tekenen.
  const open = leesBewerkstand();
  const heeftConcept = staat.concept !== null;
  el.metaregel.hidden = !heeftConcept;
  if (heeftConcept) el.metaregel.textContent = maakMetaregel(staat.concept);
  el.exportknop.hidden = !heeftConcept;
  const heeftBerichten = staat.berichten.length > 0;
  el.leeg.hidden = heeftBerichten;
  el.werk.hidden = !heeftBerichten;
  el.kaarten.replaceChildren(...staat.berichten.map(maakKaart));
  toonTeller();
  const formulier = el.kaarten.querySelector(`[data-bewerk="${staat.bewerkt}"]`);
  if (open && formulier && open.pr === staat.bewerkt) {
    formulier.elements.kop.value = open.kop;
    formulier.elements.uitleg.value = open.uitleg;
  }
  if (focus) {
    const kaartEl = el.kaarten.querySelector(`[data-pr="${focus.pr}"]`);
    const doel = kaartEl?.querySelector(`[data-actie="${focus.actie}"]:not(:disabled)`) ?? kaartEl?.querySelector('[data-actie="uit"]');
    doel?.focus();
  }
}

/**
 * Wijzigt de status van een bericht via de knop Goedkeuren/Terug naar concept of Uitsluiten/Weer opnemen.
 * @param {number} pr
 * @param {'goed' | 'uit'} actie
 */
function wisselStatus(pr, actie) {
  const huidig = staat.berichten.find((b) => b.prNummer === pr).status;
  const nieuw = actie === 'goed'
    ? (huidig === 'goedgekeurd' ? 'concept' : 'goedgekeurd')
    : (huidig === 'uitgesloten' ? 'concept' : 'uitgesloten');
  staat.berichten = wijzigStatus(staat.berichten, pr, nieuw);
  staat.gewijzigd = true;
  toonRedactie({ pr, actie });
  meld({ goedgekeurd: meldingen.goedgekeurd, uitgesloten: meldingen.uitgesloten, concept: meldingen.terugNaarConcept }[nieuw](pr));
}

/**
 * Leest wat er nu in het open bewerkformulier staat.
 * @returns {{ pr: number, kop: string, uitleg: string, gewijzigd: boolean } | null} null als er geen formulier open is
 */
function leesBewerkstand() {
  const formulier = el.kaarten.querySelector('[data-bewerk]');
  if (!formulier) return null;
  const pr = Number(formulier.dataset.bewerk);
  const bericht = staat.berichten.find((b) => b.prNummer === pr);
  const kop = formulier.elements.kop.value;
  const uitleg = formulier.elements.uitleg.value;
  return { pr, kop, uitleg, gewijzigd: !bericht || kop !== bericht.kop || uitleg !== bericht.uitleg };
}

/**
 * Zet een kaart in of uit de bewerkstand. Er is altijd hoogstens één kaart in de bewerkstand.
 * Wie naar een andere kaart wisselt terwijl er nog niet-opgeslagen tekst staat, krijgt eerst een vraag.
 * @param {number | null} pr
 */
function zetBewerkstand(pr) {
  const vorige = staat.bewerkt;
  const open = leesBewerkstand();
  if (pr !== null && open?.gewijzigd && open.pr !== pr && !window.confirm(kaart.wijzigingWeggooien(open.pr))) return;
  // De open bewerkstand sluit; zijn tekst hoeft niet terug.
  el.kaarten.querySelector('[data-bewerk]')?.remove();
  staat.bewerkt = pr;
  toonRedactie(pr === null && vorige !== null ? { pr: vorige, actie: 'bewerk' } : null);
  if (pr !== null) el.kaarten.querySelector(`[data-bewerk="${pr}"] input`).focus();
}

/**
 * Slaat de bewerkte kop en uitleg op. Bij een leeg veld blijft de bewerkstand open met een foutregel.
 * @param {HTMLFormElement} formulier
 */
function slaOp(formulier) {
  const pr = Number(formulier.dataset.bewerk);
  const kop = formulier.elements.kop.value;
  const uitleg = formulier.elements.uitleg.value;
  if (kop.trim() === '' || uitleg.trim() === '') {
    formulier.querySelector('.veld__fout').textContent = kaart.leegVeld;
    for (const veld of [formulier.elements.kop, formulier.elements.uitleg]) veld.setAttribute('aria-invalid', String(veld.value.trim() === ''));
    (kop.trim() === '' ? formulier.elements.kop : formulier.elements.uitleg).focus();
    return;
  }
  staat.berichten = bewerkBericht(staat.berichten, pr, { kop, uitleg });
  staat.gewijzigd = true;
  zetBewerkstand(null);
  meld(meldingen.opgeslagen(pr));
}

/**
 * Biedt het nagekeken journaal aan als download (journaal-nagekeken.json).
 * Staat er nog niet-opgeslagen tekst in een bewerkstand, dan vraagt de app eerst of je toch wilt exporteren.
 */
function exporteer() {
  const open = leesBewerkstand();
  if (open?.gewijzigd && !window.confirm(kaart.exportZonderWijziging(open.pr))) {
    meld(meldingen.exportGeannuleerd);
    return;
  }
  const json = exporteerJournaal(staat.concept, staat.berichten);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = maak('a', { href: url, download: kaart.bestandsnaamExport, hidden: true });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  staat.gewijzigd = false;
  meld(meldingen.geexporteerd);
}

// Wie het tabblad sluit of ververst met werk dat nog niet is geëxporteerd, krijgt eerst de vraag van de browser.
window.addEventListener('beforeunload', (event) => {
  if (!staat.gewijzigd && !leesBewerkstand()?.gewijzigd) return;
  event.preventDefault();
  event.returnValue = '';
});

el.kaarten.addEventListener('click', (event) => {
  const knop = event.target.closest('button[data-actie]');
  if (!knop || knop.type === 'submit') return;
  if (knop.dataset.actie === 'uitleg') {
    wisselUitleg(knop);
    return;
  }
  const pr = Number(knop.closest('[data-pr]').dataset.pr);
  const actie = knop.dataset.actie;
  if (actie === 'goed' || actie === 'uit') wisselStatus(pr, actie);
  else if (actie === 'bewerk') zetBewerkstand(pr);
  else if (actie === 'annuleer') zetBewerkstand(null);
});

el.kaarten.addEventListener('submit', (event) => {
  event.preventDefault();
  slaOp(event.target);
});

el.kaarten.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && event.target.closest('[data-bewerk]')) zetBewerkstand(null);
  else if (event.key === 'Escape' && event.target.getAttribute('aria-expanded') === 'true') wisselUitleg(event.target);
});

/**
 * Klapt de korte uitleg bij een statuslabel open of dicht. Werkt met klik, tik en toetsenbord (het is een echte knop).
 * @param {HTMLButtonElement} knop het uitleg-icoon
 */
function wisselUitleg(knop) {
  const open = knop.getAttribute('aria-expanded') !== 'true';
  knop.setAttribute('aria-expanded', String(open));
  document.getElementById(knop.getAttribute('aria-controls')).hidden = !open;
}

/** Bouwt de inhoud van het Help-paneel (eenmalig): statussen, knoppen, conceptbestand, publicatiestatus en handleiding. */
function bouwHelp() {
  const sluit = maak('button', { type: 'button', class: 'knop', 'aria-keyshortcuts': 'Escape' }, icoon('sluiten', true), knoppen.sluiten);
  sluit.addEventListener('click', () => el.help.close());
  // Een klik op de donkere achtergrond naast het paneel sluit het ook.
  el.help.addEventListener('click', (event) => {
    if (event.target !== el.help) return;
    const r = el.help.getBoundingClientRect();
    const buiten = event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    if (buiten) el.help.close();
  });
  el.help.append(maak('div', { class: 'help__inhoud' },
    maak('div', { class: 'help__kop' }, maak('h2', { id: 'help-kop' }, help.kop), sluit),
    maak('p', { class: 'onderschrift' }, help.sneltoets),
    maak('section', { class: 'stapel', 'aria-labelledby': 'help-statussen' },
      maak('h3', { id: 'help-statussen' }, help.statussenKop),
      maak('dl', {}, ...Object.entries(statussen).map(([status, s]) => maak('div', {},
        maak('dt', {}, maak('span', { class: `label label--${status}` }, icoon(status, true), s.label)),
        maak('dd', {}, s.uitleg))))),
    maak('section', { class: 'stapel', 'aria-labelledby': 'help-knoppen' },
      maak('h3', { id: 'help-knoppen' }, help.knoppenKop),
      maak('ul', {}, ...help.knoppen.map((k) => maak('li', {}, maak('strong', {}, k.naam), `: ${k.uitleg}`)))),
    maak('section', { class: 'stapel', 'aria-labelledby': 'help-concept' },
      maak('h3', { id: 'help-concept' }, help.conceptKop),
      maak('p', {}, help.conceptTekst)),
    maak('section', { class: 'help__blok stapel', 'aria-labelledby': 'help-publicatie' },
      maak('h3', { id: 'help-publicatie' }, help.publicatieKop),
      maak('p', {}, help.publicatieTekst)),
    maak('a', { href: algemeen.handleidingUrl, target: '_blank', rel: 'noopener' }, help.handleiding)));
}

/** Opent het Help-paneel. Esc of Sluiten sluit het; de browser zet de focus daarna terug op de knop die het opende. */
function openHelp() {
  if (!el.help.open) el.help.showModal();
}

// Sneltoets ? opent de Help, behalve tijdens typen of tijdens de uitzending.
document.addEventListener('keydown', (event) => {
  if (event.key !== '?' || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest('input, textarea, [contenteditable]') || !el.uitzending.hidden) return;
  event.preventDefault();
  openHelp();
});

/** Bouwt de tellerbalk met de knop Start uitzending (eenmalig). */
function bouwTeller() {
  el.tellerAantal = maak('p', { class: 'tellerbalk__aantal' });
  el.tellerUitleg = maak('p', { class: 'tellerbalk__uitleg', id: 'teller-uitleg' });
  el.startknop = maak('button', { type: 'button', class: 'knop knop--primair knop--groot', 'aria-describedby': 'teller-uitleg' },
    icoon('start'), knoppen.startUitzending);
  el.startknop.addEventListener('click', startUitzending);
  el.teller.append(maak('div', { role: 'status' }, el.tellerAantal, el.tellerUitleg), el.startknop);
}

/** Werkt de teller en de startknop bij. Zonder goedgekeurd bericht is de startknop uit, met uitleg waarom. */
function toonTeller() {
  const goed = staat.berichten.filter((b) => b.status === 'goedgekeurd').length;
  const meerInfo = staat.berichten.filter((b) => b.status === 'meer-info-nodig').length;
  el.tellerAantal.textContent = teller.aantal(goed, staat.berichten.length);
  el.tellerUitleg.textContent = goed === 0 ? teller.nietsGoedgekeurd
    : meerInfo > 0 ? teller.metMeerInfo(meerInfo) : teller.alleenGoedgekeurd;
  el.startknop.disabled = goed === 0;
}

/** Bouwt de vaste delen van de uitzending: de geluidsknop, de sluitknop en de lopende balk met Pauzeren en Volgende (eenmalig). */
function bouwUitzending() {
  const sluit = maak('button', { type: 'button', class: 'knop uitzending__sluit', 'aria-keyshortcuts': 'Escape' },
    icoon('sluiten', true), knoppen.uitzendingSluiten);
  sluit.addEventListener('click', sluitUitzending);
  const bediening = maak('div', { class: 'uitzending__bediening' }, sluit);
  // Zonder Web Audio API en zonder spraak is er geen geluid, en dan ook geen knop die niets doet.
  if (kanMuziek() || 'speechSynthesis' in window) {
    el.geluidknop = maak('button', { type: 'button', class: 'knop uitzending__sluit', 'aria-keyshortcuts': 'M' });
    el.geluidknop.addEventListener('click', wisselGeluid);
    toonGeluidknop();
    bediening.prepend(el.geluidknop);
  }
  el.uitzending.prepend(bediening);

  el.balkLoop = maak('div', { class: 'balk__loop', 'aria-hidden': 'true' });
  el.pauzeknop = maak('button', { type: 'button', class: 'knop balk__volgende balk__pauze', 'aria-keyshortcuts': 'P' });
  el.pauzeknop.addEventListener('click', wisselPauze);
  el.volgendeknop = maak('button', { type: 'button', class: 'knop balk__volgende', 'aria-keyshortcuts': 'ArrowRight' },
    knoppen.volgende, icoon('volgende'));
  el.volgendeknop.addEventListener('click', volgende);
  el.balk.append(
    maak('div', { class: 'balk__tag', 'aria-hidden': 'true' }, uitzending.balkTag),
    maak('div', { class: 'balk__venster' }, el.balkLoop),
    el.pauzeknop,
    el.volgendeknop);

  document.addEventListener('keydown', (event) => {
    if (el.uitzending.hidden) return;
    const zonderModifier = !event.altKey && !event.ctrlKey && !event.metaKey;
    const toets = event.key.toLowerCase();
    if (event.key === 'Escape') { event.preventDefault(); sluitUitzending(); }
    else if (toets === 'm' && el.geluidknop && zonderModifier) { event.preventDefault(); wisselGeluid(); }
    else if (toets === 'p' && zonderModifier) { event.preventDefault(); wisselPauze(); }
    else if (event.key === 'ArrowRight' && zonderModifier
      && uz.stap < uz.berichten.length) { event.preventDefault(); volgende(); }
  });

  // Wie tijdens de film een bronlink opent of van tabblad wisselt, mist niets: de film pauzeert.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !el.uitzending.hidden && regie.speelt) wisselPauze();
  });

  // Vegen naar links op een touchscreen is Volgende.
  let begin = null;
  el.uitzending.addEventListener('pointerdown', (event) => {
    begin = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : null;
  });
  el.uitzending.addEventListener('pointerup', (event) => {
    if (!begin) return;
    const dx = event.clientX - begin.x;
    const dy = event.clientY - begin.y;
    begin = null;
    if (dx <= -VEEG_MIN && Math.abs(dx) > Math.abs(dy) && uz.stap < uz.berichten.length) volgende();
  });

  // Esc in volledig scherm verlaat eerst de fullscreen (de app krijgt die toets niet); sluit dan ook de uitzending.
  // Maar niet als de fullscreen wegviel doordat iemand een bronlink in een nieuw tabblad opende: dan blijft hij open.
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement || el.uitzending.hidden) return;
    setTimeout(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) sluitUitzending();
    }, 150);
  });
}

/** Start de uitzending met de goedgekeurde berichten, op volledig scherm als dat kan. */
function startUitzending() {
  uz.berichten = selecteerUitzending(staat.berichten);
  if (uz.berichten.length === 0) return;
  uz.stap = LEADER;
  uz.teller = 3;
  const koppen = uz.berichten.map((b) => b.kop).join(uitzending.balkScheiding) + uitzending.balkScheiding;
  // Twee keer dezelfde tekst, zodat de lopende balk naadloos doorloopt.
  el.balkLoop.replaceChildren(maak('span', {}, koppen), maak('span', {}, koppen));
  el.redactie.inert = true;
  el.uitzending.hidden = false;
  el.uitzending.requestFullscreen?.().catch(() => {});
  // Elke uitzending begint spelend.
  regie.speelt = true;
  toonPauzeknop();
  // Start uitzending is een klik, dus hier mag de browser geluid afspelen.
  startMuziek();
  toonUitzending();
}

/** Zet muziek en omroeper uit of aan en meldt dat; de keuze geldt ook voor de volgende uitzending. */
function wisselGeluid() {
  const aan = !muziekStaatAan();
  zetMuziek(aan);
  toonGeluidknop();
  el.melding.textContent = aan ? meldingen.geluidAan : meldingen.geluidUit;
  // Het huidige scherm begint opnieuw: met stem als het geluid aan gaat, op leestijd als het uit gaat.
  if (regie.speelt) speelScene();
}

/** Zet tekst en icoon van de geluidsknop: Geluid uit als het aan staat, Geluid aan als het uit staat. */
function toonGeluidknop() {
  const aan = muziekStaatAan();
  el.geluidknop.replaceChildren(icoon(aan ? 'geluidAan' : 'geluidUit', true), aan ? knoppen.geluidUit : knoppen.geluidAan);
}

/** Zet de film stil of laat hem verder lopen; verder lopen begint het huidige scherm opnieuw. */
function wisselPauze() {
  regie.speelt = !regie.speelt;
  toonPauzeknop();
  el.melding.textContent = regie.speelt ? meldingen.afspelen : meldingen.gepauzeerd;
  if (regie.speelt) speelScene();
  else stopRegie();
}

/** Zet tekst en icoon van de pauzeknop. */
function toonPauzeknop() {
  el.pauzeknop.replaceChildren(icoon(regie.speelt ? 'pauzeren' : 'start'),
    maak('span', { class: 'balk__knoptekst' }, regie.speelt ? knoppen.pauzeren : knoppen.afspelen));
}

/** Stopt de omroeper en de timer naar het volgende scherm, en zet de muziek weer op volle sterkte. */
function stopRegie() {
  regie.beurt += 1;
  clearTimeout(regie.klok);
  regie.klok = null;
  stopVoorlezen();
  zetOmroeper(false);
}

/**
 * Meldt of de omroeper praat: de muziek gaat dan zachter, en `data-omroeper` op de uitzending laat het zien.
 * @param {boolean} praat
 */
function zetOmroeper(praat) {
  dempMuziek(praat);
  el.uitzending.dataset.omroeper = praat ? 'praat' : 'stil';
}

/**
 * Wacht een tijd binnen de huidige beurt van de regie; stopRegie breekt het wachten af.
 * @param {number} ms
 * @returns {Promise<void>} lost alleen op als de beurt intussen niet voorbij is
 */
function wachtInBeurt(ms) {
  return new Promise((klaar) => { regie.klok = setTimeout(klaar, ms); });
}

/**
 * Wat de omroeper bij het huidige scherm voorleest.
 * @returns {string[]}
 */
function voorleestekst() {
  const n = uz.berichten.length;
  if (uz.stap === TITELKAART) return voorlezen.titel(datumLang.format(new Date(staat.concept.periode.van)), n);
  if (uz.stap >= n) return voorlezen.einde;
  const b = uz.berichten[uz.stap];
  return [b.kop, b.uitleg];
}

/**
 * Speelt het huidige scherm af als een scène uit de film: de omroeper leest voor (of, zonder stem of geluid,
 * wacht de film de leestijd af), daarna een korte stilte en dan het volgende scherm. Na het eindscherm stopt de muziek.
 */
async function speelScene() {
  stopRegie();
  if (!regie.speelt || uz.stap === LEADER || el.uitzending.hidden) return;
  const beurt = regie.beurt;
  const zinnen = voorleestekst();
  const eind = uz.stap >= uz.berichten.length;

  if (muziekStaatAan() && kanVoorlezen()) {
    const klaar = await spreek(zinnen, { bijStart: () => zetOmroeper(true) });
    if (!klaar || beurt !== regie.beurt) return;
    zetOmroeper(false);
  } else {
    await wachtInBeurt(leesTijd(zinnen.join(' ')));
    if (beurt !== regie.beurt) return;
  }

  // Na het slotwoord is de film af; het eindscherm blijft staan om te kopiëren.
  if (eind) { stopMuziek(); return; }
  await wachtInBeurt(PAUZE_NA_SCENE);
  if (beurt === regie.beurt) volgende();
}

/** Sluit de uitzending en zet de focus terug op Start uitzending. */
function sluitUitzending() {
  if (el.uitzending.hidden) return;
  stopLeader();
  stopRegie();
  stopMuziek();
  // Een melding uit de uitzending hoort niet meer in de redactie.
  el.melding.textContent = '';
  el.uitzending.hidden = true;
  el.redactie.inert = false;
  // Het verlaten van volledig scherm verplaatst de focus; zet hem daarna pas terug op Start uitzending.
  const focusOpStart = () => el.startknop.focus();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {}).finally(focusOpStart);
  else focusOpStart();
}

/** Gaat naar het volgende scherm van de uitzending; vanaf de leader is dat de titelkaart (aftellen overslaan). */
function volgende() {
  if (uz.stap >= uz.berichten.length) return;
  stopLeader();
  uz.stap += 1;
  toonUitzending();
}

/** Stopt de klok van de aftelleader. */
function stopLeader() {
  clearInterval(uz.klok);
  uz.klok = null;
}

/** Start het aftellen 3-2-1; na de 1 volgt vanzelf de titelkaart. Ook bij reduced motion telt hij, alleen zonder puls. */
function startLeader() {
  stopLeader();
  uz.klok = setInterval(() => {
    if (uz.teller > 1) {
      uz.teller -= 1;
      const cijfer = el.frame.querySelector('.leader__cijfer');
      cijfer.textContent = String(uz.teller);
      cijfer.setAttribute('aria-label', uitzending.aftellenLabel(uz.teller));
    } else {
      volgende();
    }
  }, LEADER_TIK);
}

/**
 * Maakt de aftelleader: een sepia cirkel met kruisdraden, het cijfer en de knop Aftellen overslaan.
 * @returns {HTMLElement}
 */
function maakLeader() {
  const wijzer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wijzer.setAttribute('class', 'leader__wijzer');
  wijzer.setAttribute('viewBox', '0 0 400 400');
  wijzer.setAttribute('aria-hidden', 'true');
  wijzer.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2"><circle cx="200" cy="200" r="190"/>'
    + '<circle cx="200" cy="200" r="150" stroke-width="1"/><path d="M200 0v400M0 200h400" stroke-width="1"/></g>'
    + '<path d="M200 200L200 10A190 190 0 0 1 390 200z" fill="currentColor" fill-opacity="0.18"/>';
  const overslaan = maak('button', { type: 'button', class: 'knop leader__overslaan' }, knoppen.aftellenOverslaan);
  overslaan.addEventListener('click', volgende);
  return maak('div', { class: 'leader' }, wijzer,
    maak('div', { class: 'leader__cijfer', role: 'timer', 'aria-live': 'off', 'aria-label': uitzending.aftellenLabel(uz.teller) }, String(uz.teller)),
    overslaan);
}

/**
 * Maakt de titelkaart van de rubriek, met de datum van de release en het aantal berichten.
 * @returns {HTMLElement}
 */
function maakTitelkaart() {
  const datum = datumLang.format(new Date(staat.concept.periode.van));
  return maak('div', { class: 'titelkaart' },
    maak('div', { class: 'titelkaart__inhoud' },
      maak('p', { class: 'ornament' }, algemeen.merk),
      maak('h1', {}, uitzending.rubriek),
      maak('p', {}, uitzending.titelSub(datum, uz.berichten.length))));
}

/**
 * Maakt het nieuwsframe van één bericht: onderschrift, kop, uitleg en bron met publicatiestatus.
 * @param {import('./logic.js').Bericht} b
 * @param {number} i volgnummer vanaf 1
 * @param {number} n aantal berichten
 * @returns {HTMLElement}
 */
function maakNieuwsframe(b, i, n) {
  return maak('article', { class: 'nieuwsframe', 'data-testid': 'nieuwsframe', 'aria-labelledby': 'nieuwsframe-kop' },
    maak('p', { class: 'nieuwsframe__rubriek' }, uitzending.berichtVan(i, n)),
    maak('h1', { class: 'nieuwsframe__kop', id: 'nieuwsframe-kop' }, b.kop),
    maak('p', { class: 'nieuwsframe__uitleg' }, b.uitleg),
    maak('p', { class: 'nieuwsframe__bron' },
      maak('span', {}, `${uitzending.bron} `, maak('a', { href: b.bronUrl, target: '_blank', rel: 'noopener' }, uitzending.bronLink(b.prNummer, b.origineleTitel))),
      maak('span', {}, algemeen.publicatiestatus)));
}

/**
 * Maakt het eindscherm met het totaaloverzicht en de knoppen Kopieer overzicht en Terug naar de redactie.
 * @returns {HTMLElement}
 */
function maakEindscherm() {
  const status = maak('p', { class: 'onderschrift', role: 'status' });
  const kopieer = maak('button', { type: 'button', class: 'knop knop--primair knop--groot' }, icoon('kopieer'), knoppen.kopieerOverzicht);
  const terug = maak('button', { type: 'button', class: 'knop knop--groot' }, knoppen.terugNaarRedactie);
  const lijst = maak('ol', {}, ...uz.berichten.map((b) =>
    maak('li', {}, maak('strong', {}, b.kop), maak('br'), b.uitleg, maak('br'), maak('a', { href: b.bronUrl, target: '_blank', rel: 'noopener' }, b.bronUrl))));
  const overzicht = maak('section', { class: 'overzicht', 'data-testid': 'totaaloverzicht', 'aria-labelledby': 'overzicht-kop' },
    maak('h2', { id: 'overzicht-kop' }, uitzending.overzichtKop), lijst, maak('p', { class: 'onderschrift' }, algemeen.publicatiestatus));
  // De feedback staat in het eindscherm zelf: #melding valt in volledig scherm buiten beeld.
  kopieer.addEventListener('click', async () => {
    const gelukt = await kopieerTekst(maakTotaaloverzicht(uz.berichten));
    kopieer.focus();
    // Eerst leegmaken, zodat een schermlezer dezelfde tekst bij een tweede klik opnieuw voorleest.
    status.textContent = '';
    await new Promise((klaar) => setTimeout(klaar, 50));
    if (gelukt) {
      kopieer.replaceChildren(icoon('kopieer'), knoppen.gekopieerd);
      status.textContent = meldingen.gekopieerd;
    } else {
      // Zonder klembord: selecteer het overzicht, zodat de gebruiker het zelf kan kopiëren.
      window.getSelection().selectAllChildren(overzicht);
      status.textContent = meldingen.kopierenMislukt;
    }
  });
  terug.addEventListener('click', sluitUitzending);
  return maak('div', { class: 'eindscherm' },
    maak('h1', {}, uitzending.einde), overzicht, maak('div', { class: 'knoppenrij' }, kopieer, terug), status);
}

/**
 * Zet tekst op het klembord. Zonder HTTPS werkt de Clipboard API niet; dan via de oudere kopieermethode.
 * @param {string} tekst
 * @returns {Promise<boolean>} true als het kopiëren lukte
 */
async function kopieerTekst(tekst) {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      await navigator.clipboard.writeText(tekst);
      return true;
    }
  } catch {
    // Valt terug op de oudere methode hieronder.
  }
  const veld = maak('textarea', { readonly: true, 'aria-hidden': 'true', class: 'visueel-verborgen' });
  veld.value = tekst;
  document.body.append(veld);
  veld.select();
  let gelukt;
  try { gelukt = document.execCommand('copy'); } catch { gelukt = false; }
  veld.remove();
  return gelukt;
}

/** Toont het huidige scherm van de uitzending en zet de focus op de belangrijkste knop. */
function toonUitzending() {
  const n = uz.berichten.length;
  const eind = uz.stap >= n;
  const leader = uz.stap === LEADER;
  let scherm;
  if (leader) scherm = maakLeader();
  else if (uz.stap === TITELKAART) scherm = maakTitelkaart();
  else if (eind) scherm = maakEindscherm();
  else scherm = maakNieuwsframe(uz.berichten[uz.stap], uz.stap + 1, n);
  el.frame.replaceChildren(scherm);
  // De lopende balk met Volgende staat op de titelkaart en de nieuwsframes, niet op de leader en het eindscherm.
  el.balk.hidden = leader || eind;
  if (leader) startLeader();
  (leader ? el.frame.querySelector('.leader__overslaan') : eind ? el.frame.querySelector('.knop--primair') : el.volgendeknop).focus();
  // De focus ligt op een knop; meld via #melding welk scherm er nu in beeld is, zodat een schermlezer het hoort.
  if (!leader) {
    // Eerst leegmaken, zodat ook een gelijke kop op het volgende scherm opnieuw wordt voorgelezen.
    el.melding.textContent = '';
    const kop = el.frame.querySelector('h1').textContent;
    setTimeout(() => meld(kop), 50);
    speelScene();
  }
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
  staat.bewerkt = null;
  staat.gewijzigd = false;
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
bouwHelp();
bouwTeller();
bouwUitzending();
toonRedactie();
