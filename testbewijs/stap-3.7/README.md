# Stap 3.7 – Lighthouse (mobiel)

Gedraaid op 30-10-2026 met Lighthouse 12.8.2 (opdrachtregel, Chromium van Playwright, standaard mobiele instellingen met throttling) tegen de lokale XAMPP-server.

| Pagina | Prestaties | Toegankelijkheid | Best practices |
|---|---|---|---|
| `public/index.html` (redactie, lege staat) | 94 | 100 | 100 |
| `public/handleiding.html` | 100 | 100 | 100 |

Doel uit het plan: prestaties en toegankelijkheid minimaal 90. ☑ Gehaald.

Wat de laatste punten bij de app kost:
- **Render-blocking:** het Google Fonts-stylesheet. Dat is de afspraak uit de stijlgids (`display=swap`).
- **Geen tekstcompressie:** de lokale XAMPP-server comprimeert niet; een gewone webhost doet dat meestal wel.
- **CSS/JS niet geminificeerd:** dat hoort bij "geen build-stap".

Beperking: Lighthouse kan geen bestand importeren, dus de meting gaat over de lege staat. De toegankelijkheid met ingeladen kaarten, Help en uitzending is in stap 3.1–3.8 met Playwright gecontroleerd (namen, focus, 44 px, contrast boven de effectlagen).

De volledige rapporten staan als HTML in deze map.
