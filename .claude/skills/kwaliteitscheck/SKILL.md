---
name: kwaliteitscheck
description: Draait lint, unit- en UI-tests, maakt met de Playwright MCP screenshots van redactie en uitzending op mobiel, tablet en desktop, en rapporteert per acceptatiecriterium groen of rood.
---

# Kwaliteitscheck

## 1. Tests

1. Draai `npm run lint`, `npm run test:unit` en `npm run test:ui`.
2. Noteer per commando of het geslaagd is, en bij een fout de eerste foutmelding.

## 2. Screenshots

1. Start een lokale server op de map `public/`, bijvoorbeeld met `npx http-server public -p 8080`.
2. Gebruik de MCP-server `playwright` en maak screenshots op drie viewports: 390x844 (mobiel), 768x1024 (tablet) en 1440x900 (desktop).
3. Maak per viewport deze screenshots:
   - **Lege staat:** voordat er iets is ingeladen.
   - **Redactie:** na het importeren van `testdata/geldig-5-berichten.json` (of `testdata/voorbeeld.json` als dat bestand er nog niet is).
   - **Uitzending:** het eerste nieuwsframe, nadat je minstens één bericht hebt goedgekeurd.
4. Sla de screenshots op in `testbewijs/kwaliteitscheck/`, met namen zoals `redactie-mobiel.png`.
5. Bekijk elke screenshot zelf. Let op:
   - horizontaal scrollen
   - afgesneden koppen
   - te kleine knoppen
   - slecht contrast
   - afwijkingen van `docs/design/` en `CLAUDE.md`

## 3. Rapport per acceptatiecriterium

Geef een tabel met de kolommen **criterium**, **groen/rood** en **bewijs** (testnaam of screenshot) voor deze criteria:

| Criterium | Wat je controleert |
|---|---|
| Import is robuust | Een ongeldig bestand geeft een duidelijke foutmelding en er wordt niets geladen. |
| Redactie bepaalt de uitzending | Alleen goedgekeurde berichten worden uitgezonden, met de aangepaste tekst. |
| Elk bericht is controleerbaar | Elke bronlink wijst naar de juiste PR en nergens staat "live". |
| Responsive | Geen horizontaal scrollen, 1, 2 of 3 kolommen per viewport, en knoppen van minimaal 44 px. |
| Toegankelijkheid | Bedienbaar met het toetsenbord, een zichtbare focusstijl en geen serieuze axe-fouten. |
| Uitleg in de app | Er zijn een lege staat met 3 stappen, een Help-paneel en een uitleg bij elk statuslabel. |
| Lint en unit-tests | Beide groen. |

Kun je een criterium nog niet controleren, omdat dat onderdeel nog niet gebouwd is? Markeer het dan als **n.v.t.** en zeg waarom. Wijzig zelf geen code.
