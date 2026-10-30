# Contract: journaal-concept.json

Dit bestand is de overdracht tussen de MCP-route (skill `/journaal`) en de webapp. De generator van de testdata en de import in de app gebruiken allebei dit contract. Verandert het formaat, pas dan eerst dit document aan.

Het nagekeken journaal dat de app exporteert (*Journaal exporteren*, `journaal-nagekeken.json`) volgt hetzelfde contract. Je kunt het dus opnieuw importeren en verder werken.

## Formaat

```json
{
  "repository": "owner/repo",
  "periode": { "van": "2026-10-30T09:15:00+01:00", "tot": "2026-10-30T13:00:00+01:00" },
  "gegenereerdOp": "2026-10-30T10:15:00Z",
  "berichten": [
    {
      "prNummer": 42,
      "bronUrl": "https://github.com/owner/repo/pull/42",
      "origineleTitel": "Fix address persistence after refresh",
      "gemergdOp": "2026-10-30T09:40:00+01:00",
      "kop": "Opslaanknop onthoudt eindelijk zijn werk",
      "uitleg": "Na het wijzigen van een adres blijven de gegevens bewaard na verversen.",
      "voorWie": "Gebruikers die adressen wijzigen",
      "status": "concept",
      "publicatiestatus": "niet gecontroleerd"
    }
  ]
}
```

## Velden

### Bestand

| Veld | Type | Verplicht | Betekenis |
|---|---|---|---|
| `repository` | tekst `owner/repo` | ja | De GitHub-repository waar de PR's vandaan komen |
| `periode` | object | ja | Het tijdvak van het journaal |
| `periode.van` | ISO 8601-tijd | ja | Begin van de periode |
| `periode.tot` | ISO 8601-tijd | ja | Einde van de periode |
| `gegenereerdOp` | ISO 8601-tijd | nee | Wanneer het concept is gemaakt |
| `berichten` | lijst | ja | De nieuwsberichten, maximaal 20 |

### Per bericht

| Veld | Type | Verplicht | Betekenis |
|---|---|---|---|
| `prNummer` | geheel getal > 0 | ja | Nummer van de gemergde pull request |
| `bronUrl` | tekst (URL) | ja | Link naar de pull request |
| `origineleTitel` | tekst | ja | De titel van de PR, ongewijzigd |
| `gemergdOp` | ISO 8601-tijd | nee | Moment van mergen |
| `kop` | tekst | ja | De licht komische kop; bij direct ophalen uit GitHub een vaste journaalopener plus het onderwerp uit de PR-titel (max. 90 tekens), die de redactie controleert en zo nodig herschrijft. De grap zit nooit over personen |
| `uitleg` | tekst | ja | Zakelijke uitleg van wat er veranderd is; direct ophalen neemt de eerste alinea van de PR-beschrijving over (max. 280 tekens), die onvolledig kan zijn |
| `voorWie` | tekst | nee | Voor wie de wijziging van belang is; ontbreekt hij, dan toont de app *Voor: nog onbekend* |
| `status` | tekst | ja | `concept`, `meer-info-nodig`, `goedgekeurd` of `uitgesloten` |
| `publicatiestatus` | tekst | nee | Altijd `niet gecontroleerd` zolang een mens het bericht niet heeft nagelopen |

## Statussen

| Status | Betekenis | In de uitzending? |
|---|---|---|
| `concept` | Automatisch opgesteld of opgehaald, nog niet nagekeken | nee |
| `meer-info-nodig` | De PR geeft te weinig informatie voor een goede uitleg | nee |
| `goedgekeurd` | Nagekeken en goed bevonden door de redactie | ja |
| `uitgesloten` | Komt bewust niet in het journaal | nee |

### Statusovergangen in de redactie

`wijzigStatus` in `public/logic.js` staat alleen deze overgangen toe (`OVERGANGEN`). Elke overgang hoort bij een knop op de kaart.

| Knop | Van | Naar |
|---|---|---|
| *Goedkeuren* | `concept`, `meer-info-nodig` | `goedgekeurd` |
| *Terug naar concept* | `goedgekeurd` | `concept` |
| *Uitsluiten* | `concept`, `meer-info-nodig`, `goedgekeurd` | `uitgesloten` |
| *Weer opnemen* | `uitgesloten` | `concept` |

Afspraken voor de UI:
- Op een **uitgesloten** kaart is *Goedkeuren* uitgeschakeld (`disabled`), met uitleg. Eerst *Weer opnemen*, dan pas goedkeuren.
- `meer-info-nodig` komt alleen uit het conceptbestand. Na *Goedkeuren* of *Uitsluiten* gaat een bericht via *Terug naar concept* of *Weer opnemen* naar `concept`, niet terug naar `meer-info-nodig`. Dat is een bewuste keuze: de redactie heeft het bericht dan al bekeken.
- Bewerken verandert de status niet: een goedgekeurd bericht blijft na het aanpassen van kop of uitleg goedgekeurd.

## Validatieregels bij import

1. Het bestand is geldige JSON en niet leeg.
2. `repository`, `periode` (met `van` en `tot`) en `berichten` zijn aanwezig.
3. Per bericht zijn `prNummer`, `bronUrl`, `origineleTitel`, `kop`, `uitleg` en `status` aanwezig. Tekstvelden zijn niet leeg.
4. Er zijn maximaal 20 berichten.
5. `prNummer` is uniek binnen het bestand.
6. `bronUrl` is precies `https://github.com/<repository>/pull/<prNummer>`: hij begint met `https://github.com/<repository>/pull/` en eindigt op het eigen `prNummer`.
7. `status` is `concept`, `meer-info-nodig`, `goedgekeurd` of `uitgesloten`.
8. Als `gemergdOp` er is, ligt die binnen de periode (`van` ≤ `gemergdOp` ≤ `tot`).
9. Velden hebben het type uit de tabellen hierboven: `berichten` is een lijst, `prNummer` is een geheel getal groter dan 0 (dus niet `"42"`), tijden zijn geldige ISO 8601-tijden en `periode.van` ligt niet na `periode.tot`.

Een bestand met nul berichten is geldig, maar levert in de app de lege staat op.

`publicatiestatus` wordt bij de import altijd op `niet gecontroleerd` gezet, wat er ook in het bestand staat. Een andere waarde is dus geen fout.

## Bij een fout

- Er wordt **niets** geladen; het huidige werk in de app blijft onveranderd.
- De app toont alle gevonden fouten tegelijk, elk met het bericht en het veld.

`valideerConcept(json)` in `public/logic.js` geeft:

```js
{ geldig: boolean, fouten: [{ bericht: number | null, veld: string, melding: string }] }
```

- `bericht` is het volgnummer van het bericht in de lijst, vanaf 1. Het is `null` als de fout het hele bestand betreft (geen JSON, leeg, te veel berichten, of een verplicht veld op bestandsniveau ontbreekt of klopt niet).
- `veld` is de naam van het veld, bijvoorbeeld `bronUrl` of `periode.van`. Betreft de fout het bestand als geheel (geen JSON, leeg, geen object), dan is `veld` `bestand`; is een bericht zelf geen object, dan is `veld` `bericht`.
- `valideerConcept` accepteert de inhoud als tekst of als al ingelezen object. Is het bestand geen JSON, leeg of geen object, of ontbreekt `berichten` of is het geen lijst, dan stopt de controle daar; anders komen alle fouten tegelijk terug.
- `melding` komt uit `teksten.fouten` in `public/teksten.js`. De UI toont elke fout als `Bericht <n>, veld <veld>: <melding>`.

| Regel | Melding uit `teksten.fouten` |
|---|---|
| Geen geldige JSON | `geenJson` |
| Leeg bestand | `leeg` |
| Verplicht veld ontbreekt | `ontbreekt(veld)` |
| Meer dan 20 berichten | `teVeel(n)` |
| Dubbel `prNummer` | `dubbelNummer(nr)` |
| Verkeerde `bronUrl` | `verkeerdeUrl(repository, nr)` |
| Onbekende `status` | `onbekendeStatus(waarde)` |
| `gemergdOp` buiten de periode | `buitenPeriode` |
| Verkeerd type of ongeldige tijd | `verkeerdType(veld)` |
| `periode.van` ligt na `periode.tot` | `periodeOmgedraaid` |

## Voorbeeld

Zie `testdata/voorbeeld.json`: drie geldige berichten volgens dit contract.
