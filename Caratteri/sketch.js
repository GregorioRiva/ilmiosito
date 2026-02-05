let pg

let state = "disturb" // disturb | easeToStop | stop | easeToDisturb
let stateStart = 0

const DUR_DISTURB = 2500
const DUR_STOP = 900
const DUR_EASE = 700

function setup() {
  createCanvas(400, 400)
  pixelDensity(1)

  pg = createGraphics(width, height)
  pg.pixelDensity(1)
  pg.textFont("sans-serif")
  pg.textAlign(CENTER, CENTER)
  pg.noStroke()

  noiseSeed(2)
  stateStart = millis()
}

function draw() {
  background(0)

  // testo pulito nel buffer
  pg.background(0)
  pg.fill(255)
  pg.textSize(180)
  pg.text("GR", width / 2, height / 2 + 6)

  // tempo nello stato
  let elapsed = millis() - stateStart

  // macchina a stati
  if (state === "disturb" && elapsed > DUR_DISTURB) {
    state = "easeToStop"
    stateStart = millis()
  } else if (state === "easeToStop" && elapsed > DUR_EASE) {
    state = "stop"
    stateStart = millis()
  } else if (state === "stop" && elapsed > DUR_STOP) {
    state = "easeToDisturb"
    stateStart = millis()
  } else if (state === "easeToDisturb" && elapsed > DUR_EASE) {
    state = "disturb"
    stateStart = millis()
  }

  // calcolo amp dinamica (fade)
  let ampMax = 55
  let amp = ampMax

  if (state === "easeToStop") {
    let p = elapsed / DUR_EASE // 0..1
    amp = lerp(ampMax, 0, easeInOut(p))
  } else if (state === "stop") {
    amp = 0
  } else if (state === "easeToDisturb") {
    let p = elapsed / DUR_EASE
    amp = lerp(0, ampMax, easeInOut(p))
  }

  // se amp è 0: mostra pulito
  if (amp < 0.5) {
    image(pg, 0, 0)
    return
  }

  // disturbo a linee orizzontali
  let sliceH = 3
  let freq = 0.03
  let t = frameCount * 0.04

  for (let y = 0; y < height; y += sliceH) {
    let n = noise(y * freq, t)
    let dx = map(n, 0, 1, -amp, amp)

    dx *= (y < height / 2) ? -1 : 1

    image(pg, dx, y, width, sliceH, 0, y, width, sliceH)
  }
}

// easing morbido
function easeInOut(p) {
  p = constrain(p, 0, 1)
  return p < 0.5 ? 2 * p * p : 1 - pow(-2 * p + 2, 2) / 2
}
