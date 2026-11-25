# Last Train Ramen — Make the Best Cooking Game

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/freddy354/cookinggame/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/freddy354/cookinggame/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

Entry for the [Make the Best Cooking Game](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty on make.fun.

**Last Train Ramen** — one stall, one rainy night. Run a ramen stall on a station platform from 18:00 to midnight, when the last train leaves. Tickets slide in on the rail: broth colour, noodle firmness, a topping stack in a strict order. Chop the negi (SPACE ×3), pull the noodles at the green window (E), stack the bowl layer by layer, ring the bell (ENTER) to serve before the ticket burns. Clean serves build a combo; a burnt ticket costs a heart. Three hearts, then the shop closes.

## Play

Serve it locally: `node serve.ts`, then open http://localhost:8080 in desktop Chrome.

- Mouse: bins, pots, bell, tickets
- `1–6` ingredient, `SPACE` chop, `E` pull noodles, `ENTER` serve, `T` trash the bowl, `P` pause

## Layout

- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`
- `game/` — the playable game as static files (canvas 960×540, no network, no libraries)
- `game/src/` — one module per job: `main.js` (boot + loop + screens), `config.js`, `orders.js` (tickets + payouts), `kitchen.js` (bins, chopping, pots), `bowl.js` (stacking + serving), `input.js`, `render.js` (station, rain, HUD), `fx.js` (particles + WebAudio bleeps), `shots.js` (deterministic screenshot scenes via `?shot=start|play|serve|rush&seed=N`)
- `screenshots/` — 4 real renders of the game's own code
- `shots.json` — the screenshot list
- `vendor/makefun-game.ts` — the kit's library, copied unchanged
