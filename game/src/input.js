// input.js — keyboard + mouse: memetakan klik dan tombol ke aksi dapur.
import { binRect, brothRect, potRect } from './kitchen.js';
import { bowlRect } from './bowl.js';
import { bellRect } from './render.js';
import { ticketRect } from './orders.js';

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function attachInput(canvas, world, actions) {
  function canvasPos(ev) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) * (canvas.width / r.width),
      y: (ev.clientY - r.top) * (canvas.height / r.height),
    };
  }

  canvas.addEventListener('click', (ev) => {
    const { x, y } = canvasPos(ev);
    if (world.state === 'title') {
      actions.start();
      return;
    }
    if (world.state === 'over') {
      actions.restart();
      return;
    }
    if (world.paused) return;
    // Tiket: pilih yang aktif.
    for (let i = 0; i < world.tickets.length; i++) {
      if (inRect(x, y, ticketRect(i))) {
        world.activeId = world.tickets[i].id;
        return;
      }
    }
    if (inRect(x, y, bellRect())) {
      actions.serve();
      return;
    }
    if (inRect(x, y, bowlRect())) {
      actions.addToBowl();
      return;
    }
    if (inRect(x, y, potRect())) {
      actions.startNoodles();
      return;
    }
    for (let i = 0; i < 3; i++) {
      if (inRect(x, y, brothRect(i))) {
        actions.pourBroth(i);
        return;
      }
    }
    for (let i = 0; i < 6; i++) {
      if (inRect(x, y, binRect(i))) {
        actions.pickBin(i);
        return;
      }
    }
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    if (world.state === 'title' && (ev.key === 'Enter' || ev.key === ' ')) {
      actions.start();
      ev.preventDefault();
      return;
    }
    if (world.state === 'over' && (ev.key === 'r' || ev.key === 'R' || ev.key === 'Enter')) {
      actions.restart();
      return;
    }
    if (world.state !== 'play') return;
    const k = ev.key;
    if (k === 'p' || k === 'P') {
      actions.togglePause();
      return;
    }
    if (world.paused) return;
    if (k >= '1' && k <= '6') actions.pickBin(Number(k) - 1);
    else if (k === ' ') {
      actions.chop();
      ev.preventDefault();
    } else if (k === 'e' || k === 'E') actions.pullNoodles();
    else if (k === 'Enter') actions.serve();
    else if (k === 't' || k === 'T') actions.trash();
  });
}
