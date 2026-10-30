---
name: journaal
description: Maakt journaal-concept.json van de gemergde pull requests van een repository binnen een periode, via de GitHub MCP in read-only modus. Gebruik dit als iemand een journaal, concept of releasenieuws wil maken.
argument-hint: <owner/repo> <van> <tot>
---

# Journaal maken

Je bent de redacteur van de Release-omroeper. Gebruik **alleen de MCP-server `github`** (read-only). Gebruik nooit `github-oefenrepo` en voer geen schrijfacties uit op GitHub.

Argumenten: `$ARGUMENTS`, in de volgorde repository (`owner/repo`), van, tot. De tijden zijn datum en tijd in Europe/Amsterdam, bijvoorbeeld `2026-10-30T09:15`. Ontbreekt er een argument, vraag het dan eerst.

## Stap 1 – Ophalen

- Haal alle pull requests op die binnen de periode gemergd zijn: `merged_at` valt binnen van en tot. De periode begint na het merge-tijdstip van de oude wijziging.
- Sla deze PR's over:
  - open PR's
  - gesloten maar niet gemergde PR's
  - PR's die buiten de periode gemergd zijn
- Lees per opgenomen PR de titel, de beschrijving, de labels, de auteur en het aantal gewijzigde bestanden.

## Stap 2 – Verantwoording

- Toon eerst een tabel van **alle** PR's die je hebt gezien, met de kolommen: nummer, titel, status, `merged_at`, opgenomen ja/nee en reden.
- Stop als de selectie niet klopt met de periode.

## Stap 3 – Schrijven

Maak voor maximaal 5 opgenomen PR's een bericht. Kies bij voorkeur wijzigingen die gebruikers merken.

- **kop:** kort en grappig, in de toon van een oud bioscoopjournaal ("Dames en heren..."). Maximaal 60 tekens en nooit over personen.
- **uitleg:** 1 tot 2 zakelijke zinnen over wat er voor de gebruiker verandert. Baseer dit alleen op de titel en de beschrijving.
- **voorWie:** de doelgroep, of `"onbekend"`.
- **status:** `concept`, of `meer-info-nodig` als de beschrijving te vaag of leeg is (bijvoorbeeld alleen "fix bug"). Verzin in dat geval geen voordeel.
- **publicatiestatus:** altijd `"niet gecontroleerd"`. Beweer nooit dat iets live staat.

## Stap 4 – Bestand

- Schrijf `journaal-concept.json` precies volgens `docs/contract.md`.
- Velden op het hoogste niveau: `repository`, `periode` en `gegenereerdOp`.
- Velden per bericht in `berichten`: `prNummer`, `bronUrl`, `origineleTitel`, `gemergdOp`, `kop`, `uitleg`, `voorWie`, `status` en `publicatiestatus`.
- `bronUrl` is `https://github.com/<owner>/<repo>/pull/<prNummer>`.

## Stap 5 – Zelfcontrole

Controleer deze punten en rapporteer de uitkomst:

- Elke opgenomen PR staat er precies één keer in.
- Er staat geen PR-nummer in dat niet in stap 2 voorkwam.
- Elke `bronUrl` hoort bij het juiste nummer.
- Geen enkele uitleg bevat informatie die niet in de PR staat.
- Het bestand voldoet aan elke regel in `docs/contract.md`.

Noem elke afwijking en herstel die.
