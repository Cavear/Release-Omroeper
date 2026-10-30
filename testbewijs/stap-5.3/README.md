# Stap 5.3 – Testbewijs: de hele flow op de test-URL

Gemaakt op 30-10-2026 tegen `http://app1-test.caitlinveenendaal.nl/` (de versie die de CI daar heeft gedeployd), met Playwright op drie viewports (script `maak-screenshots.mjs` in deze map; een script in plaats van de Playwright MCP, omdat het zo in één keer voor alle drie viewports gaat): mobiel 390×844 (touch), tablet 768×1024 (touch) en desktop 1440×900. Met *reduced motion*, zodat flikkering en lopende balk de beelden niet laten verschillen.

Data: `testdata/geldig-5-berichten.json`.

| Nr | Stap | Wat er gebeurt |
|---|---|---|
| 01 | lege-staat | De app zonder concept: uitleg in 3 stappen en Concept importeren |
| 02 | geimporteerd | 5 berichten ingeladen, alle op concept |
| 03 | bewerken | Kop van #42 aangepast in de bewerkstand |
| 04 | geredigeerd | #42 en #43 goedgekeurd, #44 uitgesloten; teller 2 van 5 |
| 05 | uitzending-leader | Aftelleader 3-2-1 |
| 06 | uitzending-titelkaart | Uit de werkplaats · 2 berichten |
| 07 | uitzending-bericht-1 | #42 met de aangepaste kop |
| 08 | uitzending-bericht-2 | #43 |
| 09 | uitzending-eindscherm | Totaaloverzicht met alleen #42 en #43 |

Per stap en per viewport één screenshot: `NN-stap-viewport.jpg` (27 bestanden).

De herhaalbare controles van dezelfde flow staan in `tests/ui/` en draaien bij elke pull request in de CI.
