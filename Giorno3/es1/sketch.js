let pg;
let a = 0;

function setup() {
  createCanvas(400, 400);
  pg = createGraphics(400, 400);

  pg.textFont("Helvetica");
  pg.textSize(36);
  pg.textAlign(CENTER, CENTER);
}

function draw() {
  pg.background(220);
  pg.fill(255, 0, 0);
  pg.text("GR", pg.width / 2, pg.height / 2);

  background(220);

  push();
  translate(width / 2, height / 2);
  rotate(a);
  imageMode(CENTER);
  image(pg, 0, 0, width, height);
  pop();

  a += 0.02;
}
