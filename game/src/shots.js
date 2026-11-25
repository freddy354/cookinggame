// shots.js — mode screenshot deterministik (?shot=...&seed=N).
// Tiap scene memainkan aturan asli dari world baru sejumlah langkah tetap
// dengan autopilot sederhana, jadi frame adalah hasil permainan nyata
// dan seed yang sama selalu memberi frame yang sama.
import { createWorld, advanceWorld } from './main.js';
import { spawnTicket, activeTicket } from './orders.js';
import { clickBin, chopHit, clickBroth, startNoodles, pullNoodles } from './kitchen.js';
import { addToBowl } from './bowl.js';

const STEP = 1 / 60;

function advance(world, seconds) {
  const n = Math.round(seconds / STEP);
  for (let i = 0; i < n; i++) advanceWorld(world, STEP);
}

function binIndexFor(id) {
  return ['chashu', 'egg', 'nori', 'negi', 'menma', 'corn'].indexOf(id);
}

function addTopping(world, id) {
  const i = binIndexFor(id);
  clickBin(world, i);
  if (id === 'negi') {
    chopHit(world);
    chopHit(world);
    chopHit(world);
  }
  addToBowl(world);
}

// Rakit mangkuk penuh untuk tiket aktif (tanpa menyajikan).
function buildFullBowl(world) {
  const ticket = activeTicket(world);
  if (!ticket) return;
  clickBroth(world, ['shoyu', 'miso', 'tonkotsu'].indexOf(ticket.broth));
  startNoodles(world);
  // Maju sampai panci masuk jendela hijau, lalu tarik.
  for (let i = 0; i < 400; i++) {
    const pot = world.pot;
    if (pot.state !== 'cooking') break;
    const p = pot.t / pot.dur;
    if (p >= pot.win[0] && p <= pot.win[1]) break;
    advanceWorld(world, STEP);
  }
  pullNoodles(world);
  addToBowl(world);
  for (const id of ticket.toppings) addTopping(world, id);
}

// Rakit setengah: kuah + mie + topping pertama saja.
function buildHalfBowl(world) {
  const ticket = activeTicket(world);
  if (!ticket) return;
  clickBroth(world, ['shoyu', 'miso', 'tonkotsu'].indexOf(ticket.broth));
  startNoodles(world);
  for (let i = 0; i < 400; i++) {
    const pot = world.pot;
    if (pot.state !== 'cooking') break;
    const p = pot.t / pot.dur;
    if (p >= pot.win[0] && p <= pot.win[1]) break;
    advanceWorld(world, STEP);
  }
  pullNoodles(world);
  addToBowl(world);
  addTopping(world, ticket.toppings[0]);
}

export function buildShotScene(world, scene) {
  if (scene === 'start') {
    // Layar judul di atas dapur yang sudah hidup: 2 tiket, bin penuh, mangkuk kosong.
    world.state = 'title';
    spawnTicket(world);
    spawnTicket(world);
    advance(world, 1.5);
    return;
  }

  world.state = 'play';

  if (scene === 'play') {
    // 4 tiket (satu hampir terbakar) + mangkuk setengah terakit + panci mendidih.
    spawnTicket(world);
    spawnTicket(world);
    spawnTicket(world);
    spawnTicket(world);
    world.spawnTimer = 999;
    buildHalfBowl(world);
    // Biarkan tiket pertama hampir terbakar, baru mulai panci kedua.
    advance(world, 34);
    startNoodles(world);
    advance(world, 1.8);
    return;
  }

  if (scene === 'serve') {
    // Mangkuk jadi beruap + lonceng menyala + prompt sajikan + combo.
    world.money = 1240;
    world.served = 7;
    world.combo = 3;
    spawnTicket(world);
    world.spawnTimer = 999;
    buildFullBowl(world);
    advance(world, 0.6);
    return;
  }

  if (scene === 'rush') {
    // Puncak kekacauan jam 23: 5 tiket, satu hampir terbakar, hati tinggal 2.
    world.time = 5 * 40 + 5;
    world.money = 4860;
    world.served = 21;
    world.combo = 4;
    world.hearts = 2;
    spawnTicket(world);
    spawnTicket(world);
    spawnTicket(world);
    spawnTicket(world);
    spawnTicket(world);
    world.spawnTimer = 999;
    buildHalfBowl(world);
    advance(world, 20);
    return;
  }

  // Scene tak dikenal: kembali ke judul.
  world.state = 'title';
}
