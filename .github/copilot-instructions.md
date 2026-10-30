# Release-omroeper – bouwinstructies voor Claude Code

Zet gemergde GitHub-pull requests om in een kort, licht komisch journaal in de stijl van een oud bioscoopjournaal. Zie `readme.md`.

Lees dit bestand helemaal voordat je iets bouwt. Het ontwerp is goedgekeurd; jij bouwt het na en verzint geen eigen stijl.

## Spelregel

**De grap zit in de kop, nooit over personen.** De uitleg onder de kop is zakelijk. Nooit grappen ten koste van een ontwikkelaar, reviewer of collega. Verzin geen voordelen.

## Wat we bouwen

Een statische webapp (geen framework, geen build-stap) die `journaal-concept.json` inleest en er een licht komisch journaal in de stijl van een bioscoopjournaal uit de jaren vijftig van maakt.

- **Redactie** (licht thema): het concept importeren, berichten nakijken, goedkeuren of uitsluiten, kop en uitleg bewerken, en het journaal exporteren.
- **Uitzending** (donker thema, volledig scherm): aftelleader 3-2-1, titelkaart, één goedgekeurd bericht per scherm met *Volgende*, en een eindscherm met een kopieerbaar totaaloverzicht.

Bronnen van het ontwerp:
- Design System: https://claude.ai/artifact/J2gZ98HmvwLupjQ1DzdaQS
- Schermen (canvas): https://claude.ai/artifact/BrWnB9ZTfNkohmXEnghZ2K
- Exports van de frames: `docs/design/`

## Bestanden

De app staat in `public/`; tests, testdata en documentatie staan in de root.

```
public/index.html   één pagina; redactie en uitzending zijn twee <section>'s
public/style.css    KANT-EN-KLAAR aangeleverd: tokens, basis en alle componenten. Breid uit, wijzig geen tokenwaarden.
public/teksten.js   KANT-EN-KLAAR aangeleverd: ALLE zichtbare teksten. Geen losse strings in app.js.
public/logic.js     pure functies, zonder DOM (valideerConcept, selecteerUitzending, bewerkBericht,
                    wijzigStatus, maakTotaaloverzicht, exporteerJournaal)
public/app.js       DOM, events en weergave; importeert uit logic.js en teksten.js
tests/unit/         Vitest     tests/ui/   Playwright     testdata/   gegenereerde JSON
docs/contract.md    het volledige contract van journaal-concept.json
```

ES-modules (`<script type="module" src="app.js">`). JSDoc in het Nederlands bij elke functie. Fonts komen van Google Fonts met `display=swap` (de `<link>` staat bovenaan `style.css` als commentaar).

## Stijlgids

Stijl: oud bioscoopjournaal uit de jaren vijftig, zonder echt Polygoon-logo of echte beelden. Eigen naam: Het Release-Bioscoopjournaal.

### Kleuren

| Naam | Waarde | Gebruik |
|---|---|---|
| Bijna-zwart | `#141210` | Achtergrond uitzending, tekst op licht |
| Gebroken wit | `#f2ead8` | Achtergrond redactie, tekst op donker |
| Sepia | `#a08660` | Lijnen en secundaire accenten; als tekst alleen op het donkere thema (op gebroken wit haalt het geen AA) |
| Oud-rood (accent) | `#8b2e1f` | Primaire knop, accenten; spaarzaam gebruiken |

Contrast minimaal WCAG AA. In code altijd via de tokens uit `style.css`, nooit als losse hexcode (zie Harde regels).

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

- Bij `prefers-reduced-motion: reduce` geen flikkering en geen animaties (precies uitgewerkt in Harde regel 8).
- Genoeg contrast (WCAG AA).
- Alles bedienbaar met het toetsenbord; pijltje rechts = Volgende.

## Kwaliteit en responsive

- **Mobile-first** bouwen: basis-CSS voor 390 px, daarna `min-width`-queries.
- **Breakpoints:** 390, 768, 1024 en 1440 px.
- Nergens horizontaal scrollen, op geen enkele breedte.
- Vloeiende typografie met `clamp()`.
- **Tikdoelen minimaal 44 × 44 px** voor elke knop, link-knop en icoonknop.
- Contrast minimaal WCAG AA in beide thema's.
- Zichtbare focusstijl; alles bedienbaar met het toetsenbord.
- Semantische HTML: echte `<button>`, `<a href>`, `<input>` met `<label>`, koppen in volgorde.
- Foutmeldingen en feedback via `aria-live`.
- Elk scherm heeft een **lege staat, een laadstaat en een foutstaat**.
- Na elke actie direct zichtbare feedback.
- Per kaart maximaal één primaire knop.
- Geen framework en geen build-stap.
- Lettertypes met `font-display: swap`.
- Doel: **Lighthouse 90+** voor prestaties en toegankelijkheid.

## Harde regels

1. Gebruik alleen de CSS-variabelen uit `style.css` (`var(--ink)`, `var(--space-4)` …). Geen losse hexcodes of pixelgetallen in nieuwe CSS, behalve 1px-haarlijnen.
2. Gebruik de klassen uit `style.css` (`.knop--primair`, `.kaart`, `.label--goedgekeurd` …). Maak alleen nieuwe klassen voor iets wat er nog niet is, in dezelfde BEM-stijl.
3. **Mobile-first.** Basis-CSS is voor 390 px; `min-width`-queries op 768, 1024 en 1440. Nergens horizontaal scrollen.
4. Elke knop, link-knop en icoonknop is minimaal 44 × 44 px. Echte `<button>`, `<a href>`, `<input>` met `<label>`; nooit een klikbare div.
5. Een zichtbare focusring (zit in `style.css`). Alles werkt met het toetsenbord.
6. Iconen zijn inline SVG (stroke 1.75, `currentColor`, `aria-hidden="true"`), altijd naast tekst. Icoonknoppen zonder tekst krijgen een `aria-label`. Geen emoji.
7. Elk scherm heeft een lege staat, een laadstaat en een foutstaat. Elke actie geeft direct zichtbare feedback via `#melding` (`aria-live="polite"`); fouten via `#fout` (`role="alert"`).
8. Bij `prefers-reduced-motion: reduce`: geen flikkering, geen bewegende krassen, geen lopende balk en geen puls. Dat regelt `style.css` al; voeg geen animatie toe buiten dat blok.
9. Contrast is WCAG AA in beide thema's. `--sepia` is alleen versiering, nooit tekst op het lichte thema.
10. Raak `logic.js` niet aan vanuit UI-stappen, behalve als de stap dat zegt.

## Toegankelijke namen (de UI-tests zoeken hierop, dus exact zo)

| Element | Rol | Naam |
|---|---|---|
| Importknop (kop en lege staat) | button | `Concept importeren` |
| Exportknop | button | `Journaal exporteren` |
| Help | button | `Help` (sneltoets `?`) |
| Help sluiten | button | `Sluiten` |
| Per kaart | button | `Goedkeuren` ⇄ `Terug naar concept` |
| Per kaart | button | `Uitsluiten` ⇄ `Weer opnemen` |
| Per kaart | button | `Bewerken`, in bewerkstand `Opslaan` en `Annuleren` |
| Per kaart | link | `Bron openen` (`target="_blank" rel="noopener"`) |
| Uitleg-icoon bij een status | button | `Uitleg over de status <status>` |
| Startknop | button | `Start uitzending` (`disabled` zolang er niets is goedgekeurd, met uitleg ernaast) |
| Uitzending | button | `Volgende` (ook pijltje rechts en vegen naar links) |
| Uitzending | button | `Aftellen overslaan`, `Uitzending sluiten` (Esc) |
| Eindscherm | button | `Kopieer overzicht`, `Terug naar de redactie` |
| Kaart | article | `aria-labelledby` naar de kop van de kaart |

Gebruik daarnaast `data-testid` op: `kaart`, `teller`, `uitzending`, `nieuwsframe`, `totaaloverzicht`, `fout`, `lege-staat`.

## Scherm 1 – Redactie (`<section id="redactie" data-thema="redactie">`)

Van boven naar beneden, binnen `.pagina` (max. 1344 px breed, gecentreerd):

1. **Kop** (`.kopbalk`): het onderschrift *HET RELEASE-BIOSCOOPJOURNAAL*, `<h1>` *De redactietafel*, en zodra er een concept is de metaregel: `<repository> · gemergd op <datum> tussen <van> en <tot> · concept van <gegenereerdOp>`. Rechts (op mobiel eronder, wrappend) de knoppen *Help*, *Concept importeren* en *Journaal exporteren* (die laatste alleen met een concept).
2. **Foutmelding** (`.fout`, alleen na een mislukte import): de kop *Dit bestand is niet ingeladen*, de zin dat er niets is geladen en het huidige werk onveranderd is, een `<ul>` met per fout `Bericht <n>, veld <veld>: <wat er mis is>` (of zonder bericht als de fout het hele bestand betreft), en in vet *Pas het bestand aan en kies opnieuw Concept importeren.*
3. **Lege staat** (`.leeg`, zolang er geen concept is): ornament *NOG GEEN NIEUWS*, `<h2>` *Zo maak je een journaal*, een `<ol>` met 3 stappen (een groot rood cijfer, een vette titel en één zin), de primaire knop *Concept importeren* en een link naar de gebruikershandleiding.
4. **Laadstaat**: tijdens het inlezen de importknop met spinner en *Bezig met inlezen…* (`aria-busy="true"`).
5. **Publicatieregel** (`.publicatie`): info-icoon, **Publicatiestatus: niet gecontroleerd.** en *Claude schreef deze koppen en uitleg; loop elk bericht na tegen de bron voordat je het goedkeurt.*
6. **Kaartenraster** (`.raster`): 1 kolom, vanaf 768 px 2 kolommen, vanaf 1024 px 3. Per bericht een `.kaart`:
   - rij 1: `PR #<nr> · gemergd <HH:MM>` (`.kaart__meta`), rechts het statuslabel plus het uitleg-icoon
   - `Origineel: <origineleTitel>` (titel in typemachineletter)
   - `<h3>` met de kop (`.kaart__kop`)
   - de uitleg (`.kaart__uitleg`)
   - `Voor: <voorWie>` (`.kaart__wie`); ontbreekt het veld, dan *Voor: nog onbekend*
   - een actierij na een haarlijn: Goedkeuren/Terug naar concept, Uitsluiten/Weer opnemen, Bewerken (tekstknop) en Bron openen (link)
   - modifiers: `.kaart--let-op` bij `meer-info-nodig` (rand in ink en een okerband bovenaan), `.kaart--uit` bij `uitgesloten` (kop doorgestreept)
   - **bewerkstand**: kop als `<input>`, uitleg als `<textarea>` (allebei met een zichtbaar `<label>`), en de knoppen *Opslaan* (primair) en *Annuleren*. Esc betekent Annuleren.
7. **Tellerbalk** (`.tellerbalk`, `data-testid="teller"`, `role="status"`): links `<n> van <totaal> goedgekeurd` in de display-letter met daaronder één regel uitleg (zie `teksten.js`), rechts *Start uitzending*. Op desktop is de balk `position: sticky` onderaan; onder 768 px `position: fixed` over de volle breedte, met een spacer van 120 px erboven.
8. **Help-paneel** (`<dialog class="help">`, opent met de knop *Help* of de toets `?` buiten invoervelden, sluit met Esc of *Sluiten*): de 4 statussen met hun label en uitleg, de knoppen met uitleg, een blok over *Publicatiestatus: niet gecontroleerd*, en een link naar de handleiding. Rechts uitschuivend, `width: min(440px, 100%)`.

Gedrag:
- De teller en de startknop werken direct bij na elke statuswijziging. Elke actie geeft een melding in `#melding` (bijvoorbeeld *Bericht #42 goedgekeurd*).
- Een nieuwe import terwijl er al werk is, vraagt eerst om bevestiging (`teksten.bevestigVervangen`).
- Een uitleg-icoon toont een korte uitleg (een popover of `<details>`) die werkt met klik, tik en toetsenbord.

## Scherm 2 – Uitzending (`<section id="uitzending" data-thema="uitzending" data-testid="uitzending">`)

Volledig scherm (`100dvh`, met de Fullscreen API als die er is). Een flexkolom: het frame vult de ruimte, de lopende balk staat onderin. Effectlagen erboven, allemaal `pointer-events: none` en `aria-hidden`: `.effect-vignet`, `.effect-korrel` (inline SVG met `feTurbulence`), `.effect-flikker` en twee `.effect-kras`. De knop *Uitzending sluiten* staat vast rechtsboven.

Volgorde: **leader → titelkaart → één frame per goedgekeurd bericht (in volgorde van `selecteerUitzending`) → eindscherm.**

1. **Leader** (`.leader`): een sepia cirkel met kruisdraden en het cijfer 3 → 2 → 1 (1 s per cijfer), daarna automatisch door. Knop *Aftellen overslaan*. Bij reduced motion zonder puls, wel tellend.
2. **Titelkaart** (`.titelkaart`): ornament *HET RELEASE-BIOSCOOPJOURNAAL*, `<h1>` *UIT DE WERKPLAATS*, en de regel *Release van <datum> · <n> berichten*.
3. **Nieuwsframe** (`.nieuwsframe`, `data-testid="nieuwsframe"`): het onderschrift *BERICHT <i> VAN <n> · UIT DE WERKPLAATS*, `<h1>` met de (bewerkte) kop, de uitleg (max. 60ch) en de regel `Bron: <a>PR #<nr> · <origineleTitel></a>` · `Publicatiestatus: niet gecontroleerd`.
4. **Lopende balk** (`.balk`, op titelkaart en nieuwsframes): het zwarte vak *JOURNAAL*, een lopende tekst met alle koppen gescheiden door ★ (aria-hidden) en rechts de knop *Volgende* met een pijl.
5. **Eindscherm** (`.eindscherm`): `<h1>` *EINDE VAN HET JOURNAAL*, de sectie *TOTAALOVERZICHT · OM TE KOPIËREN* (`data-testid="totaaloverzicht"`) met een `<ol>` van kop, uitleg en link, *Publicatiestatus: niet gecontroleerd*, en de knoppen *Kopieer overzicht* (primair; wordt na een klik *Gekopieerd* met een melding) en *Terug naar de redactie*. De gekopieerde tekst is precies `maakTotaaloverzicht(berichten)`.

Bediening: *Volgende*, pijltje rechts, vegen naar links (touch, minstens 50 px horizontaal), en Esc om te sluiten. Na het sluiten staat de focus weer op *Start uitzending*.

Koppen schalen met `clamp(1.75rem, min(6.4vw, 11vh), 4.75rem)`. Een kop van 90 tekens past binnen beeld op 390×844 en op 844×390.

## Contract (samenvatting; de volledige regels staan in `docs/contract.md`)

Statussen: `concept`, `meer-info-nodig`, `goedgekeurd`, `uitgesloten`. Maximaal 5 berichten, `prNummer` uniek, `bronUrl` = `https://github.com/<repository>/pull/<prNummer>`, `gemergdOp` binnen de periode. Bij een fout wordt niets geladen. `valideerConcept` geeft `{ geldig, fouten: [{ bericht: number|null, veld, melding }] }`; de UI toont `melding` uit `teksten.fouten`.

## Werkwijze per stap

Voer alleen de gevraagde stap uit. Gebruik plan mode als de stap meer dan twee bestanden raakt. Maak daarna met de Playwright MCP screenshots op 390×844, 768×1024 en 1440×900 (voor de uitzending ook 844×390), vergelijk ze met `docs/design/` en herstel wat afwijkt. Laat dan de reviewer-subagent kijken. Sluit af met een korte samenvatting en hoe ik het kan controleren.

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
