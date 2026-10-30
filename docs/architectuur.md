# Architectuur

## De flow

```
GitHub (gemergde PR's)
   ├── publieke REST API ── GitHub ophalen (max. 20 PR's, de meest recente; titel en beschrijving)
   │                         └── concept of meer-info-nodig tot de redactie het controleert
   └── GitHub MCP-server "github", alleen lezen
         ▼
      Claude Code, skill /journaal ── schrijft kop, uitleg, voor wie en status
         ▼
      journaal-concept.json        ← het contract, zie contract.md
         │ Concept importeren (in de browser, valideerConcept)
         ▼
Webapp public/: redactie  ──  Goedkeuren / Uitsluiten / Bewerken
   │                     └──  Journaal exporteren → journaal-nagekeken.json (zelfde contract)
   ▼
Uitzending: leader → titelkaart → één scherm per goedgekeurd bericht → eindscherm (Kopieer overzicht)
```

1. **Direct ophalen.** De redactietafel kan via de publieke GitHub REST API gemergde PR's binnen een gekozen periode ophalen. Dit werkt zonder token voor openbare repositories, maximaal twintig berichten per journaal; zijn er meer gemergde PR's, dan de twintig meest recente. Titel, beschrijving en merge-moment komen uit de zoekresultaten, zodat één ophaalactie maar een paar verzoeken kost (zonder token staat GitHub 60 per uur toe). De app neemt de PR-titel en de eerste alinea van de beschrijving over en zet elk bericht op *concept*, of op *meer-info-nodig* zonder beschrijving; er worden geen samenvattingen of voordelen verzonnen.
2. **GitHub MCP (read-only).** Claude Code haalt met de skill `/journaal` gemergde PR's op en schrijft per PR een licht komische kop en zakelijke uitleg in `journaal-concept.json`. Vage PR's krijgen de status *meer-info-nodig*. De server `github` draait alleen-lezen. `github-oefenrepo` is uitsluitend voor testdata in `Cavear/vibe_webshop` en wordt nooit voor het journaal gebruikt.
3. **Conceptbestand.** De MCP-route levert het contractbestand op; in de app kun je dat bestand handmatig importeren. Beide routes komen uit op dezelfde validatie en redactiestroom.
4. **Webapp.** Een statische pagina zonder framework of build-stap. De redactie controleert en bewerkt berichten, keurt ze goed of sluit ze uit, en zendt daarna uit. Het nagekeken journaal kun je exporteren en later opnieuw importeren.

Voorbeelden van de hele route staan in [`journaal/`](../journaal/): de oefenrepo en de eigen release, elk met een verantwoording per PR.

## Waarom de site geen token krijgt

- De directe koppeling gebruikt alleen de publieke GitHub API en verstuurt geen token. Privé-repositories worden niet ondersteund in de browser.
- De MCP-route gebruikt het leestoken (`GITHUB_TOKEN_READ`) alleen als omgevingsvariabele op de laptop van wie het journaal maakt; privédata blijft via die route en een handmatig conceptbestand lopen.
- Er staat geen token in de code, in de browser of op de server. Een token op een publieke site kan iedereen uitlezen.
- Zo kan de site ook niets per ongeluk wijzigen in een repository.

## Onderdelen van de app

| Bestand | Rol |
|---|---|
| `public/index.html` | De pagina, met de secties redactie en uitzending en de effectlagen |
| `public/style.css` | Tokens en componenten uit het Design System, plus uitbreidingen onderaan |
| `public/teksten.js` | Alle zichtbare teksten, ook de uitleg en de foutmeldingen |
| `public/github.js` | Alleen-lezen ophalen en omzetten van PR-metadata uit openbare GitHub-repositories |
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

push naar test ──► test ──► deploy (SFTP → App1-test) ──► smoke (op de test-URL)
push naar main ──► test ──► deploy (SFTP → App1-Prod) ──► smoke (op de prod-URL)

Run workflow (handmatig) ──► smoke (op een zelfgekozen URL)
```

- Faalt `test`, dan wordt er niet gedeployd. Zie de demo-PR [#26](https://github.com/Cavear/Release-Omroeper/pull/26).
- De deploy gebruikt `wlixcc/SFTP-Deploy-Action@v1.2.6`, zet alleen `public/` neer en wist niets op de server.
- Secrets zijn repository secrets (`SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD`, `TEST_SFTP_PATH`, `PROD_SFTP_PATH`), omdat environment-secrets niet werken op het gratis plan voor een privérepo.
- Een merge naar `main` gaat zonder goedkeuringsstap live; de bewuste stap is de PR van `test` naar `main`. Zie [plan-aanpassingen.md](plan-aanpassingen.md).
