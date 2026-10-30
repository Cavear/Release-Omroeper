# Contract: journaal-concept.json

Dit bestand is de overdracht tussen de MCP-route (skill `/journaal`) en de webapp. De generator van de testdata en de import in de app gebruiken allebei dit contract. Verandert het formaat, pas dan eerst dit document aan.

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
| `berichten` | lijst | ja | De nieuwsberichten, maximaal 5 |

### Per bericht

| Veld | Type | Verplicht | Betekenis |
|---|---|---|---|
| `prNummer` | geheel getal > 0 | ja | Nummer van de gemergde pull request |
| `bronUrl` | tekst (URL) | ja | Link naar de pull request |
| `origineleTitel` | tekst | ja | De titel van de PR, ongewijzigd |
| `gemergdOp` | ISO 8601-tijd | nee | Moment van mergen |
| `kop` | tekst | ja | De licht komische kop; de grap zit hier, nooit over personen |
| `uitleg` | tekst | ja | Zakelijke uitleg van wat er veranderd is |
| `voorWie` | tekst | nee | Voor wie de wijziging van belang is; ontbreekt hij, dan toont de app *Voor: nog onbekend* |
| `status` | tekst | ja | `concept`, `meer-info-nodig`, `goedgekeurd` of `uitgesloten` |
| `publicatiestatus` | tekst | nee | Altijd `niet gecontroleerd` zolang een mens het bericht niet heeft nagelopen |

## Statussen

| Status | Betekenis | In de uitzending? |
|---|---|---|
| `concept` | Door Claude geschreven, nog niet nagekeken | nee |
| `meer-info-nodig` | De PR geeft te weinig informatie voor een goede uitleg | nee |
| `goedgekeurd` | Nagekeken en goed bevonden door de redactie | ja |
| `uitgesloten` | Komt bewust niet in het journaal | nee |

## Validatieregels bij import

1. Het bestand is geldige JSON en niet leeg.
2. `repository`, `periode` (met `van` en `tot`) en `berichten` zijn aanwezig.
3. Per bericht zijn `prNummer`, `bronUrl`, `origineleTitel`, `kop`, `uitleg` en `status` aanwezig. Tekstvelden zijn niet leeg.
4. Er zijn maximaal 5 berichten.
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
- `veld` is de naam van het veld, bijvoorbeeld `bronUrl` of `periode.van`.
- `melding` komt uit `teksten.fouten` in `public/teksten.js`. De UI toont elke fout als `Bericht <n>, veld <veld>: <melding>`.

| Regel | Melding uit `teksten.fouten` |
|---|---|
| Geen geldige JSON | `geenJson` |
| Leeg bestand | `leeg` |
| Verplicht veld ontbreekt | `ontbreekt(veld)` |
| Meer dan 5 berichten | `teVeel(n)` |
| Dubbel `prNummer` | `dubbelNummer(nr)` |
| Verkeerde `bronUrl` | `verkeerdeUrl(nr)` |
| Onbekende `status` | `onbekendeStatus(waarde)` |
| `gemergdOp` buiten de periode | `buitenPeriode` |
| Verkeerd type, ongeldige tijd of `van` na `tot` | `verkeerdType(veld)`: bestaat nog niet, wordt toegevoegd aan `teksten.js` in de stap waarin `valideerConcept` wordt gebouwd |

## Voorbeeld

Zie `testdata/voorbeeld.json`: drie geldige berichten volgens dit contract.
