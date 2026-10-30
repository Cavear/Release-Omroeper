# Release-omroeper

Zet gemergde GitHub-pull requests om in een kort, licht komisch journaal in de stijl van een bioscoopjournaal uit de jaren vijftig: *Het Release-Bioscoopjournaal*.

## Wat doet de app en voor wie?

Na een release wil je het team en de stakeholders vertellen wat er veranderd is. PR-titels als *Refactor checkout helpers* zeggen daar weinig over. De Release-omroeper maakt van elke gemergde PR een nieuwsbericht. Dat bericht heeft een grappige kop en een zakelijke uitleg, en linkt naar de PR.

- **Voor de redactie** (degene die de release presenteert): nakijken, aanpassen, goedkeuren of uitsluiten.
- **Voor het publiek** (team, product owner, stakeholders): een korte uitzending op groot scherm, met aan het eind een overzicht om te kopiëren.

De grap zit altijd in de kop, nooit over personen. Een bericht is pas klaar als een mens het heeft nagelopen tegen de bron.

## Snel starten

Je hebt Node.js 22.12 of nieuwer nodig.

```bash
npm install
npm run lint        # codecontrole
npm run test:unit   # unit-tests (Vitest)
npm run test:ui     # UI-tests (Playwright), volgen in fase 3
```

De app is een statische pagina zonder build-stap. Open `public/index.html` via een lokale webserver, bijvoorbeeld XAMPP: `http://localhost/Release_omroeper/public/`.

## Een journaal maken in 4 stappen

1. **Concept maken.** Vraag Claude Code om `/journaal` voor een repository en een periode. Claude leest de gemergde PR's alleen (read-only) en schrijft `journaal-concept.json`.
2. **Importeren.** Open de app en kies *Concept importeren*. Klopt het bestand niet, dan zie je per bericht en per veld wat er mis is, en wordt er niets geladen.
3. **Nakijken.** Loop elk bericht na tegen de PR (*Bron openen*). Pas zo nodig de kop of de uitleg aan en kies *Goedkeuren* of *Uitsluiten*.
4. **Uitzenden.** Kies *Start uitzending*. Alleen goedgekeurde berichten komen in beeld. Aan het eind kopieer je het totaaloverzicht.

## Documentatie

- [Gebruikershandleiding](docs/gebruikershandleiding.md): de app stap voor stap gebruiken
- [Architectuur](docs/architectuur.md): van GitHub via het conceptbestand naar de webapp
- [Contract](docs/contract.md): het formaat van `journaal-concept.json` en de validatieregels
- [Testen](docs/testen.md): welke tests er zijn en hoe je ze draait
- [Aanpassingen op het plan](docs/plan-aanpassingen.md): waar we afwijken van het totaalplan en waarom
- [CLAUDE.md](CLAUDE.md): stijlgids en bouwinstructies

## Werkafspraken

- Lokaal ontwikkelen, testen en accepteren op test, daarna naar productie.
- Testen tijdens het bouwen, met bewijs per geplande teststap.
- Elk nieuwsbericht verwijst naar de oorspronkelijke pull request.
- Gemergd betekent niet automatisch gepubliceerd.
- Geen wachtwoorden of tokens in Git.
