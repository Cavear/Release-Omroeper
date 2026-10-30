/**
 * Kleine statische webserver voor de UI-tests: serveert public/ op http://localhost:4173/.
 * Geen afhankelijkheden, zodat hij ook in de CI zonder XAMPP werkt.
 * Gebruik: node scripts/serve.js  (poort aanpassen met PORT=...)
 * @module serve
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAP = fileURLToPath(new URL('../public/', import.meta.url));
const POORT = Number(process.env.PORT ?? 4173);

/** Content-types van de bestanden in public/. */
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

createServer(async (verzoek, antwoord) => {
  const pad = decodeURIComponent(new URL(verzoek.url, 'http://localhost').pathname);
  const bestand = normalize(join(MAP, pad.endsWith('/') ? `${pad}index.html` : pad));
  // Nooit buiten public/ lezen.
  if (!bestand.startsWith(MAP.endsWith(sep) ? MAP : MAP + sep)) {
    antwoord.writeHead(403).end();
    return;
  }
  try {
    const inhoud = await readFile(bestand);
    antwoord.writeHead(200, { 'Content-Type': TYPES[extname(bestand)] ?? 'application/octet-stream' }).end(inhoud);
  } catch {
    antwoord.writeHead(404).end('Niet gevonden');
  }
}).listen(POORT, () => console.log(`public/ op http://localhost:${POORT}/`));
