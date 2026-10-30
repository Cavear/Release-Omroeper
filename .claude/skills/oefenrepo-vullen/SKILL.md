---
name: oefenrepo-vullen
description: Vult de oefenrepo Cavear/vibe_webshop met de testscenario's (branches, kleine wijzigingen, PR's naar omroeper-oefen) voor de Release-omroeper. Alleen gebruiken als iemand expliciet de oefenrepo of testdata in GitHub wil vullen.
argument-hint: [oude-wijziging | overige]
disable-model-invocation: true
---

# Oefenrepo vullen

Gebruik **alleen de MCP-server `github-oefenrepo`**, en **alleen op `Cavear/vibe_webshop`**. Schrijf nooit naar een andere repository en nooit naar `main`.

Argument: `$ARGUMENTS`. Zonder argument doe je eerst `oude-wijziging` en daarna `overige`.

## Voorbereiding

1. Controleer of de branch `omroeper-oefen` bestaat. Bestaat die niet, maak hem dan aan vanaf `main`.
2. Toon het plan: de branches, wijzigingen, PR-titels en acties die je gaat uitvoeren. **Vraag bevestiging voordat je iets aanmaakt, merget of sluit.**

## Scenario's

Gebruik per scenario een eigen branch (bijvoorbeeld `oefen/zoekveld`) en een kleine, herkenbare wijziging in de webshop. Elke PR heeft **doelbranch `omroeper-oefen`**, nooit `main`.

| Scenario | Wijziging in de webshop | Actie | Verwacht in journaal |
|---|---|---|---|
| Oude wijziging | Footer-tekst aangepast | **Als eerste** mergen en het tijdstip noteren | Niet opgenomen (voor de periode) |
| Duidelijke feature | Zoekveld op de productpagina, met beschrijving | Mergen | Opgenomen |
| Duidelijke bugfix | Winkelmandje onthoudt de inhoud na verversen | Mergen | Opgenomen |
| Dependency-update | Versie van een bibliotheek opgehoogd | Mergen | Opgenomen |
| Vage PR | Kleine wijziging, beschrijving alleen "fix bug" | Mergen | Opgenomen, "Meer informatie nodig" |
| Lege beschrijving | Kleine CSS-wijziging aan de knoppen, geen beschrijving | Mergen | Opgenomen, "Meer informatie nodig" |
| Werk in uitvoering | Knop "Verlanglijstje" | Open laten | Niet opgenomen |
| Afgewezen idee | Andere huisstijlkleur | Sluiten zonder merge | Niet opgenomen |

Een merge-datum kun je niet terugzetten. Merge de oude wijziging daarom als eerste, en wacht even voordat je de rest maakt, zodat de periode daarna kan beginnen.

## Rapport

Geef aan het eind een overzicht met per PR:

- PR-nummer
- scenario
- status (gemergd, open of gesloten)
- merge-tijdstip met datum en tijd

Noem daarnaast het merge-tijdstip van de oude wijziging apart. Dat is het vroegst mogelijke begin van de periode.
