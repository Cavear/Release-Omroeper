# Draaiboek demo (± 3 minuten)

Van een technische PR-titel naar een uitgezonden journaal. Generale repetitie gedaan op 30-10-2026; tijden hieronder zijn gemeten.

## Klaarzetten (vóór de demo)

| Wat | Waar |
|---|---|
| App op productie | http://app1.caitlinveenendaal.nl/ (volledig scherm klaar in de browser) |
| Claude Code in deze repo | met de MCP-server `github` verbonden (`/mcp` → github ✓) |
| De vage PR in de oefenrepo | https://github.com/Cavear/vibe_webshop/pull/10 ("fix bug") |
| De demo-PR met de kapotte filter | https://github.com/Cavear/Release-Omroeper/pull/26 (open, rood) |
| Terugvaloptie concept | `journaal/2026-10-30-oefenrepo/journaal-concept.json` |
| Terugvaloptie fix | lokaal de branch `demo/kapotte-filter` uitgecheckt |

## De demo

### 1. Het probleem (15 s)
Toon PR #10 in de oefenrepo: titel en beschrijving zijn alleen *fix bug*.
> "Wie weet hierdoor wat er voor de gebruiker verandert?"

### 2. Claude maakt het concept, live (45 s)
In Claude Code:
```
/journaal Cavear/vibe_webshop 2026-10-30T13:00 2026-10-30T14:00
```
Claude haalt via de **read-only** GitHub MCP alle 13 PR's op, toont de verantwoordingstabel (5 opgenomen, 8 met reden uitgesloten) en schrijft `journaal-concept.json`.
> "Claude leest alleen; het schrijfrecht zit op een aparte server die het journaal nooit gebruikt."

**Terugvaloptie:** hapert de MCP, gebruik het vaste bestand uit `journaal/2026-10-30-oefenrepo/`.

### 3. Redigeren op productie (45 s)
1. *Concept importeren* → 5 kaarten.
2. Wijs de oker gemarkeerde kaart aan: *meer informatie nodig* bij "fix bug" → klik het ⓘ-icoon.
   > "Claude verzint geen voordeel als de PR het niet zegt."
3. *Bewerken* bij het zoekveld → kop aanpassen → *Opslaan*.
4. *Goedkeuren* bij drie berichten, *Uitsluiten* bij één. Teller: *3 van 5 goedgekeurd*.

### 4. De uitzending (30 s)
*Start uitzending* → aftelleader 3-2-1 → titelkaart → met **pijltje rechts** door de berichten → eindscherm → *Kopieer overzicht*.
> "Dames en heren, in de werkplaats heerste heden grote bedrijvigheid…"

Gemeten op productie: van *Start uitzending* tot titelkaart 3,4 s (aftellen); *Kopieer overzicht* werkt ook zonder HTTPS (oudere kopieermethode).

### 5. De tests houden echte fouten tegen (45 s)
Open PR #26: de filter van de uitzending laat ook concepten door.
- De pijplijn is **rood** op *conceptberichten komen niet in de uitzending* (gemeten: rood binnen 25 s).
- **Mergen is geblokkeerd**: branch protection op `test` en `main` eist een groene check `test` (de knop *Merge* is grijs, status *BLOCKED*).
- **Er komt geen deploy**: `deploy` en `smoke` staan op *skipped*.

Push de fix op dezelfde branch:
```
git switch demo/kapotte-filter
git revert --no-edit HEAD
git push
```
→ groen → *Merge* → deploy naar test met smoketest.

### 6. Afsluiten (15 s)
Toon `CHANGELOG.md`:
> "Dit journaal ging over de release van de app zelf. De omroeper schreef zijn eigen changelog."

Eventueel: `testbewijs/stap-5.3/` (de hele flow op drie schermformaten) en het Playwright-rapport in de laatste CI-run.

## Na de demo
PR #26 is na stap 5 gemergd. Wil je de demo nog een keer geven, maak dan opnieuw een demobranch:
```
git switch -c demo/kapotte-filter-2 origin/test
# in public/logic.js: === 'goedgekeurd'  →  !== 'uitgesloten'
git commit -am "Uitzending: filter op alles behalve uitgesloten (demo: dit is fout)" && git push -u origin HEAD
```
en open een PR naar `test`.
