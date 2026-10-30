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
  publicatieUitleg: 'De kop en uitleg zijn nog niet gecontroleerd; loop elk bericht na tegen de bron voordat je het goedkeurt.',
  onbekendeTijd: '–',
  handleidingLink: 'Lees de gebruikershandleiding',
  handleidingUrl: 'handleiding.html',
  /**
   * Metaregel onder de paginakop.
   * @param {{repository: string, datum: string, van: string, tot: string, gegenereerd: string}} m
   * @returns {string}
   */
  metaregel: (m) => `${m.repository} · gemergd op ${m.datum} tussen ${m.van} en ${m.tot} · concept van ${m.gegenereerd}`,
  /**
   * Metaregel bij een periode over meer dagen.
   * @param {{repository: string, datum: string, totDatum: string, van: string, tot: string, gegenereerd: string}} m
   * @returns {string}
   */
  metaregelPeriode: (m) => `${m.repository} · gemergd tussen ${m.datum} ${m.van} en ${m.totDatum} ${m.tot} · concept van ${m.gegenereerd}`
};

/** Tekst op knoppen. Dit zijn ook de toegankelijke namen waarop de UI-tests zoeken. */
export const knoppen = {
  githubOphalen: 'GitHub ophalen',
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
  geluidUit: 'Geluid uit',
  geluidAan: 'Geluid aan',
  pauzeren: 'Pauzeren',
  afspelen: 'Afspelen',
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
    { titel: 'Laat Claude het concept maken', tekst: 'Claude haalt via GitHub de gemergde PR’s op en schrijft journaal-concept.json. Of haal ze zelf op met GitHub ophalen.' },
    { titel: 'Importeer het concept', tekst: 'De app controleert het bestand en zegt precies wat er mis is als het niet klopt.' },
    { titel: 'Redigeer en zend uit', tekst: 'Pas koppen aan, keur goed of sluit uit, en start de uitzending.' }
  ]
};

/** GitHub ophalen: gebruikt alleen publieke API-gegevens en vraagt nooit om een token. */
export const github = {
  kop: 'Gemergde PR’s ophalen',
  intro: 'Haal maximaal twintig gemergde pull requests op uit een publieke repository. Zijn het er meer, dan krijg je de twintig meest recente. Elke PR krijgt een journaalkop op basis van de titel en de beschrijving als uitleg, als ongekeurd concept; controleer en redigeer ze voordat je goedkeurt.',
  repositoryLabel: 'Repository (owner/repo)',
  repositoryVoorbeeld: 'Cavear/vibe_webshop',
  /** Staat ingevuld zolang er nog geen andere repository is gebruikt. */
  standaardRepository: 'Cavear/vibe_webshop',
  vanLabel: 'Gemergd vanaf',
  totLabel: 'Gemergd tot en met',
  ophalen: 'Pull requests ophalen',
  bezig: 'Bezig met ophalen…',
  annuleren: 'Annuleren',
  ontbrekendeBeschrijving: 'De pull request heeft geen beschrijving. Open de bron en vul een zakelijke uitleg in.',
  zieBron: '(Ingekort; zie de bron.)',
  bron: 'de opgehaalde pull requests',
  /**
   * Journaalkoppen voor opgehaalde PR's: een vaste opener per soort wijziging, gevolgd door het
   * onderwerp uit de PR-titel. De grap zit alleen in de opener, nooit over personen, en belooft
   * geen voordeel dat niet in de titel staat. Per soort meerdere openers, zodat niet elke kop gelijk begint.
   */
  koppen: {
    /**
     * Volgorde telt: de eerste soort waarvan een trefwoord in de titel staat, wint. Een bekend
     * voorvoegsel (zoals 'docs:' of 'fix:') gaat altijd voor. Trefwoorden zijn bewust streng,
     * zodat bijvoorbeeld 'bug report template' of 'PIN-betaling' geen verkeerde opener krijgt.
     */
    soorten: [
      // Een revert draait iets terug: geen primeur en geen herstel.
      { soort: 'revert', woorden: /^\s*revert\b|\bterugdraai\w*|\bteruggedraaid\b/i,
        openers: ['Terug naar de vorige stand', 'Op de terugweg'] },
      { soort: 'herstel', woorden: /\b(fix|fixes|fixed|bugfix|hotfix|herstel\w*|repar\w*|opgelost|verholpen|verhelp\w*|corrig\w*)\b/i,
        openers: ['Euvel verholpen', 'De monteur was er al', 'Weer in het gareel'] },
      { soort: 'nieuw', woorden: /\b(feat|feature|nieuw\w*|toevoeg\w*|toegevoegd|add|adds|added|introduce\w*)\b/i,
        openers: ['Primeur in de werkplaats', 'Gloednieuw', 'Kersvers van de band'] },
      // Vóór tests: 'Dependency-update: @playwright/test' is onderhoud, geen test.
      { soort: 'onderhoud', woorden: /\b(deps|dependenc\w*|dependabot|bump\w*|upgrade\w*|vastgezet)\b/i,
        openers: ['In de machinekamer', 'Bouten aangedraaid'] },
      { soort: 'test', woorden: /\b(test|tests|testen|e2e|playwright|vitest)\b/i,
        openers: ['Nieuws uit de proefkamer', 'Op de proefbank'] },
      { soort: 'docs', woorden: /\b(docs?|readme|handleiding|documentatie)\b/i,
        openers: ['Uit de leeszaal', 'Voor de leesgrage'] },
      { soort: 'stijl', woorden: /\b(style|styles|styling|css|opmaak|lettertype)\b/i,
        openers: ['Een nieuw pakje', 'Opnieuw in de verf'] },
      { soort: 'ci', woorden: /\b(ci|workflow|pipeline|github actions)\b/i,
        openers: ['Op de lopende band', 'De fabriekshal draait door'] },
      { soort: 'opruim', woorden: /\b(refactor\w*|opruim\w*|opgeruimd|cleanup|clean-up)\b/i,
        openers: ['De bezem erdoor', 'Opgeruimd staat netjes'] },
    ],
    /** Als geen soort past. */
    algemeen: ['Dames en heren', 'Uit de werkplaats', 'Bericht van het front'],
    /** @param {string} opener @param {string} onderwerp @returns {string} */
    kop: (opener, onderwerp) => `${opener}: ${onderwerp}`,
    /** Voor een titel die niets zegt (bijvoorbeeld alleen 'fix bug'): geen verzonnen onderwerp. */
    vaag: [
      'Er werd gesleuteld in de werkplaats, maar waaraan?',
      'Geheimzinnig gesleutel in de werkplaats',
      'Iets veranderd, maar wat? De redactie zoekt het uit',
    ],
  },
  foutkaart: {
    kop: 'De pull requests zijn niet ingeladen',
    oplossing: 'Controleer de repository en de periode en kies opnieuw GitHub ophalen.'
  },
  /** @param {number} n @returns {string} */
  opgehaald: (n) => `${n} ${n === 1 ? 'bericht opgehaald' : 'berichten opgehaald'} uit GitHub`,
  /** @param {number} n @param {number} totaal @returns {string} */
  nieuwsteVan: (n, totaal) => `De ${n} meest recente van ${totaal} gemergde PR’s opgehaald uit GitHub`,
  fouten: {
    repository: 'Vul de repository in als eigenaar/naam.',
    periode: 'Kies een geldige periode; de begindatum mag niet na de einddatum liggen.',
    netwerk: 'GitHub is niet bereikbaar. Controleer je verbinding en probeer opnieuw.',
    'privé': 'Repository niet gevonden of niet openbaar. De browserkoppeling kan alleen publieke repositories ophalen.',
    limiet: 'GitHub heeft te veel verzoeken ontvangen. Wacht even en probeer opnieuw.',
    onvolledig: 'GitHub heeft geen volledige zoekresultaten teruggegeven. Probeer opnieuw of verklein de periode.',
    api: 'GitHub gaf geen bruikbaar antwoord. Controleer repository en periode en probeer opnieuw.'
  }
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
  exportGeannuleerd: 'Export geannuleerd; sla eerst je wijziging op.',
  geluidUit: 'Het geluid staat uit; de film loopt door zonder muziek en stem.',
  geluidAan: 'Het geluid staat aan.',
  gepauzeerd: 'Het journaal staat stil. Kies Afspelen om verder te gaan.',
  afspelen: 'Het journaal speelt verder.'
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
  teVeel: (n) => `Het bestand heeft ${n} berichten; het maximum is 20.`,
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
    { naam: 'GitHub ophalen', uitleg: 'haal maximaal twintig gemergde PR’s op uit een publieke repository; zijn het er meer, dan de twintig meest recente. Kop en uitleg blijven ongekeurd tot je ze controleert.' },
    { naam: 'Concept importeren', uitleg: 'laad journaal-concept.json. Een nieuw bestand vervangt je huidige werk pas na bevestiging.' },
    { naam: 'Help', uitleg: 'opent deze uitleg (sneltoets ?).' },
    { naam: 'Goedkeuren / Terug naar concept', uitleg: 'zet een bericht in of uit de uitzending.' },
    { naam: 'Uitsluiten / Weer opnemen', uitleg: 'laat een bericht bewust weg, of zet het terug op concept. Een uitgesloten bericht keur je pas goed na Weer opnemen.' },
    { naam: 'Bewerken', uitleg: 'pas kop en uitleg aan, met Opslaan of Annuleren.' },
    { naam: 'Bron openen', uitleg: 'bekijk de pull request op GitHub in een nieuw tabblad.' },
    { naam: 'Start uitzending', uitleg: 'speelt het journaal op volledig scherm af als een filmpje, met muziek en een omroeper die elk bericht voorleest. Esc sluit af.' },
    { naam: 'Pauzeren / Afspelen', uitleg: 'zet de film in de uitzending stil of laat hem verder lopen (sneltoets P).' },
    { naam: 'Volgende', uitleg: 'springt in de uitzending meteen naar het volgende bericht (ook pijltje rechts of vegen).' },
    { naam: 'Journaal exporteren', uitleg: 'sla het nagekeken journaal op als bestand.' },
    { naam: 'Aftellen overslaan', uitleg: 'gaat in de uitzending meteen van de aftelleader naar de titelkaart.' },
    { naam: 'Uitzending sluiten', uitleg: 'brengt je terug naar de redactie (ook met Esc).' },
    { naam: 'Geluid uit / Geluid aan', uitleg: 'zet muziek en omroeper in de uitzending uit of weer aan (sneltoets M).' },
    { naam: 'Kopieer overzicht', uitleg: 'zet op het eindscherm alle koppen, uitleg en links op je klembord.' },
    { naam: 'Terug naar de redactie', uitleg: 'sluit het eindscherm en brengt je terug naar de kaarten.' }
  ],
  conceptKop: 'HET CONCEPTBESTAND',
  conceptTekst: 'Je kunt zelf een conceptbestand importeren of tot twintig gemergde PR’s (de meest recente) uit een publieke GitHub-repository ophalen. De directe koppeling maakt een journaalkop met een vaste opener bij de PR-titel, neemt de eerste alinea van de beschrijving over en maakt geen samenvatting; zonder beschrijving of met een vage titel krijgt een bericht meer informatie nodig. Controleer de bron voordat je een bericht goedkeurt.',
  publicatieKop: 'Publicatiestatus: niet gecontroleerd',
  publicatieTekst: 'De koppen en uitleg zijn nog niet gecontroleerd. Bij direct ophalen maakt de app een journaalkop van de titel en neemt de eerste alinea van de beschrijving over; die kunnen onvolledig zijn. Daarom blijft controle door de redactie nodig.',
  handleiding: 'Naar de gebruikershandleiding',
  sneltoets: 'Sneltoets: ? opent deze uitleg, Esc sluit hem.'
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

/**
 * Wat de omroeper voorleest. De eerste zin klinkt het plechtigst. Bij een nieuwsframe leest hij de kop en de uitleg.
 */
export const voorlezen = {
  /** @param {string} datum @param {number} n @returns {string[]} */
  titel: (datum, n) => [
    'Het Release-Bioscoopjournaal.',
    'Uit de werkplaats.',
    `De release van ${datum}, in ${n} ${n === 1 ? 'bericht' : 'berichten'}.`,
  ],
  einde: ['Dat was het Release-Bioscoopjournaal.', 'Tot de volgende release!']
};
