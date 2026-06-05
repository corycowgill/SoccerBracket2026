# ⚽ World Cup 2026 Family Bracket

A simple, fun web app for your family to fill out **FIFA World Cup 2026**
brackets, then watch points roll in on a shared leaderboard as real results
happen. Built to run on one shared device — no logins, no accounts, free to host.

## What it does

- **Add each family member** and let everyone fill out their own bracket.
- **Predict the group stage** — order all 12 groups (A–L) and pick which 8
  third-place teams advance to the new 48-team **Round of 32**.
- **Fill the knockout bracket** all the way to your champion 🏆.
- **Pull real results from the internet** (free [openfootball](https://github.com/openfootball/worldcup.json)
  feed — no API key), with a **manual result-entry** fallback if the feed lags.
- **Family leaderboard** that scores everyone automatically as games are played.
- **“How it works”** page that explains the (brand-new) 2026 format in plain English.

## Where data is stored

Everything saves in **your browser's `localStorage` on this device** — there is no
server or database. Use **Export** (top bar) to download a backup file and
**Import** to restore it or move brackets to another device.

## Run locally

```bash
npm install
npm run dev        # open the printed http://localhost:5173 URL
```

Other scripts:

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build locally
npm test           # run the scoring/standings unit tests
```

## Deploy to Render (free Static Site)

This repo includes a `render.yaml` blueprint.

1. Push this repo to GitHub.
2. In Render: **New + → Blueprint**, select the repo, and apply. Render reads
   `render.yaml` and creates a free Static Site.
   - Or do it manually: **New + → Static Site**, with
     **Build command** `npm ci && npm run build` and **Publish directory** `dist`.
3. Open the live URL on your shared family device and start adding players.

To update the live site later, just push to the connected branch — Render rebuilds
automatically.

## How scoring works

| What you predict correctly | Points |
| --- | --- |
| Each team that reaches the Round of 32 | 4 |
| Exact top-2 order of a group (bonus) | +3 |
| Each team reaching the Round of 16 / QF / SF / Final | 5 / 8 / 12 / 18 |
| Champion / Runner-up / Third place | 30 / 18 / 12 |

Scoring is based on **which teams you correctly send deep into the tournament**,
so brackets are judged fairly even if a couple of exact matchups differ from real
life. All point values live in `src/lib/scoring.ts` (`DEFAULT_SCORING`) and are
easy to tweak.

## How it's built

- **React + Vite + TypeScript**, styled with **Tailwind CSS**. No backend.
- `src/data/wc2026-snapshot.json` — bundled tournament structure (12 groups, the
  104-match schedule, and the official knockout wiring) so the app works offline.
- `src/lib/feedClient.ts` — fetches live results from openfootball, caches them,
  falls back to the bundled snapshot.
- `src/lib/standings.ts` — group tables, advancement (incl. the 8 best third-place
  teams), and resolving any bracket (real **or** predicted) with the same logic.
- `src/lib/scoring.ts` — turns predictions + results into the leaderboard.

### Upgrade path (not built)

If you later want each family member on their own phone with brackets synced
across devices, add a small backend (e.g. Node/Express + a free Postgres such as
Neon) and swap `src/lib/storage.ts` to read/write the API. The data model is
structured to make that change straightforward.
