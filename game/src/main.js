// main.js — boot, game loop fixed-step, state machine, skor + combo + hati.
import {
  CANVAS_W, CANVAS_H, NIGHT_SECONDS, MAX_HEARTS, NOODLE_COOK_SECONDS,
} from './config.js';
import { mulberry32, makeRain, updateRain, updatePopups, addPopup, sfx } from './fx.js';
import {
  spawnTicket, updateTickets, activeTicket, ticketPay, spawnIntervalForHour,
} from './orders.js';
import {
  clickBin, chopHit, clickBroth, startNoodles, pullNoodles, updatePot,
} from './kitchen.js';
import { addToBowl, trashBowl, bowlReady } from './bowl.js';
import { renderWorld } from './render.js';
import { attachInput } from './input.js';

export function createWorld(seed) {
  const rng = mulberry32(seed >>> 0);
  return {
    seed: seed >>> 0,
    rng,
    state: 'title',
    paused: false,
    time: 0,
    money: 0,
    served: 0,
    bestCombo: 0,
    combo: 0,
    hearts: MAX_HEARTS,
    tickets: [],
    activeId: null,
    spawnTimer: 2.0,
    pot: { state: 'idle', t: 0, dur: NOODLE_COOK_SECONDS, win: [0.42, 0.62], firmness: 'futsu', grade: null },
    hand: null,
    chop: null,
    bowl: { layers: [], spoiled: false, errorT: 0, noodleGrade: null, servedFlash: 0 },
    popups: [],
    rain: makeRain(rng, 90),
    over: null,
    fxT: 0,
  };
}

function resetWorld(world) {
  const fresh = createWorld(world.seed);
  for (const k of Object.keys(fresh)) world[k] = fresh[k];
  world.state = 'play';
}

export function startGame(world) {
  resetWorld(world);
  spawnTicket(world);
  sfx('bell');
}

export function serveBowl(world) {
  if (world.state !== 'play' || world.paused) return false;
  if (!bowlReady(world)) {
    addPopup(world, 605, 240, 'Belum lengkap!', '#d94f3d');
    sfx('error');
    return false;
  }
  const ticket = activeTicket(world);
  const pay = ticketPay(ticket, world.bowl.noodleGrade || 'soggy', world.combo);
  world.money += pay;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  addPopup(world, 850, 220, '+' + pay + ' ¥', '#f2c14e');
  if (world.bowl.noodleGrade === 'perfect') addPopup(world, 605, 200, 'PERFECT!', '#7bc96f');
  sfx('serve');
  sfx('bell');
  world.bowl.servedFlash = 1.2;
  world.bowl.layers = [];
  world.bowl.noodleGrade = null;
  world.bowl.spoiled = false;
  world.tickets = world.tickets.filter((t) => t.id !== ticket.id);
  world.activeId = world.tickets.length ? world.tickets[0].id : null;
  return true;
}

// Satu langkah simulasi tetap (1/60 dtk). Dipakai loop dan mode screenshot.
export function advanceWorld(world, dt) {
  world.fxT += dt;
  updateRain(world.rain, dt, world.rng);
  updatePopups(world, dt);
  if (world.bowl.errorT > 0) world.bowl.errorT -= dt;
  if (world.bowl.servedFlash > 0) world.bowl.servedFlash -= dt;
  if (world.state !== 'play' || world.paused) return;

  world.time += dt;
  if (world.time >= NIGHT_SECONDS) {
    world.state = 'over';
    world.over = { reason: 'closed' };
    return;
  }

  // Spawn tiket; jam 23+ kadang ganda.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    const hour = Math.min(5, Math.floor(world.time / 40));
    spawnTicket(world);
    if (hour >= 5 && world.rng() < 0.45) spawnTicket(world);
    world.spawnTimer = spawnIntervalForHour(hour) * (0.85 + world.rng() * 0.3);
  }

  updatePot(world, dt);
  updateTickets(world, dt);
  if (world.over) world.state = 'over';
}

function actionsFor(world) {
  return {
    start: () => startGame(world),
    restart: () => startGame(world),
    togglePause: () => { world.paused = !world.paused; },
    pickBin: (i) => clickBin(world, i),
    chop: () => chopHit(world),
    pourBroth: (i) => clickBroth(world, i),
    startNoodles: () => startNoodles(world),
    pullNoodles: () => pullNoodles(world),
    addToBowl: () => addToBowl(world),
    serve: () => serveBowl(world),
    trash: () => trashBowl(world),
  };
}

function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(location.search);
  const seedParam = Number(params.get('seed') || '1');
  const seed = Number.isFinite(seedParam) ? seedParam : 1;
  const world = createWorld(seed);
  attachInput(canvas, world, actionsFor(world));

  const shot = params.get('shot');
  if (shot) {
    // Mode screenshot deterministik: bangun scene lalu gambar satu frame.
    import('./shots.js').then((shots) => {
      shots.buildShotScene(world, shot);
      renderWorld(ctx, world);
    });
    return;
  }

  // Loop permainan: fixed-step 60 Hz.
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= STEP) {
      advanceWorld(world, STEP);
      acc -= STEP;
    }
    renderWorld(ctx, world);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
