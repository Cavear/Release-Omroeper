/**
 * Achtergrondmuziek voor de uitzending: een eigen, vrolijke mars in de stijl van een bioscoopjournaal uit de jaren vijftig.
 * Er is geen geluidsbestand: de browser speelt de partituur live af met de Web Audio API.
 * Koper (melodie), tuba en naslag (oem-pa) en een snaredrum klinken door een smalle "oude radio"-filter, met plaatgekraak erbij.
 * @module muziek
 */

/** Tempo van de mars in tellen (kwartnoten) per minuut. */
export const TEMPO = 120;

/** Duur van één achtste noot in seconden. */
const ACHTSTE = 60 / TEMPO / 2;

/** Aantal achtsten in één maat (2/4). */
export const MAAT = 4;

/** Volume van de muziek als geheel; laag, want het is achtergrond. */
const VOLUME = 0.16;

/** Hoe ver vooruit de planner noten inplant (s) en hoe vaak hij kijkt (ms). */
const VOORUIT = 0.2;
const PLANNER_TIK = 25;

/** Fade-in en fade-out in seconden. */
const FADE = 0.6;

/**
 * Akkoorden per maat: grondtoon en kwint voor de tuba, en de naslag (drie tonen) voor de oem-pa.
 * Tonen zijn MIDI-nummers (60 = C4).
 * @type {Record<string, { grond: number, kwint: number, naslag: number[] }>}
 */
const AKKOORDEN = {
  F: { grond: 41, kwint: 48, naslag: [57, 60, 65] },
  Bes: { grond: 46, kwint: 41, naslag: [58, 62, 65] },
  C7: { grond: 36, kwint: 43, naslag: [58, 60, 64] },
  G7: { grond: 43, kwint: 50, naslag: [59, 62, 65] },
};

/**
 * De partituur: 16 maten in F groot. Per maat het akkoord en de melodie als [toon, duur in achtsten];
 * toon null is een rust. Roffel: een snaredrumroffel op de laatste tel, als aanloop naar de volgende frase.
 * @type {{ akkoord: keyof typeof AKKOORDEN, melodie: [number | null, number][], roffel?: boolean }[]}
 */
export const PARTITUUR = [
  // A: fanfare
  { akkoord: 'F', melodie: [[72, 1], [77, 1], [81, 1], [77, 1]] },
  { akkoord: 'F', melodie: [[72, 1.5], [74, 0.5], [72, 1], [69, 1]] },
  { akkoord: 'C7', melodie: [[70, 1], [72, 1], [76, 1], [79, 1]] },
  { akkoord: 'F', melodie: [[77, 3], [null, 1]] },
  { akkoord: 'Bes', melodie: [[74, 1], [77, 1], [74, 1], [70, 1]] },
  { akkoord: 'F', melodie: [[72, 1], [69, 1], [65, 1], [69, 1]] },
  { akkoord: 'C7', melodie: [[67, 1], [72, 1], [76, 1], [79, 1]] },
  { akkoord: 'F', melodie: [[77, 1], [72, 1], [77, 2]], roffel: true },
  // B: trio
  { akkoord: 'Bes', melodie: [[74, 1.5], [72, 0.5], [70, 1], [74, 1]] },
  { akkoord: 'Bes', melodie: [[77, 2], [74, 2]] },
  { akkoord: 'F', melodie: [[72, 1.5], [70, 0.5], [69, 1], [72, 1]] },
  { akkoord: 'F', melodie: [[77, 2], [81, 2]] },
  { akkoord: 'G7', melodie: [[79, 1], [77, 1], [74, 1], [71, 1]] },
  { akkoord: 'C7', melodie: [[72, 1], [76, 1], [79, 1], [82, 1]] },
  { akkoord: 'F', melodie: [[81, 1.5], [79, 0.5], [77, 1], [72, 1]] },
  { akkoord: 'C7', melodie: [[76, 1], [74, 1], [72, 2]], roffel: true },
];

/**
 * De toestand van de speler. `ctx` blijft bestaan na de eerste start; `aan` is de keuze van de gebruiker (dempknop).
 * @type {{ ctx: AudioContext | null, uit: GainNode | null, ruis: AudioBuffer | null, kraak: AudioBufferSourceNode | null,
 *   klok: number | null, maat: number, volgendeMaat: number, speelt: boolean, aan: boolean }}
 */
const speler = { ctx: null, uit: null, ruis: null, kraak: null, klok: null, maat: 0, volgendeMaat: 0, speelt: false, aan: true };

/**
 * Zet een MIDI-toon om in een frequentie.
 * @param {number} toon
 * @returns {number} frequentie in Hz
 */
function frequentie(toon) {
  return 440 * 2 ** ((toon - 69) / 12);
}

/**
 * Geeft aan of deze browser de Web Audio API heeft.
 * @returns {boolean}
 */
export function kanMuziek() {
  return typeof window !== 'undefined' && 'AudioContext' in window;
}

/**
 * Maakt bij de eerste start de AudioContext en de "oude radio"-keten: highpass en lowpass, zodat het klinkt als een luidspreker uit 1955.
 * Moet vanuit een klik gebeuren; anders houdt de browser het geluid tegen.
 */
function maakKeten() {
  const ctx = new AudioContext();
  const uit = ctx.createGain();
  uit.gain.value = 0;
  const laag = ctx.createBiquadFilter();
  laag.type = 'highpass';
  laag.frequency.value = 220;
  const hoog = ctx.createBiquadFilter();
  hoog.type = 'lowpass';
  hoog.frequency.value = 3400;
  uit.connect(laag).connect(hoog).connect(ctx.destination);

  // Eén seconde witte ruis, voor de snaredrum en het plaatgekraak.
  const ruis = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = ruis.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

  Object.assign(speler, { ctx, uit, ruis });
}

/**
 * Start het plaatgekraak: zacht gesis met af en toe een tik, als een lus van twee seconden.
 */
function startKraak() {
  const { ctx } = speler;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const tik = Math.random() < 0.0004 ? (Math.random() * 2 - 1) * 0.9 : 0;
    data[i] = tik + (Math.random() * 2 - 1) * 0.015;
  }
  const bron = ctx.createBufferSource();
  bron.buffer = buffer;
  bron.loop = true;
  const volume = ctx.createGain();
  volume.gain.value = 0.35;
  bron.connect(volume).connect(speler.uit);
  bron.start();
  speler.kraak = bron;
}

/**
 * Speelt één kopertoon: twee licht ontstemde zaagtanden door een filter dat even opengaat, zoals de aanzet van een trompet.
 * @param {number} toon MIDI-toon
 * @param {number} start tijdstip in de AudioContext (s)
 * @param {number} duur in seconden
 * @param {number} sterkte 0 t/m 1
 */
function speelKoper(toon, start, duur, sterkte) {
  const { ctx } = speler;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(700, start);
  filter.frequency.linearRampToValueAtTime(2600, start + 0.04);
  filter.frequency.exponentialRampToValueAtTime(1300, start + Math.max(duur, 0.1));
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(sterkte, start + 0.02);
  env.gain.linearRampToValueAtTime(sterkte * 0.7, start + 0.1);
  env.gain.setValueAtTime(sterkte * 0.7, start + duur * 0.85);
  env.gain.linearRampToValueAtTime(0, start + duur);
  filter.connect(env).connect(speler.uit);
  for (const ontstemming of [-6, 6]) {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequentie(toon);
    osc.detune.value = ontstemming;
    osc.connect(filter);
    osc.start(start);
    osc.stop(start + duur + 0.02);
  }
}

/**
 * Speelt één tubatoon: een driehoeksgolf, kort en rond.
 * @param {number} toon MIDI-toon
 * @param {number} start tijdstip (s)
 */
function speelTuba(toon, start) {
  const { ctx } = speler;
  const duur = ACHTSTE * 0.8;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = frequentie(toon);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, start);
  env.gain.linearRampToValueAtTime(0.9, start + 0.015);
  env.gain.exponentialRampToValueAtTime(0.01, start + duur);
  osc.connect(env).connect(speler.uit);
  osc.start(start);
  osc.stop(start + duur + 0.02);
}

/**
 * Speelt de snaredrum: een kort pakketje gefilterde ruis.
 * @param {number} start tijdstip (s)
 * @param {number} sterkte 0 t/m 1
 */
function speelSnare(start, sterkte) {
  const { ctx } = speler;
  const bron = ctx.createBufferSource();
  bron.buffer = speler.ruis;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2200;
  filter.Q.value = 0.8;
  const env = ctx.createGain();
  env.gain.setValueAtTime(sterkte, start);
  env.gain.exponentialRampToValueAtTime(0.01, start + 0.09);
  bron.connect(filter).connect(env).connect(speler.uit);
  bron.start(start, Math.random() * 0.5);
  bron.stop(start + 0.1);
}

/**
 * Plant één maat in: melodie, tuba op 1 en 3, naslag en snare op de tweede helft van elke tel, en zo nodig een roffel.
 * @param {number} index maat in PARTITUUR
 * @param {number} start tijdstip van de eerste achtste (s)
 */
function planMaat(index, start) {
  const maat = PARTITUUR[index];
  const akkoord = AKKOORDEN[maat.akkoord];

  let positie = 0;
  for (const [toon, duur] of maat.melodie) {
    if (toon !== null) speelKoper(toon, start + positie * ACHTSTE, duur * ACHTSTE * 0.92, positie === 0 ? 0.32 : 0.26);
    positie += duur;
  }

  speelTuba(akkoord.grond, start);
  speelTuba(akkoord.kwint, start + 2 * ACHTSTE);
  for (const achtste of [1, 3]) {
    const t = start + achtste * ACHTSTE;
    for (const toon of akkoord.naslag) speelKoper(toon, t, ACHTSTE * 0.45, 0.06);
    speelSnare(t, 0.25);
  }

  if (maat.roffel) {
    // Een roffel van zestienden over de laatste tel, aanzwellend.
    for (let i = 0; i < 4; i += 1) speelSnare(start + (2 + i / 2) * ACHTSTE, 0.18 + i * 0.07);
  }
}

/** Plant steeds de maten in die binnen het venster VOORUIT beginnen; de partituur herhaalt zich. */
function planner() {
  const { ctx } = speler;
  while (speler.volgendeMaat < ctx.currentTime + VOORUIT) {
    planMaat(speler.maat, speler.volgendeMaat);
    speler.volgendeMaat += MAAT * ACHTSTE;
    speler.maat = (speler.maat + 1) % PARTITUUR.length;
  }
}

/**
 * Zet het volume met een korte overgang.
 * @param {number} doel 0 t/m 1
 */
function fade(doel) {
  const { ctx, uit } = speler;
  uit.gain.cancelScheduledValues(ctx.currentTime);
  uit.gain.setValueAtTime(uit.gain.value, ctx.currentTime);
  uit.gain.linearRampToValueAtTime(doel, ctx.currentTime + FADE);
}

/**
 * Start de mars vanaf de eerste maat, met een fade-in, als de gebruiker de muziek aan heeft staan.
 * Roep dit aan vanuit een klik (Start uitzending); de browser staat geluid pas toe na een handeling van de gebruiker.
 */
export function startMuziek() {
  if (!kanMuziek()) return;
  if (!speler.ctx) maakKeten();
  speler.speelt = true;
  if (speler.aan) begin();
}

/** Laat de mars echt klinken: hervat de AudioContext, start gekraak en planner en fade in. */
function begin() {
  const { ctx } = speler;
  ctx.resume();
  if (!speler.kraak) startKraak();
  if (speler.klok === null) {
    speler.maat = 0;
    speler.volgendeMaat = ctx.currentTime + 0.1;
    speler.klok = setInterval(planner, PLANNER_TIK);
    planner();
  }
  fade(VOLUME);
}

/** Fade uit en zet daarna de planner, het gekraak en de AudioContext stil. */
function eindig() {
  const { ctx } = speler;
  if (!ctx) return;
  fade(0);
  clearInterval(speler.klok);
  speler.klok = null;
  const kraak = speler.kraak;
  speler.kraak = null;
  setTimeout(() => {
    kraak?.stop();
    if (speler.klok === null) ctx.suspend();
  }, FADE * 1000 + 50);
}

/** Stopt de muziek met een fade-out (Uitzending sluiten). */
export function stopMuziek() {
  speler.speelt = false;
  eindig();
}

/**
 * Zet de muziek aan of uit (dempknop). De keuze blijft gelden voor de volgende uitzending in deze sessie.
 * @param {boolean} aan
 */
export function zetMuziek(aan) {
  speler.aan = aan;
  if (!speler.speelt || !speler.ctx) return;
  if (aan) begin();
  else eindig();
}

/**
 * Geeft aan of de gebruiker de muziek aan heeft staan.
 * @returns {boolean}
 */
export function muziekStaatAan() {
  return speler.aan;
}

// In een ander tabblad (bijvoorbeeld na Bron openen) pauzeert de muziek; terug in dit tabblad speelt hij verder.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!speler.ctx || !speler.speelt || !speler.aan) return;
    if (document.visibilityState === 'hidden') speler.ctx.suspend();
    else speler.ctx.resume();
  });
}
