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

A GitHub Actions workflow builds the APK automatically on every push (see
`.github/workflows/`). For local command-line-only builds instead, see
[`ANDROID_BUILD.md`](./ANDROID_BUILD.md) (no Android Studio required).

## Recent enhancements

- Standings are shown as a compact, cricket-league-style table (Pos / Player /
  M / W / L / Sets ± / Games ± / Pts) with an inline "Q" badge for players
  qualifying for the next stage.
- A single-step "Undo" reverts the last recorded scoring action (point, game,
  or completed match/stage) in case of a mis-tap.
- The Home screen lists every tournament currently in progress (not just one),
  supporting multiple simultaneous tournaments, with a soft warning if a
  player is already active in another in-progress tournament.
- A "Rounds" tab shows the full round-by-round history of every stage played
  so far, for both active and completed tournaments.
- Completed tournaments can be exported as a full-detail PDF report (tournament
  info, champion, every stage's standings, every round's scores) generated
  entirely client-side with `jspdf`/`jspdf-autotable` — no backend required.
- Player profiles can be edited from the player detail page: Username, plus
  optional Full Name and Age.
- Advancing from a completed round to the next round/stage/champion now shows
  a tailored confirmation prompt ("Continue →") instead of auto-cascading
  instantly — the completed round's court is still freed automatically, only
  the round/stage/champion transition itself waits for confirmation.
- The Standings tab has a stage selector, so standings from any previously
  reached stage remain viewable after the tournament has advanced further.
