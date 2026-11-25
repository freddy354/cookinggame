// fx.js — RNG deterministik, hujan, uap, popup skor, dan bunyi WebAudio sederhana.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRain(rng, count) {
  const drops = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      x: rng() * 960,
      y: rng() * 540,
      len: 10 + rng() * 14,
      speed: 260 + rng() * 160,
      drift: -18 - rng() * 22,
    });
  }
  return drops;
}

export function updateRain(drops, dt, rng) {
  for (const d of drops) {
    d.y += d.speed * dt;
    d.x += d.drift * dt;
    if (d.y > 545) {
      d.y = -20;
      d.x = (rng ? rng() : Math.random()) * 980;
    }
    if (d.x < -20) d.x = 970;
  }
}

export function drawRain(ctx, drops) {
  ctx.save();
  ctx.strokeStyle = 'rgba(170,190,255,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const d of drops) {
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.drift * 0.05, d.y + d.len);
  }
  ctx.stroke();
  ctx.restore();
}

export function addPopup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color: color || '#f2c14e', t: 0, life: 1.4 });
}

export function updatePopups(world, dt) {
  for (const p of world.popups) p.t += dt;
  world.popups = world.popups.filter((p) => p.t < p.life);
}

export function drawPopups(ctx, world) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px system-ui, sans-serif';
  for (const p of world.popups) {
    const a = 1 - p.t / p.life;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y - p.t * 34);
  }
  ctx.restore();
}

// Bunyi kecil via WebAudio, tanpa file audio. Diam bila AudioContext tak ada.
let audioCtx = null;
function ctx() {
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch (e) {
      audioCtx = null;
    }
  }
  return audioCtx;
}
function tone(freq, dur, type, vol, when) {
  const ac = ctx();
  if (!ac) return;
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.12, ac.currentTime + (when || 0));
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + (when || 0) + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start(ac.currentTime + (when || 0));
    o.stop(ac.currentTime + (when || 0) + dur + 0.02);
  } catch (e) {
    /* abaikan */
  }
}
export function sfx(kind) {
  if (kind === 'pick') tone(520, 0.08, 'triangle', 0.1);
  else if (kind === 'pour') tone(300, 0.16, 'sine', 0.1);
  else if (kind === 'layer') tone(660, 0.09, 'triangle', 0.11);
  else if (kind === 'chop') tone(180, 0.06, 'square', 0.07);
  else if (kind === 'boil') tone(880, 0.07, 'sine', 0.06);
  else if (kind === 'perfect') {
    tone(784, 0.12, 'sine', 0.12);
    tone(1046, 0.18, 'sine', 0.12, 0.09);
  } else if (kind === 'error') tone(140, 0.22, 'sawtooth', 0.1);
  else if (kind === 'serve') {
    tone(988, 0.12, 'sine', 0.13);
    tone(1319, 0.2, 'sine', 0.13, 0.1);
  } else if (kind === 'burn') {
    tone(220, 0.25, 'sawtooth', 0.12);
    tone(165, 0.3, 'sawtooth', 0.12, 0.15);
  } else if (kind === 'bell') tone(1568, 0.35, 'sine', 0.14);
}
