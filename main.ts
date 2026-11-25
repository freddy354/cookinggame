// Last Train Ramen — warung ramen di peron stasiun hujan, 18:00→24:00.
// Masak dan sajikan semangkuk demi semangkuk sebelum kereta terakhir berangkat.
// Script ini menyerahkan entry: salin game/ + screenshots/ ke output lalu tulis dossier.json.
import { cpSync, mkdirSync, rmSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);

function countFiles(dir: string): number {
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    n += entry.isDirectory() ? countFiles(p) : 1;
  }
  return n;
}
const gameFiles = countFiles(join(out, 'game'));
const shotFiles = countFiles(join(out, 'screenshots'));
console.log('Last Train Ramen — hand-in selesai:');
console.log('  dossier.json: ' + dossier.length + ' bytes');
console.log('  game/: ' + gameFiles + ' file');
console.log('  screenshots/: ' + shotFiles + ' file');
console.log('wrote ' + join(out, 'dossier.json') + ' (' + dossier.length + ' bytes)');
