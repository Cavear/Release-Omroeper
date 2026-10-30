# Architectuur

## De flow

```
GitHub (gemergde PR's)
   │  GitHub MCP-server "github", alleen lezen
   ▼
Claude Code, skill /journaal  ── schrijft per PR een kop, uitleg, voor wie en status
   │
   ▼
journaal-concept.json          ← het contract, zie contract.md
   │  Concept importeren (in de browser, valideerConcept)
   ▼
Webapp public/: redactie  ──  Goedkeuren / Uitsluiten / Bewerken
   │                     └──  Journaal exporteren → journaal-nagekeken.json (zelfde contract)
   ▼
Uitzending: leader → titelkaart → één scherm per goedgekeurd bericht → eindscherm (Kopieer overzicht)
```

1. **GitHub MCP (read-only).** Claude Code haalt met de skill `/journaal` de gemergde PR's van een repository binnen een periode op. De server `github` draait in de alleen-lezenmodus. De tweede server, `github-oefenrepo`, mag alleen schrijven in de oefenrepo `Cavear/vibe_webshop` (testdata, fase 4) en wordt nooit voor het journaal gebruikt.
2. **Conceptbestand.** Claude schrijft per PR een licht komische kop en een zakelijke uitleg in `journaal-concept.json`. Vage PR's krijgen de status *meer-info-nodig*. Dat bestand is de enige overdracht tussen de MCP-route en de app.
3. **Webapp.** Een statische pagina zonder framework en zonder build-stap. Je importeert het bestand in de browser, kijkt het na en zendt het uit. Het nagekeken journaal kun je exporteren en later opnieuw importeren.

Voorbeelden van de hele route staan in [`journaal/`](../journaal/): de oefenrepo en de eigen release, elk met een verantwoording per PR.

## Waarom de site geen token krijgt

- De app praat nooit zelf met GitHub. Alle gegevens komen uit het bestand dat je zelf importeert.
- Er staat dus geen token in de code, in de browser of op de server. Een token op een publieke site kan iedereen uitlezen.
- Het leestoken (`GITHUB_TOKEN_READ`) staat alleen als omgevingsvariabele op de laptop van wie het journaal maakt.
- Zo kan de site ook niets per ongeluk wijzigen in een repository.

## Onderdelen van de app

| Bestand | Rol |
|---|---|
| `public/index.html` | De pagina, met de secties redactie en uitzending en de effectlagen |
| `public/style.css` | Tokens en componenten uit het Design System, plus uitbreidingen onderaan |
| `public/teksten.js` | Alle zichtbare teksten, ook de uitleg en de foutmeldingen |
| `public/logic.js` | Pure functies zonder DOM: `valideerConcept`, `selecteerUitzending`, `bewerkBericht`, `wijzigStatus`, `maakTotaaloverzicht`, `exporteerJournaal` |
| `public/app.js` | DOM, events en weergave: import, kaarten, Help, uitzending |
| `public/handleiding.html` | De gebruikershandleiding als pagina (gaat mee naar de server) |

## Omgevingen

| Omgeving | Branch | Map op STRATO | URL |
|---|---|---|---|
| Lokaal | elke branch | – | `npm run serve` → http://localhost:4173/ (of XAMPP) |
| Test | `test` | `App1-test` | http://app1-test.caitlinveenendaal.nl/ |
| Productie | `main` | `App1-Prod` | http://app1.caitlinveenendaal.nl/ |

HTTPS staat niet aan op de subdomeinen; voor de demo is dat niet nodig. Zonder HTTPS valt *Kopieer overzicht* terug op een oudere kopieermethode.

## CI/CD-pijplijn (`.github/workflows/ci-cd.yml`)

```
pull request naar test/main ──► test (lint, unit-tests, UI-tests op 3 viewports, rapport als artifact)

push naar test ──► test ──► deploy-test (SFTP → App1-test) ──► smoke (op de test-URL)
push naar main ──► test ──► deploy-prod (SFTP → App1-Prod) ──► smoke (op de prod-URL)

Run workflow (handmatig) ──► smoke (op een zelfgekozen URL)
```

- Faalt `test`, dan wordt er niet gedeployd. Zie de demo-PR [#26](https://github.com/Cavear/Release-Omroeper/pull/26).
- De deploy gebruikt `wlixcc/SFTP-Deploy-Action@v1.2.6`, zet alleen `public/` neer en wist niets op de server.
- Secrets zijn repository secrets (`SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD`, `TEST_SFTP_PATH`, `PROD_SFTP_PATH`), omdat environment-secrets niet werken op het gratis plan voor een privérepo.
- Een merge naar `main` gaat zonder goedkeuringsstap live; de bewuste stap is de PR van `test` naar `main`. Zie [plan-aanpassingen.md](plan-aanpassingen.md).
