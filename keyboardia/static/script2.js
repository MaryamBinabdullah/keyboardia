// setup

var width = window.innerWidth;

var height = document.body.scrollHeight;

// create canvas2

const canvas2 = document.getElementById("myCanvas");

const ctx2 = canvas2.getContext("2d");

canvas2.width = width;

canvas2.height = height;

// print some info

console.log("Page height:", height);

console.log(ctx2);

// draw test rect in the middle of the screen

// ctx2.fillRect(width/2 - 25, height/2 - 25, 50, 50);

// define classes

class Particle {
  constructor(effect) {
    this.effect = effect;

    this.width = 100;

    this.height = 100;

    this.radius = 40;

    this.x = this.radius + Math.random() * (width - this.radius * 2);

    this.y = height + this.radius * 2 + 10;

    this.speed = 1.1 + Math.random() / 4;

    this.dx = 0;

    this.dy = -1;

    this.color =
      Math.random() >= 0.5
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(20, 0, 20, 0.04)";

    this.rotation = 0;

    this.rotate_speed = 1.9;
  }

  draw() {
    ctx2.save(); // Save the current transformation state

    ctx2.translate(this.x + this.radius / 2, this.y + this.radius / 2); // Move the origin to the center of the square

    ctx2.rotate(deg2rad(this.rotation)); // Rotate the canvas2 around the center of the square

    ctx2.fillStyle = this.color;

    ctx2.fillRect(-this.radius / 2, -this.radius / 2, this.radius, this.radius); // Draw the square with an off

    ctx2.restore(); // Restore the previous transformation state

    //         ctx2.beginPath();

    //         ctx2.arc(this.x, this.y, this.radius, 0, deg2rad(360));

    // //         ctx2.fill();

    //         ctx2.stroke();
  }

  update() {
    // move x

    this.x += this.speed * this.dx;

    // move y

    this.y += this.speed * this.dy;

    // rotate

    this.rotation += this.rotate_speed;

    this.rotate = this.rotation % 360;

    // inflate

    this.radius += 0.07;

    this.rotate_speed = 120 / this.radius / 4;

    // kill condition

    if (this.y < -this.radius - 100)
      this.effect.particles = this.effect.particles.filter((p) => p != this);

    console.log(this.effect.particles.length);
  }
}

class Effect {
  constructor() {
    this.particles = [];

    this.N = 1; // how many objects will createPs make when called
  }

  createPs() {
    if (!document.hidden) {
      for (let i = 0; i < this.N; i++) {
        this.particles.push(new Particle(this));
      }
    }
  }

  update() {
    // draw all particles

    this.particles.forEach((p) => {
      p.draw();

      p.update();
    });
  }
}

// define functions

function deg2rad(deg) {
  // convertes degrees into radian

  return (deg * Math.PI) / 180;
}

function update_size() {
  // updates width and hight

  // recalculate width and height

  width = window.innerWidth;

  height = document.body.scrollHeight;

  canvas2.width = width;

  canvas2.height = height;

  console.log("okay", width, "owo", height);
}

// event handlers

window.addEventListener("resize", update_size);

// objects

const effect = new Effect();

// the animation loop ( its like a game loop that updates every frame )

function update() {
  // setting some context values

  ctx2.fillStyle = "white";

  ctx2.strokeStyle = "pink";

  ctx2.lineWidth = 10;

  // clearing the screen

  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

  effect.update();

  requestAnimationFrame(update);
}

// timers

setInterval(effect.createPs.bind(effect), 3300); // default is 3300

update();
