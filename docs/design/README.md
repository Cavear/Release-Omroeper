# Ontwerp: Release-omroeper

Het goedgekeurde ontwerp uit Claude Design. De code-agent bouwt dit na en verzint geen eigen stijl.

- **Design System:** https://claude.ai/artifact/J2gZ98HmvwLupjQ1DzdaQS (tokens, componenten, richtlijnen)
- **Schermen (canvas):** https://claude.ai/artifact/BrWnB9ZTfNkohmXEnghZ2K

## Frames

| Bestand | Frame in het canvas | Maat |
|---|---|---|
| `01-redactie-desktop-1440.png` | Redactietafel, desktop | 1440 breed |
| `02-redactie-tablet-768.png` | Redactietafel, tablet | 768 breed |
| `03-redactie-mobiel-390.png` | Redactietafel, mobiel | 390 × 844 |
| `04-lege-staat.png` | Lege staat met uitleg in 3 stappen | 1440 × 900 |
| `05-import-fout.png` | Foutmelding na een ongeldig importbestand | 1440 × 1000 |
| `06-help-paneel.png` | Help-paneel open | 1440 × 1000 |
| `07-uitzending-leader.png` | Uitzending: aftelleader | 1280 × 720 |
| `08-uitzending-titelkaart.png` | Uitzending: titelkaart | 1280 × 720 |
| `09-uitzending-nieuwsbericht.png` | Uitzending: nieuwsbericht | 1280 × 720 |
| `10-uitzending-eindscherm.png` | Uitzending: eindscherm met totaaloverzicht | 1280 × 720 |
| `11-nieuwsbericht-telefoon-staand.png` | Nieuwsbericht op een telefoon, staand | 390 × 844 |
| `12-nieuwsbericht-telefoon-liggend.png` | Nieuwsbericht op een telefoon, liggend | 844 × 390 |

De screenshots zijn gemaakt met *reduced motion*, dus zonder flikkering en zonder lopende balk. Filmkorrel, vignet en krassen staan er wel op.

## Bron

`bron/` bevat de originele frames uit het canvas:
- `Main.dc.html` is de redactie, met de staten `gevuld`, `leeg`, `fout` en het Help-paneel.
- `Uitzending.dc.html` is de uitzending, met de frames `leader`, `titel`, `nieuws` en `eind`.

Ze zijn interactief: klik op Goedkeuren, Help of Volgende. `bron/support.js` is een kleine vervanger van de runtime van Claude Design, zodat je ze lokaal kunt openen, bijvoorbeeld `bron/Main.dc.html?staat=leeg` of `bron/Uitzending.dc.html?frame=eind`. De frames zelf zijn ongewijzigd overgenomen.

Opnieuw screenshots maken: `node docs/design/bron/maak-screenshots.mjs`.

## Waar de code afwijkt van het ontwerp

Het ontwerp is een prototype met eigen voorbeelddata. Bij een verschil gaan `CLAUDE.md`, `docs/contract.md` en `public/teksten.js` voor.

| Onderwerp | In het ontwerp | In de app |
|---|---|---|
| Voorbeelddata | PR 42 t/m 46 met eigen koppen | `testdata/` (zelfde stijl, andere koppen) |
| Goedkeuren op een uitgesloten kaart | Mag, gaat direct naar goedgekeurd | Uitgeschakeld; eerst *Weer opnemen* (zie de statusovergangen in `docs/contract.md`) |
| Foutregel bij een verkeerde link | "de link eindigt op /pull/41, maar het PR-nummer is 42" | `teksten.fouten.verkeerdeUrl`: "de link hoort te zijn https://github.com/…/pull/42" |
| Gekopieerd totaaloverzicht | Kop, uitleg en link per bericht, zonder nummers | `maakTotaaloverzicht`: zelfde inhoud, genummerd (1., 2., …) zoals de `<ol>` op het scherm |
| Toegankelijke namen | "Help openen (sneltoets ?)", "Sluiten (Esc)", "Uitzending sluiten (Esc)" | De namen uit de tabel in `CLAUDE.md` (*Help*, *Sluiten*, *Uitzending sluiten*); de sneltoets staat in `aria-keyshortcuts` |
| Stijl in de code | Inline styles met hexwaarden | Klassen en tokens uit `public/style.css` (harde regels 1 en 2) |
