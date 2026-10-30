# Testen

> Korte opzet; wordt aangevuld zodra de tests er zijn.

## Tests draaien

```bash
npm run lint        # ESLint
npm run test:unit   # unit-tests met Vitest (tests/unit/)
npm run test:ui     # UI-tests met Playwright (tests/ui/, volgen in fase 3)
npm run test:smoke  # smoketest tegen BASE_URL (standaard de testomgeving)
```

## Unit-tests (Vitest)

De logica in `public/logic.js` heeft geen DOM, zodat je hem zonder browser kunt testen.

- `valideerConcept`: elke regel uit `contract.md`, met de foutmelding per veld
- `selecteerUitzending`: alleen goedgekeurde berichten, in de juiste volgorde
- `bewerkBericht` en `wijzigStatus`: een aanpassing blijft bewaard en de status gaat goed over
- `maakTotaaloverzicht`: kopieerbare tekst met alle goedgekeurde berichten en hun links
- `exporteerJournaal`: het bewerkte journaal als bestand

*Volgt.*

## UI-tests (Playwright)

Op mobiel (390×844), tablet (768×1024) en desktop (1440×900); de uitzending ook liggend op 844×390.

- Een geldig concept importeren
- Een ongeldig bestand importeren: de foutmelding verschijnt en er wordt niets geladen
- Een kop aanpassen, goedkeuren en de uitzending starten
- Uitgesloten berichten en concepten komen niet in de uitzending
- *Volgende*, de bronlink en het totaaloverzicht
- Responsive en toegankelijkheid: geen horizontaal scrollen, knoppen van minimaal 44 px, kolommen per breakpoint, vegen en axe

*Volgt.*

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

Screenshots en rapporten van de kwaliteitscheck (`/kwaliteitscheck`) staan in `testbewijs/`.

## Smoketest na een upload

De app gaat handmatig met FileZilla naar STRATO (map `app1-test`). Controleer daarna of de pagina laadt:

- **Lokaal:** `npm run test:smoke` (standaard `http://app1-test.caitlinveenendaal.nl/`), of met een andere URL: `BASE_URL=<url> npm run test:smoke`.
- **In GitHub:** Actions → *ci-cd* → *Run workflow*, eventueel met een andere URL.
