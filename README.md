# Ace Tracker — Friendly Tennis Tournament App

An offline-first tennis tournament organizer for friendly groups (2–30
players). No backend, no accounts — everything lives on-device in IndexedDB
until you clear app data or uninstall.

Full requirements: [`initiatives/2026-tennis-tournament-app/FUNCTIONAL_REQUIREMENTS.md`](../../initiatives/2026-tennis-tournament-app/FUNCTIONAL_REQUIREMENTS.md)

## Stack
- Vue 3 + TypeScript (`strict: true`) + Vite
- Pinia (state) + Dexie (IndexedDB persistence)
- Tailwind CSS v4 (design)
- Chart.js / vue-chartjs (bar, donut, line charts)
- Capacitor (Android APK packaging, command-line only — no Android Studio)

## Domain layer (pure TypeScript, no framework dependencies)
- `player-management/` — global player profiles
- `match-scoring/` — Simple (tally) and Official (15/30/40/Deuce/Advantage,
  win-by-2, tiebreak-at-N-N) scoring engines
- `tournament-scheduling/` — round-robin (circle method + rotating bye) and
  knockout fixture generation, court assignment + waiting queue
- `standings/` — tie-break ranking (wins → set diff → game diff → head-to-head)
- `tournament-format/` — pluggable, data-driven tournament format definitions
- `tournament-management/` — tournament/stage/round progression, Dexie
  persistence, Pinia store
- `player-statistics/` — cross-tournament career KPI aggregation

## Development

```powershell
npm install
npm run dev          # start the dev server
npm run build        # type-check (vue-tsc) + production build
npx vitest run        # run the unit test suite
```

## Building the Android APK

See [`ANDROID_BUILD.md`](./ANDROID_BUILD.md) for exact command-line-only
steps (no Android Studio required).
