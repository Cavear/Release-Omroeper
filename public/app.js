/**
 * Startpunt van de webapp: DOM, events en weergave.
 * De logica komt uit logic.js, alle zichtbare teksten uit teksten.js.
 * Stap 3.1: concept importeren, controleren en als kaarten tonen; foutmelding, lege staat en laadstaat.
 * Stap 3.2: per kaart goedkeuren, uitsluiten en bewerken; het journaal exporteren.
 * Stap 3.3: teller met Start uitzending; de uitzending met nieuwsframes, Volgende, en het eindscherm.
 * @module app
 */
import {
  valideerConcept, wijzigStatus, bewerkBericht, exporteerJournaal, selecteerUitzending, maakTotaaloverzicht, PUBLICATIESTATUS,
} from './logic.js';
import {
  algemeen, knoppen, statussen, kaart, teller, leeg, meldingen, fouten, bevestigVervangen, uitzending,
} from './teksten.js';

/** Minimale horizontale veegafstand (px) voordat vegen naar links als Volgende telt. */
const VEEG_MIN = 50;

/** Tijdzone van de redactie; tijden in het concept worden hierin getoond. */
const TIJDZONE = 'Europe/Amsterdam';
const tijdOpmaak = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: TIJDZONE });
const datumOpmaak = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIJDZONE });

/**
 * De toestand van de redactie. `bewerkt` is het PR-nummer van de kaart in de bewerkstand, of null.
 * @type {{ concept: null | { repository: string, periode: { van: string, tot: string }, gegenereerdOp?: string }, berichten: import('./logic.js').Bericht[], bewerkt: number | null }}
 */
const staat = { concept: null, berichten: [], bewerkt: null };

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
};

/**
 * De lopende uitzending: de goedgekeurde berichten en welk scherm nu in beeld is.
 * `stap` 0 t/m n-1 is een nieuwsframe, n is het eindscherm.
 * @type {{ berichten: import('./logic.js').Bericht[], stap: number }}
 */
const uz = { berichten: [], stap: 0 };

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
  kopieer: '<rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/>',
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
  el.kopknoppen.append(maakImportknop(false), el.exportknop);

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
    maak('div', { class: 'kaart__boven' }, maak('span', { class: 'kaart__meta' }, meta), maakStatuslabel(b.status)),
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
  zetBewerkstand(null);
  meld(meldingen.opgeslagen(pr));
}

/** Biedt het nagekeken journaal aan als download (journaal-nagekeken.json). */
function exporteer() {
  const json = exporteerJournaal(staat.concept, staat.berichten);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = maak('a', { href: url, download: kaart.bestandsnaamExport, hidden: true });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  meld(meldingen.geexporteerd);
}

el.kaarten.addEventListener('click', (event) => {
  const knop = event.target.closest('button[data-actie]');
  if (!knop || knop.type === 'submit') return;
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

/** Bouwt de vaste delen van de uitzending: de sluitknop en de lopende balk met Volgende (eenmalig). */
function bouwUitzending() {
  const sluit = maak('button', { type: 'button', class: 'knop uitzending__sluit', 'aria-keyshortcuts': 'Escape' },
    icoon('sluiten', true), knoppen.uitzendingSluiten);
  sluit.addEventListener('click', sluitUitzending);
  el.uitzending.prepend(sluit);

  el.balkLoop = maak('div', { class: 'balk__loop', 'aria-hidden': 'true' });
  el.volgendeknop = maak('button', { type: 'button', class: 'knop balk__volgende', 'aria-keyshortcuts': 'ArrowRight' },
    knoppen.volgende, icoon('volgende'));
  el.volgendeknop.addEventListener('click', volgende);
  el.balk.append(
    maak('div', { class: 'balk__tag', 'aria-hidden': 'true' }, uitzending.balkTag),
    maak('div', { class: 'balk__venster' }, el.balkLoop),
    el.volgendeknop);

  document.addEventListener('keydown', (event) => {
    if (el.uitzending.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); sluitUitzending(); }
    else if (event.key === 'ArrowRight' && !event.altKey && !event.ctrlKey && !event.metaKey
      && uz.stap < uz.berichten.length) { event.preventDefault(); volgende(); }
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
  uz.stap = 0;
  const koppen = uz.berichten.map((b) => b.kop).join(uitzending.balkScheiding) + uitzending.balkScheiding;
  // Twee keer dezelfde tekst, zodat de lopende balk (stap 3.5) naadloos doorloopt.
  el.balkLoop.replaceChildren(maak('span', {}, koppen), maak('span', {}, koppen));
  el.redactie.inert = true;
  el.uitzending.hidden = false;
  el.uitzending.requestFullscreen?.().catch(() => {});
  toonUitzending();
}

/** Sluit de uitzending en zet de focus terug op Start uitzending. */
function sluitUitzending() {
  if (el.uitzending.hidden) return;
  el.uitzending.hidden = true;
  el.redactie.inert = false;
  // Het verlaten van volledig scherm verplaatst de focus; zet hem daarna pas terug op Start uitzending.
  const focusOpStart = () => el.startknop.focus();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {}).finally(focusOpStart);
  else focusOpStart();
}

/** Gaat naar het volgende scherm van de uitzending. */
function volgende() {
  if (uz.stap >= uz.berichten.length) return;
  uz.stap += 1;
  toonUitzending();
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
  el.frame.replaceChildren(eind ? maakEindscherm() : maakNieuwsframe(uz.berichten[uz.stap], uz.stap + 1, n));
  el.balk.hidden = eind;
  (eind ? el.frame.querySelector('.knop--primair') : el.volgendeknop).focus();
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
bouwTeller();
bouwUitzending();
toonRedactie();
