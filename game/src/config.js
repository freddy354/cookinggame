// config.js — semua konstanta LAST TRAIN RAMEN: ukuran, warna, harga, waktu.
export const CANVAS_W = 960;
export const CANVAS_H = 540;

// Satu malam 18:00 -> 24:00 dimainkan dalam 240 detik (1 jam game = 40 detik).
export const NIGHT_SECONDS = 240;
export const START_HOUR = 18;
export const HOUR_COUNT = 6;
export const SECONDS_PER_HOUR = NIGHT_SECONDS / HOUR_COUNT;

export const MAX_HEARTS = 3;
export const MAX_TICKETS = 5;

// Uang: dasar + per topping + tip kecepatan + bonus grade mie, lalu x combo.
export const BASE_PAY = 120;
export const TOPPING_PAY = 20;
export const TIP_MAX = 60;
export const GRADE_BONUS = { perfect: 40, ok: 15, soggy: 0 };
export const COMBO_STEP = 0.1;

// Panci mie: durasi masak dan jendela hijau per tingkat kekerasan.
export const NOODLE_COOK_SECONDS = 4.5;
export const NOODLE_OK_MARGIN = 0.12;

export const COLORS = {
  nightTop: '#1b2340',
  nightBottom: '#0d1126',
  wood: '#6b4a2f',
  woodDark: '#4a3220',
  woodLight: '#8a6242',
  counter: '#7d5a38',
  cream: '#f6ead2',
  paper: '#fbf3df',
  ink: '#2b2118',
  lantern: '#ff9a3c',
  lanternGlow: '#ffb35c',
  amber: '#d98e2b',
  red: '#d94f3d',
  green: '#7bc96f',
  gold: '#f2c14e',
  steam: 'rgba(240,240,255,0.55)',
};

export const BROTHS = [
  { id: 'shoyu', name: 'Shoyu', color: '#b4712e', dark: '#7d4d1c' },
  { id: 'miso', name: 'Miso', color: '#8a5a24', dark: '#5f3c16' },
  { id: 'tonkotsu', name: 'Tonkotsu', color: '#efe3c2', dark: '#cbb98d' },
];

// Jendela hijau tempat mie harus ditarik (fraksi dari durasi masak).
export const FIRMNESS = {
  katame: { id: 'katame', name: 'Katame', label: 'Keras', win: [0.22, 0.42] },
  futsu: { id: 'futsu', name: 'Futsuu', label: 'Sedang', win: [0.42, 0.62] },
  yawara: { id: 'yawara', name: 'Yawara', label: 'Lembek', win: [0.62, 0.82] },
};
export const FIRMNESS_ORDER = ['katame', 'futsu', 'yawara'];

// Enam bin bahan di counter bawah. Negi harus dicincang (SPACE 3x) dulu.
export const TOPPINGS = [
  { id: 'chashu', name: 'Chashu', key: '1', color: '#c96a4a', dark: '#9c4a30', chop: false },
  { id: 'egg', name: 'Ajitama', key: '2', color: '#f2d06b', dark: '#c9a13a', chop: false },
  { id: 'nori', name: 'Nori', key: '3', color: '#33523f', dark: '#1f3527', chop: false },
  { id: 'negi', name: 'Negi', key: '4', color: '#79c76d', dark: '#4d9440', chop: true },
  { id: 'menma', name: 'Menma', key: '5', color: '#d9a441', dark: '#a87a22', chop: false },
  { id: 'corn', name: 'Corn', key: '6', color: '#f7e14b', dark: '#c9ae1e', chop: false },
];

export function toppingById(id) {
  return TOPPINGS.find((t) => t.id === id);
}
export function brothById(id) {
  return BROTHS.find((b) => b.id === id);
}
