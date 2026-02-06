// p5.js — GR glitch + stop + split: G a sinistra, R a destra (scaglionato, lento)
// Responsive: canvas full iframe + testo scala con size

let pgAll, pgG, pgR;

let state = "disturb"; // disturb | easeToStop | stop | splitOut | holdOut | splitIn | easeToDisturb
let stateStart = 0;

// tempi
const DUR_DISTURB   = 2600;
const DUR_EASE      = 900;
const DUR_STOP      = 650;

const DUR_SPLIT     = 2600;
const DUR_HOLD_OUT  = 850;
const DUR_SPLIT_IN  = 2400;

// smoothing glitch
let smoothDX = [];

// parametri dinamici (calcolati in base a canvas)
let TXT_SIZE = 180;
let LETTER_GAP = 132;
let BASE_Y_OFFSET = 0;
let SLICE_H = 5;

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  pixelDensity(1);
  initBuffers();
  noiseSeed(2);
  stateStart = millis();
}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
  initBuffers(); // ricrea buffer e parametri
}

// crea/aggiorna buffer + parametri scalati
function initBuffers() {
  // scala tipografia in base alla dimensione minore
  const s = min(width, height);

  TXT_SIZE = s * 0.62;                 // più grande nel riquadro
  LETTER_GAP = s * 0.46;               // distanza tra G e R
  BASE_Y_OFFSET = s * 0.02;            // micro aggiustamento ottico
  SLICE_H = max(3, floor(s * 0.012));  // strisce proporzionate

  pgAll = createGraphics(width, height);
  pgG   = createGraphics(width, height);
  pgR   = createGraphics(width, height);

  for (const pg of [pgAll, pgG, pgR]) {
    pg.pixelDensity(1);
    pg.textFont("sans-serif");
    pg.textAlign(CENTER, CENTER);
    pg.noStroke();
  }

  smoothDX = new Array(Math.ceil(height / SLICE_H)).fill(0);
}

function draw() {
  background(0);

  // posizioni lettere
  const cx = width / 2;
  const cy = height / 2 + BASE_Y_OFFSET;
  const xG = cx - LETTER_GAP / 2;
  const xR = cx + LETTER_GAP / 2;

  // pgAll: GR su fondo nero
  pgAll.background(0);
  pgAll.fill(255);
  pgAll.textSize(TXT_SIZE);
  pgAll.text("G", xG, cy);
  pgAll.text("R", xR, cy);

  // pgG / pgR: solo lettera su fondo trasparente
  pgG.clear();
  pgG.fill(255);
  pgG.textSize(TXT_SIZE);
  pgG.text("G", xG, cy);

  pgR.clear();
  pgR.fill(255);
  pgR.textSize(TXT_SIZE);
  pgR.text("R", xR, cy);

  let elapsed = millis() - stateStart;

  // macchina a stati
  if (state === "disturb" && elapsed > DUR_DISTURB) {
    state = "easeToStop"; stateStart = millis(); elapsed = 0;
  } else if (state === "easeToStop" && elapsed > DUR_EASE) {
    state = "stop"; stateStart = millis(); elapsed = 0;
  } else if (state === "stop" && elapsed > DUR_STOP) {
    state = "splitOut"; stateStart = millis(); elapsed = 0;
  } else if (state === "splitOut" && elapsed > DUR_SPLIT) {
    state = "holdOut"; stateStart = millis(); elapsed = 0;
  } else if (state === "holdOut" && elapsed > DUR_HOLD_OUT) {
    state = "splitIn"; stateStart = millis(); elapsed = 0;
  } else if (state === "splitIn" && elapsed > DUR_SPLIT_IN) {
    state = "easeToDisturb"; stateStart = millis(); elapsed = 0;
  } else if (state === "easeToDisturb" && elapsed > DUR_EASE) {
    state = "disturb"; stateStart = millis(); elapsed = 0;
  }

  // ampiezza glitch
  const ampMax = min(120, width * 0.22); // scala con schermo
  let amp = ampMax;

  if (state === "easeToStop") {
    amp = lerp(ampMax, 0, easeInOut(elapsed / DUR_EASE));
  } else if (state === "stop" || state === "splitOut" || state === "holdOut" || state === "splitIn") {
    amp = 0;
  } else if (state === "easeToDisturb") {
    amp = lerp(0, ampMax, easeInOut(elapsed / DUR_EASE));
  }

  // stop/split
  if (amp < 0.5) {
    if (state === "splitOut") {
      drawSplitLetters(constrain(elapsed / DUR_SPLIT, 0, 1), "out");
    } else if (state === "holdOut") {
      drawSplitLetters(0.92, "out"); // evita vuoto totale
    } else if (state === "splitIn") {
      drawSplitLetters(constrain(elapsed / DUR_SPLIT_IN, 0, 1), "in");
    } else {
      image(pgAll, 0, 0);
    }
    return;
  }

  // glitch a strisce sul buffer GR completo
  const sliceH = SLICE_H;
  const freqY = 0.012;
  const t = frameCount * 0.018;

  const smoothTime = 0.14;
  const smoothSpace = 0.28;

  function centerMask(y) {
    let d = abs(y - height / 2) / (height / 2);
    return pow(d, 0.65);
  }

  const nSlices = Math.ceil(height / sliceH);
  if (smoothDX.length !== nSlices) smoothDX = new Array(nSlices).fill(0);

  for (let i = 0; i < nSlices; i++) {
    let y = i * sliceH;

    let n1 = noise(y * freqY, t);
    let base = map(n1, 0, 1, -1, 1);

    let n2 = noise(y * freqY * 3.2 + 77.7, t * 1.6);
    let fine = map(n2, 0, 1, -1, 1) * 0.45;

    let target = (base + fine) * amp;

    let m = centerMask(y);
    let s = (y < height / 2) ? -1 : 1;
    target *= lerp(1, s, m);

    target = Math.sign(target) * pow(abs(target), 1.15);

    smoothDX[i] = lerp(smoothDX[i], target, smoothTime);
    if (i > 0) smoothDX[i] = lerp(smoothDX[i], smoothDX[i - 1], smoothSpace);

    image(pgAll, smoothDX[i], y, width, sliceH, 0, y, width, sliceH);
  }
}

// split: G sinistra, R destra (solo laterale, scaglionato, lento)
function drawSplitLetters(g, mode) {
  const sliceH = SLICE_H;
  const nSlices = Math.ceil(height / sliceH);

  const splitAmp = width * 1.45;

  const cascade = 0.95;
  const moveWindow = 0.82;

  const tt = frameCount * 0.010;

  for (let i = 0; i < nSlices; i++) {
    const y = i * sliceH;

    // ORDINE SPARSO (come la tua prova)
    let rnd = noise(i * 0.73 + 91.7);
    rnd = pow(rnd, 2.4);
    let delayOut = lerp(0.05, 0.88, rnd) * cascade;

    let delay = (mode === "out")
      ? delayOut
      : constrain((1 - delayOut) * cascade, 0, 0.98);

    let start = delay;
    let end = constrain(start + moveWindow, 0, 1);

    let local = 0;
    if (g <= start) local = 0;
    else if (g >= end) local = 1;
    else local = (g - start) / (end - start);

    local = easeInOut(local);
    const amount = (mode === "out") ? local : (1 - local);

    const drift = (noise(i * 0.14, tt) - 0.5) * 0.22;

    let weight = 0.62 + 0.38 * noise(i * 0.08 + 33.3, tt * 0.7);
    weight = pow(weight, 1.12);

    const dxG = (-1 + drift) * splitAmp * amount * weight;
    const dxR = ( 1 + drift) * splitAmp * amount * weight;

    image(pgG, dxG, y, width, sliceH, 0, y, width, sliceH);
    image(pgR, dxR, y, width, sliceH, 0, y, width, sliceH);
  }
}

// easing
function easeInOut(p) {
  p = constrain(p, 0, 1);
  return p < 0.5 ? 2 * p * p : 1 - pow(-2 * p + 2, 2) / 2;
}
