# Release-omroeper

Zet gemergde GitHub-pull requests om in een kort, licht komisch journaal in de stijl van een oud bioscoopjournaal. Zie `readme.md`.

## Spelregel

**De grap zit in de kop, nooit over personen.** De uitleg onder de kop is zakelijk. Nooit grappen ten koste van een ontwikkelaar, reviewer of collega.

## Stijlgids

Stijl: oud bioscoopjournaal uit de jaren vijftig, zonder echt Polygoon-logo of echte beelden. Eigen naam: Het Release-Bioscoopjournaal.

### Kleuren

| Naam | Waarde | Gebruik |
|---|---|---|
| Bijna-zwart | `#141210` | Achtergrond uitzending, tekst op licht |
| Gebroken wit | `#f2ead8` | Achtergrond redactie, tekst op donker |
| Sepia | `#a08660` | Lijnen, onderschriften, secundaire accenten |
| Oud-rood (accent) | `#8b2e1f` | Primaire knop, accenten; spaarzaam gebruiken |

Contrast minimaal WCAG AA.

### Lettertypes

- **Koppen:** Playfair Display of Abril Fatface.
- **Onderschriften:** Special Elite (typemachine).
- **Lopende tekst:** een rustige schreefletter.
- Laden via Google Fonts met `font-display: swap`.

### Effecten (alleen in de uitzending)

Filmkorrel (SVG-ruis), vignet, lichte flikkering, krassen en een aftelleader 3-2-1 bij de start. De redactiestand blijft rustig, zonder effecten.

### Onderdelen

- **Titelkaart** per rubriek.
- **Nieuwskaart:** kop groot, uitleg klein, bron als onderschrift.
- **Lopende balk** onderin.

### Toegankelijkheid

- Bij `prefers-reduced-motion: reduce` geen flikkering en geen animaties.
- Genoeg contrast (WCAG AA).
- Alles bedienbaar met het toetsenbord; pijltje rechts = Volgende.

## MCP-servers (`.mcp.json`)

Tokens staan nooit in de repo, alleen als omgevingsvariabele op je eigen laptop.

| Server | Waarvoor | Token | Rechten |
|---|---|---|---|
| `github` | Het journaal maken: gemergde PR's ophalen en lezen (skill `/journaal`, fase 4.2–4.4 en 6.2) | `GITHUB_TOKEN_READ` | Alleen lezen (URL `/readonly` en header `X-MCP-Readonly`) |
| `github-oefenrepo` | Testdata maken in de oefenrepo (skill `/oefenrepo-vullen`, fase 4.1) | `GITHUB_TOKEN_OEFEN` | Schrijven, fine-grained token alleen op `Cavear/vibe_webshop` |
| `playwright` | Screenshots en UI-controle van de eigen pagina (stap 3.4, 3.5, 5.3, `/kwaliteitscheck`) | geen | n.v.t. |

Regels:
- **`github-oefenrepo` schrijft nooit naar een andere repo dan `Cavear/vibe_webshop`**, en daar alleen naar branches voor de oefen-PR's met doelbranch `omroeper-oefen`. Nooit naar `main` van de webshop.
- Voor het journaal altijd `github` gebruiken, nooit `github-oefenrepo`.
- Vraag bevestiging voordat je via `github-oefenrepo` iets aanmaakt, merget of sluit.
