# Journaal eigen release – 30 oktober 2026

Repository: `Cavear/Release-Omroeper` · periode: **30-10-2026 00:00 – 23:59** (Europe/Amsterdam) · concept: [`journaal-concept.json`](journaal-concept.json)

Opgehaald met de read-only MCP-server `github` (`list_pull_requests`, alleen lezen). Het contract staat maximaal 5 berichten toe; volgens de skill `/journaal` zijn de wijzigingen gekozen die gebruikers het meest merken.

## Alle PR's en of ze zijn opgenomen

| PR | Titel | Gemergd (NL) | Opgenomen | Reden |
|---|---|---|---|---|
| #1 | Testpagina voor hostingcontrole toevoegen | 29-10 19:54 | nee | Buiten de periode (gisteren) |
| #2 | Fase 0: stijlgids, ontwerpinstructies, contract en documentatie | 30-10 10:22 | nee | Releasebundel naar `main`; inhoud zit in de losse PR's |
| #3 | CI: testjob met lint en unit-tests (stap 1.1) | 30-10 10:31 | nee | Technisch (CI), geen verschil voor gebruikers |
| #4 | Smoketest na handmatige upload (stap 1.4) | 30-10 10:40 | nee | Technisch (test) |
| #5 | Fase 1: CI-testjob en smoketest naar main | 30-10 10:41 | nee | Releasebundel naar `main` |
| #6 | Validatie van het conceptbestand (stap 2.1) | 30-10 10:49 | nee | Logica achter de import; voor gebruikers zichtbaar via #11 |
| #7 | Testdatagenerator (stap 2.2) | 30-10 10:52 | nee | Technisch (testdata) |
| #8 | Selectie en redactie (stap 2.3) | 30-10 10:56 | nee | Logica; zichtbaar via #12 en #13 |
| #9 | Totaaloverzicht en export (stap 2.4) | 30-10 10:59 | nee | Logica; zichtbaar via #12 en #13 |
| #10 | Ontwerpreferentie in docs/design | 30-10 11:07 | nee | Documentatie |
| #11 | Import en kaarten (stap 3.1) | 30-10 11:18 | **ja** | Zichtbaar: concept inladen en kaarten |
| #12 | Redactie-acties en export (stap 3.2) | 30-10 11:24 | **ja** | Zichtbaar: goedkeuren, uitsluiten, bewerken, exporteren |
| #13 | Uitzendstand, functioneel (stap 3.3) | 30-10 11:31 | **ja** | Zichtbaar: de uitzending |
| #14 | Styling redactie volgens ontwerp (stap 3.4) | 30-10 11:35 | nee | Kleine opmaakcorrecties; maximaal 5 berichten |
| #15 | Bioscoopeffecten uitzending (stap 3.5) | 30-10 11:42 | **ja** | Zichtbaar: leader, titelkaart, effecten |
| #16 | UX-afwerking (stap 3.6) | 30-10 11:46 | nee | Vangnetten (waarschuwingen); maximaal 5 berichten |
| #17 | Uitleg in de app (stap 3.8) | 30-10 11:52 | **ja** | Zichtbaar: Help, uitleg-iconen, handleiding |
| #18 | Lighthouse mobiel (stap 3.7) | 30-10 11:54 | nee | Testbewijs |
| #19 | Automatische deploy naar STRATO: test en productie | 30-10 12:07 | nee | Technisch (CI/CD) |
| #20 | Release: fase 2 en 3 naar productie | 30-10 12:11 | nee | Releasebundel naar `main` |
| #21 | Playwright-viewports en importtests (stap 5.0 en 5.1) | 30-10 12:19 | nee | Technisch (tests) |
| #22 | UI-tests uitzending, responsive en toegankelijkheid | 30-10 12:32 | nee | Technisch (tests) |
| #23 | Zelfverklarend-tests en testbewijs | 30-10 12:40 | nee | Technisch (tests) |
| #24 | Testdocumentatie bijgewerkt na fase 5 | 30-10 12:46 | nee | Documentatie |

## Zelfcontrole

- 5 berichten (#11, #12, #13, #15, #17), elk precies één keer; elke `bronUrl` hoort bij het eigen nummer.
- Elke uitleg komt uit de PR-beschrijving; geen verzonnen voordelen. Koppen zijn hoogstens 60 tekens en gaan niet over personen.
- `valideerConcept` keurt het bestand goed.
- **Het concept laadt in de app op prod** (`http://app1.caitlinveenendaal.nl/`): 5 kaarten, geen foutmelding.
- **Terugvaloptie:** dit bestand staat vooraf klaar in de repo; bij een haperende verbinding of MCP kan het direct worden ingeladen.
- `CHANGELOG.md` in de root is door de app zelf gemaakt: alle berichten goedgekeurd, uitzending tot het eind, *Kopieer overzicht*.
