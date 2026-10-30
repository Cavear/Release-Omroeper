/**
 * Alle zichtbare teksten van de Release-omroeper op één plek.
 * Pas teksten hier aan, niet in app.js. Functies maken teksten met waarden erin.
 * @module teksten
 */

/** Naam en vaste koppen. */
export const algemeen = {
  merk: 'HET RELEASE-BIOSCOOPJOURNAAL',
  redactieKop: 'De redactietafel',
  publicatiestatus: 'Publicatiestatus: niet gecontroleerd',
  publicatieUitleg: 'Claude schreef deze koppen en uitleg; loop elk bericht na tegen de bron voordat je het goedkeurt.',
  onbekendeTijd: '–',
  handleidingLink: 'Lees de gebruikershandleiding',
  handleidingUrl: 'docs/gebruikershandleiding.md',
  /**
   * Metaregel onder de paginakop.
   * @param {{repository: string, datum: string, van: string, tot: string, gegenereerd: string}} m
   * @returns {string}
   */
  metaregel: (m) => `${m.repository} · gemergd op ${m.datum} tussen ${m.van} en ${m.tot} · concept van ${m.gegenereerd}`
};

/** Tekst op knoppen. Dit zijn ook de toegankelijke namen waarop de UI-tests zoeken. */
export const knoppen = {
  importeren: 'Concept importeren',
  bezigMetInlezen: 'Bezig met inlezen…',
  exporteren: 'Journaal exporteren',
  help: 'Help',
  sluiten: 'Sluiten',
  goedkeuren: 'Goedkeuren',
  terugNaarConcept: 'Terug naar concept',
  uitsluiten: 'Uitsluiten',
  weerOpnemen: 'Weer opnemen',
  bewerken: 'Bewerken',
  opslaan: 'Opslaan',
  annuleren: 'Annuleren',
  bronOpenen: 'Bron openen',
  startUitzending: 'Start uitzending',
  volgende: 'Volgende',
  aftellenOverslaan: 'Aftellen overslaan',
  uitzendingSluiten: 'Uitzending sluiten',
  kopieerOverzicht: 'Kopieer overzicht',
  gekopieerd: 'Gekopieerd',
  terugNaarRedactie: 'Terug naar de redactie',
  /** @param {string} statusLabel @returns {string} */
  uitlegOverStatus: (statusLabel) => `Uitleg over de status ${statusLabel}`
};

/** Statuslabels en hun uitleg (statuslabel, uitleg-icoon en Help-paneel). */
export const statussen = {
  'concept': { label: 'concept', uitleg: 'Nog niet nagekeken. Komt niet in de uitzending.' },
  'meer-info-nodig': { label: 'meer informatie nodig', uitleg: 'De PR is te vaag om uit te leggen. Vraag de maker om uitleg, pas het bericht aan en keur het daarna goed.' },
  'goedgekeurd': { label: 'goedgekeurd', uitleg: 'Nagekeken en klaar. Alleen deze berichten komen in de uitzending.' },
  'uitgesloten': { label: 'uitgesloten', uitleg: 'Bewust weggelaten. Met Weer opnemen zet je het terug op concept.' }
};

/** Teksten op een nieuwskaart. */
export const kaart = {
  /** @param {number} nr @param {string} tijd @returns {string} */
  meta: (nr, tijd) => `PR #${nr} · gemergd ${tijd}`,
  /** @param {number} nr @returns {string} */
  metaZonderTijd: (nr) => `PR #${nr}`,
  origineel: 'Origineel:',
  voor: 'Voor:',
  voorOnbekend: 'nog onbekend',
  kopLabel: 'Kop',
  uitlegLabel: 'Uitleg',
  leegVeld: 'Kop en uitleg mogen niet leeg zijn.',
  eerstOpnemen: 'Dit bericht is uitgesloten. Kies eerst Weer opnemen om het goed te keuren.',
  bestandsnaamExport: 'journaal-nagekeken.json',
  /** @param {number} nr @returns {string} */
  wijzigingWeggooien: (nr) => `Je wijziging in bericht #${nr} is nog niet opgeslagen. Wil je die weggooien?`,
  /** @param {number} nr @returns {string} */
  exportZonderWijziging: (nr) => `Je wijziging in bericht #${nr} is nog niet opgeslagen en komt niet in de export. Toch exporteren?`
};

/** Teller en startknop. */
export const teller = {
  /** @param {number} goed @param {number} totaal @returns {string} */
  aantal: (goed, totaal) => `${goed} van ${totaal} goedgekeurd`,
  alleenGoedgekeurd: 'Alleen goedgekeurde berichten worden uitgezonden',
  /** @param {number} n @returns {string} */
  metMeerInfo: (n) => `${n} ${n === 1 ? 'bericht heeft' : 'berichten hebben'} meer informatie nodig · alleen goedgekeurde berichten worden uitgezonden`,
  nietsGoedgekeurd: 'Keur minstens één bericht goed om de uitzending te starten'
};

/** Lege staat: uitleg in 3 stappen. */
export const leeg = {
  ornament: 'NOG GEEN NIEUWS',
  kop: 'Zo maak je een journaal',
  intro: 'Van gemergde pull requests naar een uitzending die iedereen begrijpt, in drie stappen.',
  stappen: [
    { titel: 'Laat Claude het concept maken', tekst: 'Claude haalt via GitHub de gemergde PR’s op en schrijft journaal-concept.json.' },
    { titel: 'Importeer het concept', tekst: 'De app controleert het bestand en zegt precies wat er mis is als het niet klopt.' },
    { titel: 'Redigeer en zend uit', tekst: 'Pas koppen aan, keur goed of sluit uit, en start de uitzending.' }
  ]
};

/** Korte meldingen na een actie (getoond in #melding). */
export const meldingen = {
  /** @param {number} n @returns {string} */
  ingeladen: (n) => `${n} ${n === 1 ? 'bericht' : 'berichten'} ingeladen`,
  /** @param {number} nr @returns {string} */
  goedgekeurd: (nr) => `Bericht #${nr} goedgekeurd`,
  /** @param {number} nr @returns {string} */
  terugNaarConcept: (nr) => `Bericht #${nr} staat weer op concept`,
  /** @param {number} nr @returns {string} */
  uitgesloten: (nr) => `Bericht #${nr} uitgesloten`,
  /** @param {number} nr @returns {string} */
  opgeslagen: (nr) => `Wijziging in bericht #${nr} opgeslagen`,
  geexporteerd: 'Journaal opgeslagen als journaal-nagekeken.json',
  gekopieerd: 'Het totaaloverzicht staat op je klembord.',
  kopierenMislukt: 'Kopiëren lukte niet. Selecteer de tekst en kopieer hem zelf.',
  importGeannuleerd: 'Import geannuleerd; je huidige werk is onveranderd.',
  exportGeannuleerd: 'Export geannuleerd; sla eerst je wijziging op.'
};

/** Bevestiging voordat een nieuwe import het huidige werk vervangt. */
export const bevestigVervangen = 'Een nieuw concept vervangt je huidige redactiewerk. Wil je doorgaan?';

/** Foutmeldingen bij de import. Elke melding zegt wat er mis is. */
export const fouten = {
  kop: 'Dit bestand is niet ingeladen',
  /** @param {string} bestand @param {number} n @returns {string} */
  intro: (bestand, n) => `We vonden ${n} ${n === 1 ? 'fout' : 'fouten'} in ${bestand}. Er is niets geladen; je huidige werk is onveranderd.`,
  oplossing: 'Pas het bestand aan en kies opnieuw Concept importeren.',
  geenJson: 'Het bestand is geen geldige JSON. Kies het bestand journaal-concept.json dat Claude heeft gemaakt.',
  leeg: 'Het bestand is leeg.',
  nietLeesbaar: 'Het bestand kon niet worden gelezen. Kies het bestand opnieuw.',
  /** @param {string} veld @returns {string} */
  ontbreekt: (veld) => `het verplichte veld ${veld} ontbreekt`,
  /** @param {number} n @returns {string} */
  teVeel: (n) => `Het bestand heeft ${n} berichten; het maximum is 5.`,
  /** @param {number} nr @returns {string} */
  dubbelNummer: (nr) => `PR-nummer ${nr} komt vaker voor; elk bericht moet een eigen PR-nummer hebben`,
  /** @param {string} repository @param {number} nr @returns {string} */
  verkeerdeUrl: (repository, nr) => `de link hoort te zijn https://github.com/${repository}/pull/${nr}`,
  /** @param {string} veld @returns {string} */
  verkeerdType: (veld) => `het veld ${veld} heeft niet het juiste formaat; zie de beschrijving van het bestand`,
  periodeOmgedraaid: 'het begin van de periode ligt na het einde',
  /** @param {string} waarde @returns {string} */
  onbekendeStatus: (waarde) => `de status "${waarde}" bestaat niet; kies concept, meer-info-nodig, goedgekeurd of uitgesloten`,
  buitenPeriode: 'de merge-datum valt buiten de periode van het journaal',
  /**
   * Eén regel in de foutenlijst.
   * @param {{bericht: number|null, veld: string, melding: string}} f
   * @returns {string}
   */
  regel: (f) => (f.bericht === null
    ? f.melding.charAt(0).toUpperCase() + f.melding.slice(1)
    : `Bericht ${f.bericht}, veld ${f.veld}: ${f.melding}`)
};

/** Help-paneel. */
export const help = {
  kop: 'Hoe werkt het?',
  statussenKop: 'DE VIER STATUSSEN',
  knoppenKop: 'DE KNOPPEN',
  knoppen: [
    { naam: 'Concept importeren', uitleg: 'laad journaal-concept.json. Een nieuw bestand vervangt je huidige werk pas na bevestiging.' },
    { naam: 'Goedkeuren / Uitsluiten', uitleg: 'bepaal wat er wordt uitgezonden.' },
    { naam: 'Bewerken', uitleg: 'pas kop en uitleg aan, met Opslaan of Annuleren.' },
    { naam: 'Bron openen', uitleg: 'bekijk de pull request op GitHub in een nieuw tabblad.' },
    { naam: 'Start uitzending', uitleg: 'volledig scherm, één bericht tegelijk. Volgende met de knop, pijltje rechts of vegen; Esc sluit af.' },
    { naam: 'Journaal exporteren', uitleg: 'sla het nagekeken journaal op als bestand.' }
  ],
  publicatieKop: 'Publicatiestatus: niet gecontroleerd',
  publicatieTekst: 'Claude schreef de koppen en uitleg op basis van de PR’s. Dat kan fout zijn. Daarom staat dit onder elk bericht, ook in de uitzending.',
  handleiding: 'Naar de gebruikershandleiding'
};

/** Uitzending. */
export const uitzending = {
  rubriek: 'UIT DE WERKPLAATS',
  /** @param {number} n @returns {string} */
  aftellenLabel: (n) => `Uitzending begint over ${n}`,
  /** @param {string} datum @param {number} n @returns {string} */
  titelSub: (datum, n) => `Release van ${datum} · ${n} ${n === 1 ? 'bericht' : 'berichten'}`,
  /** @param {number} i @param {number} n @returns {string} */
  berichtVan: (i, n) => `BERICHT ${i} VAN ${n} · UIT DE WERKPLAATS`,
  bron: 'Bron:',
  /** @param {number} nr @param {string} titel @returns {string} */
  bronLink: (nr, titel) => `PR #${nr} · ${titel}`,
  /** Scheiding tussen de koppen in de lopende balk. */
  balkScheiding: '   ★   ',
  balkTag: 'JOURNAAL',
  einde: 'Einde van het journaal',
  overzichtKop: 'TOTAALOVERZICHT · OM TE KOPIËREN'
};
