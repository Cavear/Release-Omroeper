/**
 * Maakt de testdata in testdata/ volgens docs/contract.md.
 * Elk fout bestand breekt precies één regel van het contract; de rest is geldig.
 * Gebruik: npm run testdata
 * @module genereer-testdata
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPOSITORY = 'Cavear/vibe_webshop';
const PERIODE = { van: '2026-10-30T09:15:00+01:00', tot: '2026-10-30T13:00:00+01:00' };

/** Fictieve gemergde PR's uit de webshop. De grap zit in de kop, nooit over personen. */
const PR_S = [
  {
    prNummer: 42,
    origineleTitel: 'Fix address persistence after refresh',
    gemergdOp: '2026-10-30T09:40:00+01:00',
    kop: 'Opslaanknop onthoudt eindelijk zijn werk',
    uitleg: 'Na het wijzigen van een adres blijven de gegevens bewaard na verversen.',
    voorWie: 'Gebruikers die adressen wijzigen',
  },
  {
    prNummer: 43,
    origineleTitel: 'Show stock count on product page',
    gemergdOp: '2026-10-30T10:05:00+01:00',
    kop: 'Voorraad komt uit de schaduw',
    uitleg: 'De productpagina toont nu hoeveel stuks er nog op voorraad zijn.',
    voorWie: 'Klanten die een product willen bestellen',
  },
  {
    prNummer: 44,
    origineleTitel: 'Refactor checkout helpers',
    gemergdOp: '2026-10-30T11:20:00+01:00',
    kop: 'Achter de kassa wordt flink opgeruimd',
    uitleg: 'De code van het afrekenen is herschikt. De PR beschrijft niet of klanten hier iets van merken.',
  },
  {
    prNummer: 45,
    origineleTitel: 'Add search filter for price range',
    gemergdOp: '2026-10-30T11:45:00+01:00',
    kop: 'Zoeken op prijs: de portemonnee mag meebeslissen',
    uitleg: 'In de zoekresultaten kun je nu filteren op een minimum- en maximumprijs.',
    voorWie: 'Klanten die producten zoeken',
  },
  {
    prNummer: 46,
    origineleTitel: 'Fix rounding of VAT in cart total',
    gemergdOp: '2026-10-30T12:30:00+01:00',
    kop: 'Winkelmand rekent weer tot op de cent',
    uitleg: 'Het totaalbedrag in de winkelmand rondt de btw nu goed af.',
    voorWie: 'Klanten die afrekenen',
  },
  {
    prNummer: 47,
    origineleTitel: 'Lazy-load product images',
    gemergdOp: '2026-10-30T12:50:00+01:00',
    kop: 'Plaatjes wachten netjes op hun beurt',
    uitleg: 'Productfoto’s worden pas geladen als ze in beeld komen.',
    voorWie: 'Bezoekers van de productoverzichten',
  },
];

/**
 * Vult de lijst aan met eenvoudige PR's (#48 en verder), voor een concept met meer berichten dan het maximum.
 * Ze zijn om de 5 minuten gemergd vanaf 09:20, binnen de periode.
 * @param {number} n het totale aantal PR's
 * @returns {typeof PR_S}
 */
function prs(n) {
  const extra = Array.from({ length: Math.max(0, n - PR_S.length) }, (_, i) => {
    const minuten = 20 + i * 5;
    const tijd = `${String(9 + Math.floor(minuten / 60)).padStart(2, '0')}:${String(minuten % 60).padStart(2, '0')}`;
    return {
      prNummer: 48 + i,
      origineleTitel: `Small fix ${i + 1}`,
      gemergdOp: `2026-10-30T${tijd}:00+01:00`,
      kop: `Kleine reparatie nummer ${i + 1}`,
      uitleg: 'Een kleine verbetering in de webshop.',
    };
  });
  return [...PR_S, ...extra].slice(0, n);
}

/**
 * Maakt een geldig bericht van een PR uit de lijst.
 * @param {(typeof PR_S)[number]} pr de fictieve PR waar het bericht over gaat
 * @param {string} [status] de status van het bericht, standaard concept
 * @returns {Record<string, unknown>}
 */
function bericht(pr, status = 'concept') {
  return {
    prNummer: pr.prNummer,
    bronUrl: `https://github.com/${REPOSITORY}/pull/${pr.prNummer}`,
    origineleTitel: pr.origineleTitel,
    gemergdOp: pr.gemergdOp,
    kop: pr.kop,
    uitleg: pr.uitleg,
    ...(pr.voorWie ? { voorWie: pr.voorWie } : {}),
    status,
    publicatiestatus: 'niet gecontroleerd',
  };
}

/**
 * Maakt een geldig concept met de eerste n PR's.
 * @param {number} n het aantal berichten
 * @returns {{ repository: string, periode: typeof PERIODE, gegenereerdOp: string, berichten: Record<string, any>[] }}
 */
function concept(n) {
  return {
    repository: REPOSITORY,
    periode: { ...PERIODE },
    gegenereerdOp: '2026-10-30T12:15:00Z',
    berichten: prs(n).map((pr) => bericht(pr)),
  };
}

/**
 * Zet een concept om naar de tekst van een JSON-bestand.
 * @param {unknown} waarde het concept of een andere waarde om als JSON op te slaan
 * @returns {string} ingesprongen JSON met een regeleinde aan het eind
 */
function alsJson(waarde) {
  return `${JSON.stringify(waarde, null, 2)}\n`;
}

/**
 * Maakt alle testbestanden.
 * @returns {Record<string, string>} bestandsnaam → inhoud
 */
export function maakTestdata() {
  const metMeerInfo = concept(3);
  metMeerInfo.berichten[0].status = 'goedgekeurd';
  metMeerInfo.berichten[2].status = 'meer-info-nodig';

  const ontbrekendVeld = concept(3);
  delete ontbrekendVeld.berichten[1].kop;

  const verkeerdeUrl = concept(3);
  verkeerdeUrl.berichten[2].bronUrl = 'https://github.com/Cavear/vibe_webshop/pull/404';

  const dubbelNummer = concept(3);
  dubbelNummer.berichten[2] = { ...dubbelNummer.berichten[0] };

  const buitenPeriode = concept(3);
  buitenPeriode.berichten[1].gemergdOp = '2026-10-30T14:10:00+01:00';

  return {
    'geldig-5-berichten.json': alsJson(concept(5)),
    'geldig-met-meer-info.json': alsJson(metMeerInfo),
    'fout-ontbrekend-veld.json': alsJson(ontbrekendVeld),
    'fout-verkeerde-url.json': alsJson(verkeerdeUrl),
    'fout-21-berichten.json': alsJson(concept(21)),
    'fout-dubbel-prnummer.json': alsJson(dubbelNummer),
    'fout-buiten-periode.json': alsJson(buitenPeriode),
    'fout-geen-json.txt': 'Dit is geen JSON, maar een kladbriefje van de redactie.\n',
    'leeg.json': '',
  };
}

/**
 * Schrijft alle testbestanden naar testdata/.
 * @returns {string[]} de namen van de geschreven bestanden
 */
export function schrijfTestdata() {
  const map = new URL('../testdata/', import.meta.url);
  const bestanden = maakTestdata();
  for (const [naam, inhoud] of Object.entries(bestanden)) {
    writeFileSync(new URL(naam, map), inhoud, 'utf8');
  }
  return Object.keys(bestanden);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const namen = schrijfTestdata();
  console.log(`${namen.length} bestanden gemaakt in testdata/:\n- ${namen.join('\n- ')}`);
}
