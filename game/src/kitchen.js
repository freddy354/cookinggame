// kitchen.js — counter bahan: bin, cincang, panci kuah, dan panci mie.
import {
  TOPPINGS, BROTHS, FIRMNESS, NOODLE_COOK_SECONDS, NOODLE_OK_MARGIN,
  COLORS, CANVAS_W,
} from './config.js';
import { addPopup, sfx } from './fx.js';
import { activeTicket } from './orders.js';

export const BIN_Y = 452;
export const BIN_W = 96;
export const BIN_H = 76;

export function binRect(i) {
  return { x: 18 + i * 106, y: BIN_Y, w: BIN_W, h: BIN_H };
}
export function brothRect(i) {
  return { x: 330 + i * 62, y: 296, w: 52, h: 52 };
}
export function potRect() {
  return { x: 128, y: 246, w: 150, h: 96 };
}

// Klik bin: topping langsung ke tangan; negi masuk mode cincang dulu.
export function clickBin(world, i) {
  const top = TOPPINGS[i];
  if (!top) return;
  if (top.chop) {
    world.chop = { id: top.id, hits: 0, needed: 3 };
    world.hand = null;
    addPopup(world, 480, 440, 'Cincang negi: tekan SPACE 3x!', '#79c76d');
    sfx('pick');
    return;
  }
  world.hand = { kind: 'topping', id: top.id };
  world.chop = null;
  sfx('pick');
}

// SPACE saat mode cincang: tiap tekan 1 cincangan; selesai -> negi ke tangan.
export function chopHit(world) {
  if (!world.chop) return false;
  world.chop.hits += 1;
  sfx('chop');
  if (world.chop.hits >= world.chop.needed) {
    world.hand = { kind: 'topping', id: world.chop.id };
    world.chop = null;
    addPopup(world, 480, 440, 'Negi tercincang!', '#79c76d');
  }
  return true;
}

// Klik panci kuah: tuang langsung sebagai lapisan pertama mangkuk.
export function clickBroth(world, i) {
  const broth = BROTHS[i];
  if (!broth) return;
  if (world.bowl.layers.length > 0) {
    addPopup(world, 610, 240, 'Kuah harus pertama!', '#d94f3d');
    sfx('error');
    return;
  }
  world.bowl.layers.push({ type: 'broth', id: broth.id });
  sfx('pour');
}

// Klik panci mie: mulai merebus; jendela hijau ikut kekerasan tiket aktif.
export function startNoodles(world) {
  if (world.pot.state === 'cooking') return;
  const ticket = activeTicket(world);
  const firm = ticket ? FIRMNESS[ticket.firmness] : FIRMNESS.futsu;
  const narrow = 1 - 0.09 * Math.min(5, Math.floor(world.time / 40));
  const mid = (firm.win[0] + firm.win[1]) / 2;
  const half = ((firm.win[1] - firm.win[0]) / 2) * narrow;
  world.pot = {
    state: 'cooking',
    t: 0,
    dur: NOODLE_COOK_SECONDS,
    win: [mid - half, mid + half],
    firmness: ticket ? ticket.firmness : 'futsu',
    grade: null,
  };
  sfx('boil');
}

// E: tarik mie. Di jendela hijau = perfect, dekat = ok, jauh/lewat = soggy.
export function pullNoodles(world) {
  const pot = world.pot;
  if (pot.state !== 'cooking' && pot.state !== 'done') return null;
  const p = Math.min(1, pot.t / pot.dur);
  let grade;
  if (pot.state === 'done') grade = 'soggy';
  else if (p >= pot.win[0] && p <= pot.win[1]) grade = 'perfect';
  else if (p >= pot.win[0] - NOODLE_OK_MARGIN && p <= pot.win[1] + NOODLE_OK_MARGIN) grade = 'ok';
  else grade = 'soggy';
  world.hand = { kind: 'noodle', grade };
  world.pot = { state: 'idle', t: 0, dur: NOODLE_COOK_SECONDS, win: pot.win, firmness: pot.firmness, grade: null };
  if (grade === 'perfect') sfx('perfect');
  else sfx('pick');
  return grade;
}

export function updatePot(world, dt) {
  const pot = world.pot;
  if (pot.state !== 'cooking') return;
  pot.t += dt;
  if (pot.t >= pot.dur) {
    pot.state = 'done';
    pot.t = pot.dur;
  }
}

// ---- gambar counter + kompor ----
export function drawKitchen(ctx, world) {
  ctx.save();
  // Meja kayu bawah.
  ctx.fillStyle = COLORS.counter;
  ctx.fillRect(0, 440, CANVAS_W, 100);
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(0, 440, CANVAS_W, 6);

  // Enam bin bahan.
  TOPPINGS.forEach((top, i) => {
    const r = binRect(i);
    const inHand = world.hand && world.hand.kind === 'topping' && world.hand.id === top.id;
    ctx.fillStyle = inHand ? '#a8b8d8' : '#3a2c1e';
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = inHand ? COLORS.gold : '#00000066';
    ctx.lineWidth = inHand ? 3 : 1.5;
    ctx.stroke();
    // Isi bin.
    ctx.fillStyle = top.color;
    ctx.beginPath();
    ctx.ellipse(r.x + r.w / 2, r.y + 34, 34, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = top.dark;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(r.x + 20 + k * 14 + ((k * 7) % 9), r.y + 30 + ((k * 11) % 10), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.cream;
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(top.name + (top.chop ? ' *' : ''), r.x + r.w / 2, r.y + r.h - 8);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(top.key, r.x + 12, r.y + 16);
  });

  // Papan cincang (mode cincang negi).
  if (world.chop) {
    const bx = 660, by = 452, bw = 150, bh = 76;
    ctx.fillStyle = '#d9b98a';
    roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.strokeStyle = '#8a6242';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#79c76d';
    for (let k = 0; k < 3; k++) {
      const done = k < world.chop.hits;
      ctx.globalAlpha = done ? 1 : 0.45;
      ctx.fillRect(bx + 18 + k * 42, by + 26, 34, 8);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE x' + (3 - world.chop.hits), bx + bw / 2, by + 62);
  }

  // Tiga panci kuah.
  BROTHS.forEach((b, i) => {
    const r = brothRect(i);
    const cx = r.x + r.w / 2;
    ctx.fillStyle = '#2c2c34';
    ctx.beginPath();
    ctx.ellipse(cx, r.y + 30, 27, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.ellipse(cx, r.y + 26, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Uap kecil.
    ctx.strokeStyle = 'rgba(240,240,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, r.y + 8);
    ctx.quadraticCurveTo(cx - 10, r.y, cx - 6, r.y - 8);
    ctx.moveTo(cx + 6, r.y + 8);
    ctx.quadraticCurveTo(cx + 10, r.y, cx + 6, r.y - 8);
    ctx.stroke();
    ctx.fillStyle = COLORS.cream;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, cx, r.y + r.h - 2);
  });

  // Kompor + panci mie.
  const pr = potRect();
  ctx.fillStyle = '#33333c';
  roundRect(ctx, pr.x - 8, pr.y + 62, pr.w + 16, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#ff7a2e';
  ctx.beginPath();
  ctx.ellipse(pr.x + pr.w / 2, pr.y + 60, 46, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Panci.
  const pcx = pr.x + pr.w / 2;
  ctx.fillStyle = '#4a4a55';
  ctx.beginPath();
  ctx.ellipse(pcx, pr.y + 44, 62, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c8a24a';
  ctx.beginPath();
  ctx.ellipse(pcx, pr.y + 38, 54, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  if (world.pot.state === 'cooking' || world.pot.state === 'done') {
    // Air mendidih: gelembung.
    ctx.fillStyle = '#e8d9a8';
    for (let k = 0; k < 6; k++) {
      const bx = pcx - 40 + ((k * 17 + Math.floor(world.fxT * 7 + k)) % 80);
      const by = pr.y + 38 - ((k * 5 + Math.floor(world.fxT * 11)) % 10);
      ctx.beginPath();
      ctx.arc(bx, by, 3 + (k % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    // Bar masak + jendela hijau.
    const barX = pr.x - 6, barY = pr.y - 18, barW = pr.w + 12, barH = 12;
    ctx.fillStyle = '#22222a';
    roundRect(ctx, barX, barY, barW, barH, 6);
    ctx.fill();
    const w = world.pot.win;
    ctx.fillStyle = '#58a34c';
    ctx.fillRect(barX + w[0] * barW, barY, (w[1] - w[0]) * barW, barH);
    const p = Math.min(1, world.pot.t / world.pot.dur);
    ctx.fillStyle = world.pot.state === 'done' ? COLORS.red : COLORS.cream;
    ctx.fillRect(barX + p * barW - 2, barY - 3, 4, barH + 6);
    ctx.fillStyle = COLORS.cream;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.pot.state === 'done' ? 'KELAMAAN! Tekan E' : 'Tarik mie: E', pcx, barY - 6);
  } else {
    ctx.fillStyle = COLORS.cream;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Klik panci: rebus mie', pcx, pr.y - 6);
  }

  // Tangan: bahan yang sedang dipegang.
  if (world.hand) {
    const label = world.hand.kind === 'noodle'
      ? 'Mie (' + world.hand.grade + ')'
      : toppingLabel(world.hand.id);
    ctx.fillStyle = 'rgba(20,20,40,0.85)';
    roundRect(ctx, 380, 396, 200, 30, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Di tangan: ' + label + ' → klik mangkuk', 480, 416);
  }
  ctx.restore();
}

function toppingLabel(id) {
  const t = TOPPINGS.find((x) => x.id === id);
  return t ? t.name : id;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
