# Architectuur

> Korte opzet; wordt aangevuld tijdens het bouwen.

## De flow

```
GitHub (gemergde PR's)
   │  GitHub MCP, alleen lezen
   ▼
Claude Code, skill /journaal
   │  schrijft
   ▼
journaal-concept.json   ← het contract, zie contract.md
   │  importeren in de browser
   ▼
Webapp (public/): redactie → uitzending
```

1. **GitHub MCP (read-only).** Claude Code haalt met de skill `/journaal` de gemergde PR's van een repository binnen een periode op. De server `github` draait in de alleen-lezenmodus.
2. **Conceptbestand.** Claude schrijft per PR een kop en een uitleg in `journaal-concept.json`. Dat bestand is de enige overdracht tussen de MCP-route en de app.
3. **Webapp.** Een statische pagina zonder framework en zonder build-stap. Je importeert het bestand in de browser, kijkt het na en zendt het uit.

## Waarom de site geen token krijgt

- De app praat nooit zelf met GitHub. Alle gegevens komen uit het bestand dat je zelf importeert.
- Er staat dus geen token in de code, in de browser of op de server. Een token op een publieke site kan iedereen uitlezen.
- Het leestoken (`GITHUB_TOKEN_READ`) staat alleen als omgevingsvariabele op de laptop van wie het journaal maakt.
- Zo kan de site ook niets per ongeluk wijzigen in een repository.

## Onderdelen van de app

| Bestand | Rol |
|---|---|
| `public/index.html` | De pagina, met de secties redactie en uitzending |
| `public/style.css` | Tokens en componenten uit het Design System |
| `public/teksten.js` | Alle zichtbare teksten |
| `public/logic.js` | Pure functies zonder DOM, zoals validatie en selectie |
| `public/app.js` | DOM, events en weergave |

## Hosting en CI

- **Hosting:** STRATO. De inhoud van `public/` gaat handmatig met FileZilla naar de map `app1-test` (`http://app1-test.caitlinveenendaal.nl/`).
- **CI** (`.github/workflows/ci-cd.yml`): de job `test` (lint en unit-tests) draait bij elke pull request naar `test` of `main`. De job `smoke` start je met *Run workflow* na een upload.
- Er is geen automatische deploy; zie [plan-aanpassingen.md](plan-aanpassingen.md).
