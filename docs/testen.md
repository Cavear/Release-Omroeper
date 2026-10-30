# Testen

> Korte opzet; wordt aangevuld zodra de tests er zijn.

## Tests draaien

```bash
npm run lint        # ESLint
npm run test:unit   # unit-tests met Vitest (tests/unit/)
npm run test:ui     # UI-tests met Playwright (tests/ui/), op mobiel, tablet en desktop
npm run test:smoke  # smoketest tegen BASE_URL (standaard de testomgeving)
```

## Unit-tests (Vitest)

De logica in `public/logic.js` heeft geen DOM, zodat je hem zonder browser kunt testen.

- `valideerConcept`: elke regel uit `contract.md`, met de foutmelding per veld
- `selecteerUitzending`: alleen goedgekeurde berichten, in de juiste volgorde
- `bewerkBericht` en `wijzigStatus`: een aanpassing blijft bewaard en de status gaat goed over
- `maakTotaaloverzicht`: kopieerbare tekst met alle goedgekeurde berichten en hun links
- `exporteerJournaal`: het bewerkte journaal als bestand

Bestanden: `tests/unit/valideerConcept.test.js`, `testdata.test.js`, `redactie.test.js`, `export.test.js`, `teksten.test.js` (113 tests).

## UI-tests (Playwright)

Elke test draait drie keer, via de projecten in `playwright.config.js`: **mobiel** (390×844, touch), **tablet** (768×1024, touch) en **desktop** (1440×900). `scripts/serve.js` serveert `public/` op `http://localhost:4173/`; XAMPP is niet nodig. Bij een fout bewaart Playwright een screenshot en een trace; het HTML-rapport staat in `playwright-report/` (in de CI als artifact *playwright-rapport*).

| Bestand | Wat het test |
|---|---|
| `import.spec.js` | Geldig concept → 5 kaarten; `fout-6-berichten` en `fout-geen-json` → foutmelding en niets geladen; een fout bestand laat bestaand werk staan |
| `uitzending.spec.js` | Kop aanpassen, goedkeuren, uitsluiten → alleen het goedgekeurde bericht met de nieuwe kop in de uitzending; bronlink, Volgende (knop en pijltje rechts), totaaloverzicht, Kopieer overzicht, Esc, aftelleader, Start uit zonder goedkeuring |
| `responsive.spec.js` | Per scherm (lege staat, redactie, bewerkstand, Help, foutmelding, leader, titelkaart, nieuwsframes, eindscherm): geen horizontaal scrollen, knoppen ≥ 44×44, **axe** zonder serious/critical; kolommen 1/2/3; langste kop en kop van 90 tekens binnen beeld (ook liggend 844×390); vegen op mobiel; animaties uit bij reduced motion |
| `uitleg.spec.js` | Lege staat met 3 stappen; Help met knop en `?`, Escape sluit; uitleg bij elke status met toetsenbord en tik; elke knop en elk veld heeft een naam (ook in Help en uitzending); foutmelding noemt bericht, veld en oplossing; handleidinglink |

Controles dat de tests echt iets vangen: zonder tablet-breakpoint faalt de kolomtest op tablet; zonder uitleg bij *concept* falen twee uitleg-tests.

`npm run test:smoke` draait `tests/smoke/` alleen op desktop, tegen `BASE_URL` (standaard de testomgeving).

## Testdata

In `testdata/`. `voorbeeld.json` bevat 3 geldige berichten en is met de hand gemaakt.

`npm run testdata` (script `scripts/genereer-testdata.js`) maakt de andere 9 bestanden. Elk fout bestand breekt precies één regel van het contract:

| Bestand | Wat erin zit |
|---|---|
| `geldig-5-berichten.json` | 5 geldige berichten (het maximum) |
| `geldig-met-meer-info.json` | 3 geldige berichten, waarvan één `meer-info-nodig` en één `goedgekeurd` |
| `fout-ontbrekend-veld.json` | bericht 2 heeft geen `kop` |
| `fout-verkeerde-url.json` | bericht 3 linkt naar een ander PR-nummer |
| `fout-6-berichten.json` | 6 berichten |
| `fout-dubbel-prnummer.json` | bericht 3 heeft hetzelfde PR-nummer als bericht 1 |
| `fout-buiten-periode.json` | bericht 2 is gemergd na het einde van de periode |
| `fout-geen-json.txt` | gewone tekst, geen JSON |
| `leeg.json` | een leeg bestand |

Verandert het contract, pas dan de generator aan en draai `npm run testdata` opnieuw. Een unit-test controleert dat de bestanden in `testdata/` gelijk zijn aan wat de generator maakt.

## Testbewijs

In `testbewijs/`: per stap screenshots en rapporten, onder andere `stap-3.4` (redactie tegen het ontwerp), `stap-3.5` (uitzending), `stap-3.7` (Lighthouse) en `stap-5.3` (de hele flow op de test-URL, per stap en viewport). Screenshots van de kwaliteitscheck (`/kwaliteitscheck`) staan in `testbewijs/kwaliteitscheck/`.

## Smoketest na een upload

Bij een push naar `test` zet de CI de app op STRATO (map `App1-test`) en draait daarna vanzelf de smoketest. Los draaien kan ook:

- **Lokaal:** `npm run test:smoke` (standaard `http://app1-test.caitlinveenendaal.nl/`), of met een andere URL: `BASE_URL=<url> npm run test:smoke`.
- **In GitHub:** Actions → *ci-cd* → *Run workflow*, eventueel met een andere URL.
