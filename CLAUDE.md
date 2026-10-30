# Release-omroeper

Zet gemergde GitHub-pull requests om in een kort, licht komisch journaal in de stijl van een oud bioscoopjournaal. Zie `readme.md`.

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
