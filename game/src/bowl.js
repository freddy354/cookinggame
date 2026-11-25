// bowl.js — mangkuk rakitan: tambah lapisan, validasi urutan, buang, siap saji.
import { TOPPINGS, COLORS } from './config.js';
import { addPopup, sfx } from './fx.js';
import { activeTicket, expectedLayers } from './orders.js';

export function bowlRect() {
  return { x: 520, y: 260, w: 170, h: 150 };
}
export function bowlCenter() {
  return { x: 605, y: 350 };
}

// Klik mangkuk dengan bahan di tangan: cocok -> lapisan masuk, salah -> mangkuk rusak.
export function addToBowl(world) {
  const hand = world.hand;
  if (!hand) return false;
  if (world.bowl.spoiled) {
    addPopup(world, 605, 240, 'Mangkuk rusak! Tekan T', '#d94f3d');
    return false;
  }
  const ticket = activeTicket(world);
  if (!ticket) {
    addPopup(world, 605, 240, 'Belum ada pesanan!', '#d94f3d');
    return false;
  }
  const expected = expectedLayers(ticket);
  const idx = world.bowl.layers.length;
  if (idx >= expected.length) return false;
  const want = expected[idx];
  const got = hand.kind === 'noodle' ? { type: 'noodle' } : { type: 'topping', id: hand.id };
  if (got.type !== want.type || (want.id && got.id !== want.id)) {
    world.bowl.spoiled = true;
    world.bowl.errorT = 0.9;
    world.combo = 0;
    world.hand = null;
    addPopup(world, 605, 240, 'Salah urutan! Tekan T untuk buang', '#d94f3d');
    sfx('error');
    return false;
  }
  if (hand.kind === 'noodle') {
    world.bowl.layers.push({ type: 'noodle', grade: hand.grade });
    world.bowl.noodleGrade = hand.grade;
  } else {
    world.bowl.layers.push({ type: 'topping', id: hand.id });
  }
  world.hand = null;
  sfx('layer');
  return true;
}

export function trashBowl(world) {
  world.bowl.layers = [];
  world.bowl.spoiled = false;
  world.bowl.noodleGrade = null;
  world.hand = null;
  sfx('pick');
}

export function bowlReady(world) {
  const ticket = activeTicket(world);
  if (!ticket || world.bowl.spoiled) return false;
  return world.bowl.layers.length === expectedLayers(ticket).length;
}

// ---- gambar mangkuk cross-section + uap ----
export function drawBowl(ctx, world) {
  const c = bowlCenter();
  ctx.save();
  // Meja mangkuk.
  ctx.fillStyle = COLORS.wood;
  ctx.fillRect(500, 400, 210, 40);
  ctx.fillStyle = COLORS.woodDark;
  ctx.fillRect(500, 400, 210, 5);

  // Mangkuk.
  const flashing = world.bowl.spoiled && Math.floor(world.fxT * 6) % 2 === 0;
  ctx.fillStyle = flashing ? '#d94f3d' : '#2e3d55';
  ctx.beginPath();
  ctx.moveTo(c.x - 78, c.y - 52);
  ctx.quadraticCurveTo(c.x - 78, c.y + 46, c.x, c.y + 46);
  ctx.quadraticCurveTo(c.x + 78, c.y + 46, c.x + 78, c.y - 52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f6ead2';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y - 52, 78, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Motif mangkuk.
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(c.x - 60, c.y + 18);
  ctx.quadraticCurveTo(c.x, c.y + 30, c.x + 60, c.y + 18);
  ctx.stroke();

  // Lapisan, bawah ke atas.
  const layers = world.bowl.layers;
  const layerH = 13;
  const baseY = c.y + 38;
  layers.forEach((layer, i) => {
    const y = baseY - (i + 1) * layerH;
    const w = 66 - i * 2;
    if (layer.type === 'broth') {
      const b = { shoyu: '#b4712e', miso: '#8a5a24', tonkotsu: '#efe3c2' }[layer.id];
      ctx.fillStyle = b;
      ctx.beginPath();
      ctx.ellipse(c.x, y + layerH / 2, w, layerH / 2 + 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (layer.type === 'noodle') {
      ctx.strokeStyle = '#f2d06b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const sx = c.x - w + 6 + k * 13;
        ctx.moveTo(sx, y + 4);
        ctx.quadraticCurveTo(sx + 6, y + 10, sx + 12, y + 4);
      }
      ctx.stroke();
    } else {
      const top = TOPPINGS.find((t) => t.id === layer.id);
      ctx.fillStyle = top ? top.color : '#888';
      roundRect(ctx, c.x - w / 2, y + 1, w, layerH - 2, 4);
      ctx.fill();
      ctx.strokeStyle = '#00000044';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // Uap bila mangkuk berisi.
  if (layers.length > 0) {
    ctx.strokeStyle = COLORS.steam;
    ctx.lineWidth = 2.5;
    for (let k = 0; k < 3; k++) {
      const sx = c.x - 30 + k * 30;
      const ph = (world.fxT * 0.9 + k * 0.33) % 1;
      ctx.globalAlpha = 0.55 * (1 - ph);
      ctx.beginPath();
      ctx.moveTo(sx, c.y - 58 - ph * 26);
      ctx.quadraticCurveTo(sx + 8, c.y - 68 - ph * 26, sx - 2, c.y - 78 - ph * 26);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Label mangkuk.
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  if (world.bowl.spoiled) {
    ctx.fillStyle = COLORS.red;
    ctx.fillText('RUSAK — tekan T', c.x, c.y + 66);
  } else if (bowlReady(world)) {
    ctx.fillStyle = COLORS.gold;
    ctx.fillText('SIAP! ENTER / lonceng', c.x, c.y + 66);
  } else {
    const ticket = activeTicket(world);
    if (ticket) {
      ctx.fillText('Rakit: ' + layers.length + '/' + expectedLayers(ticket).length + ' lapis', c.x, c.y + 66);
    } else {
      ctx.fillText('Mangkuk kosong', c.x, c.y + 66);
    }
  }
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
