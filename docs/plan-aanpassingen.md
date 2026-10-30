# Aanpassingen op het totaalplan

Het project volgt het totaalplan (`Release-omroeper-totaalplan.docx`). Hier staat waar we daarvan afwijken en waarom. Besloten op 30-10-2026.

## Uitgangspunten

- **Het is een demo**, geen site die echt gebruikt gaat worden.
- **De repo is privé op het gratis GitHub-plan.** Branch protection, environment-secrets en verplichte reviewers voor een environment zijn daar niet beschikbaar.
- **De upload naar STRATO gaat handmatig met FileZilla.** De testomgeving is de map `app1-test` op `http://app1-test.caitlinveenendaal.nl/`.
- **Geen HTTPS op het subdomein.** Voor de demo is dat niet nodig.

## Per stap

| Stap | In het plan | Aangepast |
|---|---|---|
| 0.4 Repo inrichten | Environments `test` en `prod` met SFTP-secrets en `SITE_URL` | De environments bestaan, maar zonder secrets; die zijn niet nodig. Branch `test` is gemaakt vanaf `main`. |
| 1.2 Branch protection | Op `test` en `main` alleen mergen via PR, check `test` verplicht | **Vervalt** (niet mogelijk op het gratis plan). Afspraak: altijd mergen via een PR met een groene check `test`. |
| 1.3 Deploy naar test | Job `deploy` via SFTP bij een push naar `test` | **Vervalt.** Upload de inhoud van `public/` met FileZilla naar `app1-test`. |
| 1.4 Smoketest | Job `smoke` na `deploy`, met `vars.SITE_URL` | Job `smoke` start je met **Run workflow** (Actions → *ci-cd*) na een upload; lokaal met `npm run test:smoke`. Standaard-URL: de testomgeving. |
| 1.5 Prod met goedkeuring | Deploy naar prod na goedkeuring, daarna de smoketest | **Vervalt als CI-stap.** Prod upload je ook zelf met FileZilla; draai daarna *Run workflow* met de prod-URL. `test:ui` gaat in fase 5 alsnog in de job `test`. |
| 3.x / 5.x Eindscherm | *Kopieer overzicht* met de Clipboard API | Zonder HTTPS werkt `navigator.clipboard` niet. Bouw een reserve-route: de oudere kopieermethode, of als dat niet lukt de tekst geselecteerd in beeld zodat je hem met Ctrl+C kopieert. Lokaal (`localhost`) werkt de Clipboard API wel. |

## Kleine aanvullingen

- Stap 2.1: `teksten.fouten` heeft twee nieuwe meldingen gekregen, `verkeerdType(veld)` en `periodeOmgedraaid`. `verkeerdeUrl` noemt nu de echte repository. In het contract (`docs/contract.md`) zijn de meldingentabel en de uitleg over `veld` (`bestand` en `bericht`) bijgewerkt.
- Node.js 22.12 of nieuwer, want Vitest vraagt die versie.
