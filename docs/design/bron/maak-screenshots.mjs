/**
 * Maakt van elk frame uit het canvas van Claude Design een PNG in docs/design/.
 * Gebruik: node docs/design/bron/maak-screenshots.mjs
 * De maten en namen komen uit canvas.json van het ontwerp "Release-omroeper – schermen".
 */
import { chromium } from '@playwright/test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const BRON = path.dirname(fileURLToPath(import.meta.url));
const DOEL = path.resolve(BRON, '..');

/** Per frame: bestandsnaam, bronbestand met props, en de maat uit het canvas. */
const FRAMES = [
  { naam: '01-redactie-desktop-1440', bron: 'Main.dc.html', props: '', w: 1440, h: 1240, heel: true },
  { naam: '02-redactie-tablet-768', bron: 'Main.dc.html', props: '', w: 768, h: 1900, heel: true },
  { naam: '03-redactie-mobiel-390', bron: 'Main.dc.html', props: '', w: 390, h: 844 },
  { naam: '04-lege-staat', bron: 'Main.dc.html', props: '?staat=leeg', w: 1440, h: 900 },
  { naam: '05-import-fout', bron: 'Main.dc.html', props: '?staat=fout', w: 1440, h: 1000 },
  { naam: '06-help-paneel', bron: 'Main.dc.html', props: '?help=true', w: 1440, h: 1000 },
  { naam: '07-uitzending-leader', bron: 'Uitzending.dc.html', props: '?frame=leader', w: 1280, h: 720 },
  { naam: '08-uitzending-titelkaart', bron: 'Uitzending.dc.html', props: '?frame=titel', w: 1280, h: 720 },
  { naam: '09-uitzending-nieuwsbericht', bron: 'Uitzending.dc.html', props: '?frame=nieuws', w: 1280, h: 720 },
  { naam: '10-uitzending-eindscherm', bron: 'Uitzending.dc.html', props: '?frame=eind', w: 1280, h: 720 },
  { naam: '11-nieuwsbericht-telefoon-staand', bron: 'Uitzending.dc.html', props: '?frame=nieuws', w: 390, h: 844 },
  { naam: '12-nieuwsbericht-telefoon-liggend', bron: 'Uitzending.dc.html', props: '?frame=nieuws', w: 844, h: 390 },
];

const browser = await chromium.launch();
for (const frame of FRAMES) {
  // Reduced motion, zodat flikkering en lopende balk het screenshot niet laten verschillen.
  const pagina = await browser.newPage({ viewport: { width: frame.w, height: frame.h }, reducedMotion: 'reduce' });
  await pagina.goto(pathToFileURL(path.join(BRON, frame.bron)).href + frame.props);
  await pagina.waitForSelector('html[data-klaar="ja"]');
  await pagina.evaluate('document.fonts.ready');
  await pagina.screenshot({ path: path.join(DOEL, `${frame.naam}.png`), fullPage: Boolean(frame.heel) });
  await pagina.close();
  console.log(`${frame.naam}.png`);
}
await browser.close();
