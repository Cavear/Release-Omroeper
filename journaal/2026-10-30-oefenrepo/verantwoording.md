# Journaal oefenrepo – 30 oktober 2026

Repository: `Cavear/vibe_webshop` · periode: **30-10-2026 13:00 – 14:00** (Europe/Amsterdam) · concept: [`journaal-concept.json`](journaal-concept.json)

## 4.1 – Testdata in de oefenrepo

Gemaakt met de MCP-server `github-oefenrepo`, alleen op `Cavear/vibe_webshop`. Elke PR heeft doelbranch `omroeper-oefen` (aangemaakt vanaf `main`); `main` is niet aangeraakt.

| PR | Scenario | Wijziging | Status | Merge-tijdstip (NL) |
|---|---|---|---|---|
| [#6](https://github.com/Cavear/vibe_webshop/pull/6) | Oude wijziging | Footer-tekst | gemergd | 30-10 12:54:45 |
| [#7](https://github.com/Cavear/vibe_webshop/pull/7) | Duidelijke feature | Zoekveld op de productpagina | gemergd | 30-10 13:00:38 |
| [#8](https://github.com/Cavear/vibe_webshop/pull/8) | Duidelijke bugfix | Mandje klopt weer na de terugknop | gemergd | 30-10 13:00:41 |
| [#9](https://github.com/Cavear/vibe_webshop/pull/9) | Dependency-update | `@playwright/test` vastgezet op 1.64.1 | gemergd | 30-10 13:00:45 |
| [#10](https://github.com/Cavear/vibe_webshop/pull/10) | Vage PR | Beschrijving alleen "fix bug" | gemergd | 30-10 13:00:49 |
| [#11](https://github.com/Cavear/vibe_webshop/pull/11) | Lege beschrijving | Knoppen minimaal 44 px | gemergd | 30-10 13:00:53 |
| [#12](https://github.com/Cavear/vibe_webshop/pull/12) | Werk in uitvoering | Knop Verlanglijstje (draft) | open | – |
| [#13](https://github.com/Cavear/vibe_webshop/pull/13) | Afgewezen idee | Blauwe huisstijl | gesloten, niet gemergd | – |

Het merge-tijdstip van de oude wijziging (#6, 12:54:45) is het vroegst mogelijke begin van de periode; de periode begint om 13:00.

## 4.2 en 4.4 – Alle PR's en of ze zijn opgenomen

| PR | Titel | Status | Gemergd (NL) | Opgenomen | Reden |
|---|---|---|---|---|---|
| #1 | README met instructies voor starten via XAMPP en localhost | gemergd | 27-10 20:16 | nee | Oud: gemergd vóór de periode |
| #2 | Extra Playwright-tests voor mandje en bestellen | gemergd | 28-10 16:13 | nee | Oud: gemergd vóór de periode |
| #3 | Playwright-tests draaien in GitHub Actions | gemergd | 28-10 17:26 | nee | Oud: gemergd vóór de periode |
| #4 | Drie omgevingen: DEV, TEST en PROD op XAMPP | open | – | nee | Open: nog niet gemergd |
| #5 | Playwright CLI-skill en Claude Code-plugins voor het project | open | – | nee | Open: nog niet gemergd |
| #6 | Footer-tekst aangepast | gemergd | 30-10 12:54 | nee | Oud: gemergd vóór de periode |
| #7 | Zoekveld op de productpagina | gemergd | 30-10 13:00 | **ja** | Binnen de periode; duidelijke beschrijving |
| #8 | Fix: winkelmandje toont na de terugknop weer de juiste inhoud | gemergd | 30-10 13:00 | **ja** | Binnen de periode; duidelijke beschrijving |
| #9 | Dependency-update: @playwright/test vastgezet op 1.64.1 | gemergd | 30-10 13:00 | **ja** | Binnen de periode; technisch, voor bezoekers geen verschil |
| #10 | fix bug | gemergd | 30-10 13:00 | **ja**, meer-info-nodig | Binnen de periode; beschrijving te vaag om uit te leggen |
| #11 | Update button styles | gemergd | 30-10 13:00 | **ja**, meer-info-nodig | Binnen de periode; geen beschrijving |
| #12 | WIP: knop Verlanglijstje | open (draft) | – | nee | Open: werk in uitvoering |
| #13 | Huisstijl: blauw als hoofdkleur | gesloten | – | nee | Gesloten zonder merge: afgewezen |

Opgenomen: precies de 5 verwachte PR's (#7 t/m #11). Open (#4, #5, #12), gesloten (#13) en oude PR's (#1–#3, #6) zijn met reden uitgesloten.

## 4.3 – Zelfcontrole van het concept

- Elke opgenomen PR staat er precies één keer in (#7–#11); er staat geen ander nummer in.
- Elke `bronUrl` is `https://github.com/Cavear/vibe_webshop/pull/<nummer>` van het eigen bericht.
- Elke uitleg komt uit de titel en beschrijving van de PR; bij #10 en #11 is niets verzonnen en staat de status op `meer-info-nodig`.
- Koppen zijn hoogstens 60 tekens, licht komisch, en gaan nergens over personen.
- `valideerConcept` keurt het bestand goed; in de app laadt het met 5 kaarten en zonder foutmelding (zie `redactie.jpg`).
- Publicatiestatus overal "niet gecontroleerd".

## Afwijkingen

- **Bugfix-scenario (#8):** de skill noemt "winkelmandje onthoudt de inhoud na verversen". Dat deed de webshop al (localStorage). Gebouwd is daarom de verwante, echte fout: na de terugknop kon het mandje een oude inhoud tonen.
- **Periode nog niet voorbij bij het ophalen:** het concept is gemaakt om 13:02, de periode loopt tot 14:00. Om 13:05 is opnieuw gecontroleerd: na #13 is er niets meer gemergd of aangemaakt, dus de selectie klopt.
- **Dependency-update (#9):** het plan noemt "versie van een bibliotheek opgehoogd". `@playwright/test` stond al op de nieuwste versie (1.64.1) en het oefentoken mag de workflow (MariaDB-image) niet wijzigen (geen `workflow`-scope). Daarom is de versie vastgezet in plaats van verhoogd; een verzonnen versienummer is bewust vermeden. Voor het journaal is het effect hetzelfde: een technische wijziging zonder verschil voor bezoekers. De branchnaam `oefen/mariadb-11-8` is een overblijfsel van de eerste poging.
- **Ophalen (4.2 en 4.3):** de read-only MCP-server `github` heeft geen toegang tot de privérepo `vibe_webshop` (404; de autorisatie geldt alleen voor `Release-Omroeper`). Het lezen is daarom gedaan met de GitHub CLI (`gh api`, alleen GET-verzoeken). De schrijvende server `github-oefenrepo` is voor het journaal niet gebruikt. Oplossing: geef de `github`-server leestoegang tot `vibe_webshop` (zie het open punt over de dubbele github-server).
