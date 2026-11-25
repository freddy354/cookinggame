// orders.js — tiket pesanan: dibuat, dibakar timernya, dihitung bayarannya, digambar di rel.
import {
  BROTHS, FIRMNESS_ORDER, TOPPINGS, BASE_PAY, TOPPING_PAY, TIP_MAX,
  GRADE_BONUS, COMBO_STEP, COLORS,
} from './config.js';
import { addPopup, sfx } from './fx.js';

let nextTicketId = 1;

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// Tumpukan topping 3 lapis di jam 18, tumbuh sampai 7 lapis di jam 23.
export function stackSizeForHour(hourIndex) {
  return Math.min(7, 3 + hourIndex);
}
export function burnSecondsForHour(hourIndex) {
  return 46 - hourIndex * 3.5;
}
export function spawnIntervalForHour(hourIndex) {
  return 14 - hourIndex * 1.2;
}

export function makeTicket(rng, hourIndex) {
  const n = stackSizeForHour(hourIndex);
  const toppings = [];
  for (let i = 0; i < n; i++) toppings.push(pick(rng, TOPPINGS).id);
  const maxTime = burnSecondsForHour(hourIndex);
  return {
    id: nextTicketId++,
    broth: pick(rng, BROTHS).id,
    firmness: pick(rng, FIRMNESS_ORDER),
    toppings,
    timeLeft: maxTime,
    maxTime,
    angry: false,
  };
}

export function spawnTicket(world) {
  if (world.tickets.length >= 5) return null;
  const t = makeTicket(world.rng, hourIndex(world));
  world.tickets.push(t);
  if (!world.activeId) world.activeId = t.id;
  return t;
}

export function hourIndex(world) {
  return Math.min(5, Math.floor(world.time / 40));
}

export function activeTicket(world) {
  return world.tickets.find((t) => t.id === world.activeId) || world.tickets[0] || null;
}

// Urutan lapisan yang benar, bawah ke atas: kuah, mie, lalu topping.
export function expectedLayers(ticket) {
  return [{ type: 'broth', id: ticket.broth }, { type: 'noodle' }]
    .concat(ticket.toppings.map((id) => ({ type: 'topping', id })));
}

export function ticketPay(ticket, noodleGrade, combo) {
  const tip = Math.round(TIP_MAX * Math.max(0, ticket.timeLeft / ticket.maxTime));
  const subtotal = BASE_PAY + TOPPING_PAY * ticket.toppings.length + tip
    + (GRADE_BONUS[noodleGrade] || 0);
  return Math.round(subtotal * (1 + COMBO_STEP * combo));
}

// Timer tiket berjalan; yang habis bikin pelanggan marah dan makan 1 hati.
export function updateTickets(world, dt) {
  for (const t of world.tickets) t.timeLeft -= dt;
  const burnt = world.tickets.filter((t) => t.timeLeft <= 0);
  for (const t of burnt) {
    world.tickets = world.tickets.filter((x) => x.id !== t.id);
    world.hearts -= 1;
    world.combo = 0;
    addPopup(world, 300, 90, 'Pelanggan marah! -1 hati', '#d94f3d');
    sfx('burn');
    if (world.activeId === t.id) {
      world.activeId = world.tickets.length ? world.tickets[0].id : null;
      world.bowl.layers = [];
      world.bowl.spoiled = false;
    }
  }
  if (world.hearts <= 0) world.over = { reason: 'hearts' };
}

// ---- gambar rel tiket (kiri atas) ----
export function ticketRect(i) {
  return { x: 14 + i * 102, y: 8, w: 94, h: 74 };
}

export function drawTicketRail(ctx, world) {
  ctx.save();
  // Rel gantung.
  ctx.strokeStyle = COLORS.woodDark;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(8, 6);
  ctx.lineTo(530, 6);
  ctx.stroke();
  ctx.fillStyle = COLORS.lantern;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(60 + i * 104, 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  world.tickets.forEach((t, i) => {
    const r = ticketRect(i);
    const urgent = t.timeLeft < 10;
    const isActive = world.activeId === t.id;
    ctx.fillStyle = COLORS.paper;
    ctx.strokeStyle = isActive ? COLORS.gold : (urgent ? COLORS.red : '#b09a72');
    ctx.lineWidth = isActive ? 3 : 1.5;
    roundRect(ctx, r.x, r.y, r.w, r.h, 6);
    ctx.fill();
    ctx.stroke();
    // Jepitan.
    ctx.fillStyle = '#8a6242';
    ctx.fillRect(r.x + r.w / 2 - 5, r.y - 4, 10, 8);

    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(t.broth.toUpperCase(), r.x + 6, r.y + 15);
    // Swatch kuah.
    const broth = BROTHS.find((b) => b.id === t.broth);
    ctx.fillStyle = broth.color;
    ctx.beginPath();
    ctx.arc(r.x + r.w - 12, r.y + 12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00000033';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bar kekerasan mie + jendela hijau.
    const firm = { katame: [0.22, 0.42], futsu: [0.42, 0.62], yawara: [0.62, 0.82] }[t.firmness];
    ctx.fillStyle = '#d8c9a8';
    ctx.fillRect(r.x + 6, r.y + 22, r.w - 12, 7);
    ctx.fillStyle = '#58a34c';
    ctx.fillRect(r.x + 6 + firm[0] * (r.w - 12), r.y + 22, (firm[1] - firm[0]) * (r.w - 12), 7);
    ctx.fillStyle = COLORS.ink;
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillText(t.firmness === 'katame' ? 'Keras' : t.firmness === 'futsu' ? 'Sedang' : 'Lembek', r.x + 6, r.y + 40);

    // Tumpukan topping, bawah ke atas.
    const chips = t.toppings.slice(0, 7);
    chips.forEach((id, j) => {
      const top = TOPPINGS.find((x) => x.id === id);
      ctx.fillStyle = top.color;
      ctx.fillRect(r.x + 6 + j * 12, r.y + 46, 10, 8);
      ctx.strokeStyle = '#00000044';
      ctx.strokeRect(r.x + 6 + j * 12, r.y + 46, 10, 8);
    });

    // Bar waktu terbakar.
    const frac = Math.max(0, t.timeLeft / t.maxTime);
    ctx.fillStyle = '#e0d3b2';
    ctx.fillRect(r.x + 6, r.y + r.h - 10, r.w - 12, 5);
    ctx.fillStyle = urgent ? COLORS.red : '#e08a2e';
    ctx.fillRect(r.x + 6, r.y + r.h - 10, (r.w - 12) * frac, 5);
  });
  ctx.restore();
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
