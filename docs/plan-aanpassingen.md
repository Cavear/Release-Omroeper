# Aanpassingen op het totaalplan

Het project volgt het totaalplan (`Release-omroeper-totaalplan.docx`). Hier staat waar we daarvan afwijken en waarom. Besloten op 30-10-2026.

## Uitgangspunten

- **Het is een demo**, geen site die echt gebruikt gaat worden.
- **De repo is privé op het gratis GitHub-plan.** Branch protection, environment-secrets en verplichte reviewers voor een environment zijn daar niet beschikbaar.
- **Deploy naar test gaat automatisch** via GitHub Actions en SFTP (sinds 30-10-2026; eerst handmatig met FileZilla). De testomgeving is de map `App1-test` op `http://app1-test.caitlinveenendaal.nl/`.
- **Geen HTTPS op het subdomein.** Voor de demo is dat niet nodig.

## Per stap

| Stap | In het plan | Aangepast |
|---|---|---|
| 0.4 Repo inrichten | Environments `test` en `prod` met SFTP-secrets en `SITE_URL` | De environments bestaan, maar zonder secrets; die zijn niet nodig. Branch `test` is gemaakt vanaf `main`. |
| 1.2 Branch protection | Op `test` en `main` alleen mergen via PR, check `test` verplicht | **Vervalt** (niet mogelijk op het gratis plan). Afspraak: altijd mergen via een PR met een groene check `test`. |
| 1.3 Deploy naar test | Job `deploy` via SFTP bij een push naar `test` | Job `deploy` (doel volgt uit de branch) met `wlixcc/SFTP-Deploy-Action@v1.2.6`, met **repository secrets** (`SFTP_HOST`, `SFTP_USER`, `SFTP_PASSWORD`, `TEST_SFTP_PATH`) in plaats van environment-secrets. Wist niets op de server. |
| 1.4 Smoketest | Job `smoke` na `deploy`, met `vars.SITE_URL` | Job `smoke` draait na `deploy`, en los via **Run workflow** met een eigen URL; lokaal met `npm run test:smoke`. Controleert ook de kop *De redactietafel*. |
| 1.5 Prod met goedkeuring | Deploy naar prod na goedkeuring, daarna de smoketest | **Zonder goedkeuringsstap** (besluit 30-10-2026): bij een merge naar `main` en geslaagde tests gaat de app direct naar de map `App1-Prod` (`http://app1.caitlinveenendaal.nl/`), daarna de smoketest op prod. De bewuste stap is de PR van `test` naar `main`. Secret `PROD_SFTP_PATH`. Sinds fase 5 draait ook `test:ui` in de job `test`. |
| 3.x / 5.x Eindscherm | *Kopieer overzicht* met de Clipboard API | Zonder HTTPS werkt `navigator.clipboard` niet. Bouw een reserve-route: de oudere kopieermethode, of als dat niet lukt de tekst geselecteerd in beeld zodat je hem met Ctrl+C kopieert. Lokaal (`localhost`) werkt de Clipboard API wel. |

## Kleine aanvullingen

- Stap 2.1: `teksten.fouten` heeft twee nieuwe meldingen gekregen, `verkeerdType(veld)` en `periodeOmgedraaid`. `verkeerdeUrl` noemt nu de echte repository. In het contract (`docs/contract.md`) zijn de meldingentabel en de uitleg over `veld` (`bestand` en `bericht`) bijgewerkt.
- Node.js 22.12 of nieuwer, want Vitest vraagt die versie.
- Stap 3.3/3.6: de teller (*n van m goedgekeurd*) met *Start uitzending* staat **onderaan** als vaste balk, zoals in het goedgekeurde ontwerp en `CLAUDE.md`, niet bovenaan zoals het plan als voorbeeld noemt.
- Stap 3.3: de tekst op de sluitknop van de uitzending is *Uitzending sluiten* (de naam uit `CLAUDE.md`) in plaats van alleen *Esc* uit het prototype.
