// render.js — latar stasiun, HUD (jam, penghasilan, hati, combo), jendela pass,
// lonceng, layar judul, jeda, dan game over.
import { COLORS, CANVAS_W, CANVAS_H } from './config.js';
import { drawTicketRail } from './orders.js';
import { drawKitchen } from './kitchen.js';
import { drawBowl, bowlReady } from './bowl.js';
import { drawRain, drawPopups } from './fx.js';

export function bellRect() {
  return { x: 812, y: 330, w: 70, h: 46 };
}

// Latar: langit malam, jendela hujan, peron, lentera.
export function drawStation(ctx, world) {
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0, COLORS.nightTop);
  g.addColorStop(1, COLORS.nightBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Jendela besar kanan atas dengan hujan di baliknya.
  ctx.fillStyle = '#101a33';
  ctx.fillRect(560, 108, 392, 112);
  ctx.strokeStyle = '#3a2c1e';
  ctx.lineWidth = 6;
  ctx.strokeRect(560, 108, 392, 112);
  ctx.strokeStyle = '#3a2c1e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(756, 108);
  ctx.lineTo(756, 220);
  ctx.moveTo(560, 164);
  ctx.lineTo(952, 164);
  ctx.stroke();
  // Bulan.
  ctx.fillStyle = '#f2e6b8';
  ctx.beginPath();
  ctx.arc(900, 132, 16, 0, Math.PI * 2);
  ctx.fill();
  drawRain(ctx, world.rain);

  // Dinding kayu tengah.
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 220, CANVAS_W, 220);
  ctx.fillStyle = '#2e2115';
  for (let x = 0; x < CANVAS_W; x += 64) ctx.fillRect(x, 220, 3, 220);

  // Lentera gantung (pendek, di atas kompor agar tak menutupi panci).
  for (const lx of [180, 480, 780]) {
    const sway = Math.sin(world.fxT * 0.8 + lx) * 3;
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 220);
    ctx.lineTo(lx + sway, 232);
    ctx.stroke();
    ctx.fillStyle = COLORS.lantern;
    ctx.beginPath();
    ctx.ellipse(lx + sway, 248, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.lanternGlow;
    ctx.beginPath();
    ctx.ellipse(lx + sway, 248, 9, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// HUD kanan atas: jam stasiun, penghasilan, hati, combo.
export function drawHud(ctx, world) {
  ctx.save();
  // Jam stasiun.
  const cx = 585, cy = 42;
  ctx.fillStyle = COLORS.paper;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 3;
  ctx.stroke();
  const mins = world.time * 1.5;
  const hour = 18 + Math.floor(mins / 60);
  const minute = Math.floor(mins % 60);
  const hAng = ((hour % 12) + minute / 60) / 12 * Math.PI * 2 - Math.PI / 2;
  const mAng = (minute / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hAng) * 15, cy + Math.sin(hAng) * 15);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(mAng) * 22, cy + Math.sin(mAng) * 22);
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0'), cx, cy + 46);

  // Penghasilan.
  ctx.fillStyle = COLORS.paper;
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('¥' + world.money.toLocaleString('en-US'), 640, 34);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#cbb98d';
  ctx.fillText('disajikan: ' + world.served, 640, 52);

  // Hati.
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, 700 + i * 30, 74, i < world.hearts ? '#d94f3d' : '#4a4a55');
  }

  // Combo.
  if (world.combo >= 2) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COMBO x' + (1 + 0.1 * world.combo).toFixed(1) + '  (' + world.combo + ')', 790, 34);
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  ctx.bezierCurveTo(x - 10, y - 2, x - 5, y - 10, x, y - 4);
  ctx.bezierCurveTo(x + 5, y - 10, x + 10, y - 2, x, y + 8);
  ctx.fill();
  ctx.restore();
}

// Jendela pass + lonceng di kanan jauh.
export function drawPassWindow(ctx, world) {
  ctx.save();
  const ready = bowlReady(world);
  ctx.fillStyle = '#f2c14e';
  ctx.globalAlpha = ready && Math.floor(world.fxT * 4) % 2 === 0 ? 0.85 : 0.35;
  ctx.fillRect(760, 236, 180, 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1c2438';
  ctx.fillRect(760, 244, 180, 84);
  ctx.strokeStyle = COLORS.woodLight;
  ctx.lineWidth = 4;
  ctx.strokeRect(760, 244, 180, 84);
  ctx.fillStyle = '#cbb98d';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('— PASS —', 850, 264);
  if (world.bowl.servedFlash > 0) {
    ctx.fillStyle = '#f6ead2';
    ctx.beginPath();
    ctx.ellipse(850, 300, 52, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b4712e';
    ctx.beginPath();
    ctx.ellipse(850, 296, 44, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lonceng.
  const b = bellRect();
  const lit = ready;
  ctx.fillStyle = lit ? COLORS.gold : '#8a8a92';
  ctx.beginPath();
  ctx.arc(b.x + b.w / 2, b.y + 26, 24, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(b.x + b.w / 2 - 3, b.y + 26, 6, 8);
  ctx.fillStyle = '#2b2118';
  ctx.beginPath();
  ctx.arc(b.x + b.w / 2, b.y + 38, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.fillText(lit ? 'DING! ENTER' : 'Lonceng', b.x + b.w / 2, b.y + b.h - 2);
  ctx.restore();
}

export function renderWorld(ctx, world) {
  drawStation(ctx, world);
  drawTicketRail(ctx, world);
  drawHud(ctx, world);
  drawKitchen(ctx, world);
  drawBowl(ctx, world);
  drawPassWindow(ctx, world);
  drawPopups(ctx, world);

  if (world.state === 'title') drawTitle(ctx, world);
  else if (world.state === 'over') drawGameOver(ctx, world);
  else if (world.paused) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,25,0.7)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COLORS.cream;
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JEDA  (P)', CANVAS_W / 2, CANVAS_H / 2);
    ctx.restore();
  }
}

function drawTitle(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,12,30,0.62)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Panel tengah agar dapur di belakang tetap terbaca.
  ctx.fillStyle = 'rgba(24,20,38,0.88)';
  roundRectPath(ctx, 110, 96, 740, 348, 14);
  ctx.fill();
  ctx.strokeStyle = COLORS.lantern;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.lantern;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText('LAST TRAIN RAMEN', CANVAS_W / 2, 150);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '20px Georgia, serif';
  ctx.fillText('Warung ramen di peron stasiun — satu malam, hujan di luar, antrean lapar di dalam.', CANVAS_W / 2, 188);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = '#cbb98d';
  const lines = [
    'Tiket datang di rel: kuah, kekerasan mie, dan tumpukan topping dari bawah ke atas.',
    'Klik panci kuah, rebus mie (E di jendela hijau), cincang negi (SPACE 3x),',
    'rakit di mangkuk sesuai urutan, lalu sajikan dengan ENTER atau lonceng.',
    'Tiket yang terbakar = -1 hati. Tiga hati habis, toko tutup.',
    '1-6 bahan  •  SPACE cincang  •  E tarik mie  •  ENTER sajikan  •  T buang  •  P jeda',
  ];
  lines.forEach((l, i) => ctx.fillText(l, CANVAS_W / 2, 240 + i * 26));
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 22px system-ui, sans-serif';
  const blink = Math.floor(world.fxT * 1.6) % 2 === 0;
  if (blink) ctx.fillText('Klik / tekan ENTER untuk buka warung', CANVAS_W / 2, 420);
  ctx.restore();
}

function drawGameOver(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,12,30,0.86)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.lantern;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(world.over && world.over.reason === 'hearts' ? 'TOKO TUTUP — HATI HABIS' : 'KERETA TERAKHIR BERANGKAT', CANVAS_W / 2, 150);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText('Penghasilan malam ini: ¥' + world.money.toLocaleString('en-US'), CANVAS_W / 2, 210);
  ctx.fillText('Mangkuk disajikan: ' + world.served + '   •   Combo terbaik: ' + world.bestCombo, CANVAS_W / 2, 246);
  ctx.fillStyle = '#cbb98d';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Jam 23 ke atas, pesanan ganda dan jendela mie makin sempit — coba lagi besok malam.', CANVAS_W / 2, 290);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 20px system-ui, sans-serif';
  if (Math.floor(world.fxT * 1.6) % 2 === 0) ctx.fillText('Klik / tekan R untuk main lagi', CANVAS_W / 2, 360);
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
