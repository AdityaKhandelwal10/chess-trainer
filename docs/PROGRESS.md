# Progress Log

Append-only log. Each phase gets a section. Update status as we move.

## Legend
- [ ] not started
- [~] in progress
- [x] done + reviewed by user

---

## Phase 0 — Project setup
- [x] Create `chess-trainer/` directory
- [x] Write `docs/PLAN.md`, `docs/MEMORY.md`, `docs/PROGRESS.md`
- [x] Scaffold Vite + React + TS (in `app/` subdir)
- [x] Install deps: chessground, chess.js, dexie, vitest, @testing-library/react, jsdom
- [x] Vitest configured (jsdom env, globals, setup file)
- [x] Smoke test passes (`npm test`)
- [x] Build passes (`npm run build`)
- [ ] Tailwind — deferred; will add in Phase 3 when we actually style UI

## Phase 1 — Board renders & accepts moves
- [x] `ChessEngine` wrapper around chess.js (`src/board/chessEngine.ts`)
- [x] 9 unit tests: init, legal move, illegal move, undo, dests, reset, from/to, auto-promotion
- [x] `Board.tsx` using chessground, owns a `ChessEngine`, handles drag-drop + reset + move history
- [x] `App.tsx` renders the Board
- [x] Build passes; dev server returns 200
- [ ] Manual check in browser: play a few moves (**user to verify**)

## Phase 2 — Storage + seed openings
- [x] Types: Opening, Line, ReviewCard, Game (`src/storage/types.ts`)
- [x] Dexie schema v1, 4 tables with indexes (`src/storage/db.ts`)
- [x] Seed: 5 openings × 1 line each, short (6-10 moves) (`src/openings/seed.ts`)
- [x] `seedIfEmpty(db)` idempotent loader (`src/storage/seedLoader.ts`)
- [x] Tests (4): loads fresh, idempotent, line↔opening link, **every seed line is legal chess**
- [x] App.tsx: seeds on mount, lists openings above board
- [x] Build passes; 13/13 tests green
- [ ] Manual check in browser: see 5 openings listed (**user to verify**)

## Phase 3 — Explore tab
- [x] Pure helper `positionAtPly(moves, ply)` + `clampPly` (`src/openings/explore.ts`)
- [x] 8 unit tests: ply 0, mid, over/under-clamp, illegal-move defensive stop, clamp bounds
- [x] `ExploreTab.tsx`: opening sidebar, read-only chessground bound to FEN, move list with click-to-jump, Start/◀/▶/End buttons
- [x] Arrow keys (←/→) step, Home/End jump; ignored when typing in inputs
- [x] Notes + opening description panels
- [x] Board orientation follows opening color (flips for black repertoire)
- [x] App.tsx tab switcher: Explore | Drill | Review
- [x] Build passes; 21/21 tests green
- [ ] Manual check in browser (**user to verify**)

## Phase 3.5 — Expand repertoire for 1000–2000 players
- [x] Python generator `app/scripts/fetch_lichess_lines.py` using Lichess Opening Explorer at rating band 1600,1800 (blitz+rapid). User added auth token + ran locally.
- [x] `generated-lines.json` — 35 lines across 5 openings (7 each: 1 main of 14 plies + 6 sidelines of 10 plies on top-2/top-3 opponent moves at plies 2/3/4)
- [x] Also produced `generated-masters-lines.json` (28 lines, sparser; kept for reference, not loaded)
- [x] `seed.ts` restructured to import generated JSON; hand-authored NOTES table with 35 keyed entries (plans, traps, how to punish sub-2000 mistakes)
- [x] `SEED_VERSION` + localStorage reseed logic (no Dexie schema migration needed)
- [x] ExploreTab + DrillTab: nested sidebar, `selectedLineId` tracked
- [x] Test: "≥3 lines per opening" + legality for all 35 lines
- [x] `resolveJsonModule: true` added to tsconfig.app.json
- [x] Build passes; 31/31 tests green
- [ ] Manual browser verification (**user to verify**)

## Phase 4 — Drill tab
- [x] Pure helpers `isUsersTurn`, `expectedMoveAt`, `sanEquals`, `normalizeSan` (`src/drill/drill.ts`)
- [x] 9 unit tests
- [x] `DrillTab.tsx`: opening picker, board orientation = user color, engine validates drag-drop against expected SAN
- [x] Correct move → advance + auto-play opponent reply after 400ms
- [x] Wrong move → undo on engine, red feedback banner, stay on same ply
- [x] "Show answer" button reveals expected SAN on user's turn
- [x] End-of-line banner + Restart
- [x] Build passes; 30/30 tests green
- [ ] Manual check in browser (**user to verify**)

## Phase 5 — Analyze tab (replaces SRS for now)
SRS deferred indefinitely. User wants game analysis instead: import played games, see which openings they play and where they deviate from the repertoire.
- [x] Repertoire refresh: 14 hand-curated lines across 5 openings (v2-clean-repertoire); `SEED_VERSION` bumped to 4 with auto-reseed
- [x] `fetchLichessGames` + `fetchChesscomGames` importers (public APIs, no auth) — `src/analyze/importers.ts`
- [x] `analyzeGame` pure function: parses PGN, detects user color, finds longest-matching seed line, reports deviation ply + user move vs repertoire move — `src/analyze/analyze.ts`
- [x] `summarize` aggregation: group by opening → games, W–D–L, win rate, avg deviation ply, modal mistake — `src/analyze/aggregate.ts`
- [x] `AnalyzeTab.tsx`: form (Lichess + Chess.com username, date range), summary table, click-to-expand per-opening game list
- [x] 7 unit tests (analyze: 3, aggregate: 1; plus the opening lineup retest)
- [x] Build passes; 35/35 tests green
- [ ] Manual browser verification (**user to verify**)

## Phase 6 — Future
- [ ] SRS tab (if revisited)
- [ ] Engine evaluation / blunder detection on imported games
- [ ] Incremental re-fetch (persist games in Dexie `games` table)
- [ ] "Replay deviated position in Explore" deep link

---

## Session log
- **2026-04-19**: Project kickoff. Plan approved. Directory created. Docs seeded.
- **2026-04-19**: Phase 0 complete. Vite+React+TS scaffolded in `app/`. Deps installed. Vitest green. Build green. Tailwind deferred to Phase 3.
- **2026-04-19**: Phase 2 complete. Dexie + 5-opening seed + loader. Tests use `fake-indexeddb/auto` in setup for jsdom env. Test DBs isolated with `crypto.randomUUID()` names so they don't collide.
- **2026-04-19**: Phase 3.5 complete. Lichess Explorer (1600,1800 band) → 35 auto-generated lines + hand-authored notes. Simpler reseed via localStorage + SEED_VERSION instead of a Dexie migration. `resolveJsonModule` enabled. Sidebars in both Explore and Drill now expand to show per-line picker when an opening is selected.
- **2026-04-19**: Phase 4 complete. Drill tab with opponent auto-play, SAN-based correctness check (normalizes +/#/!/?), retry-on-wrong, show-answer, end-of-line restart. Used a `onUserDragRef` to keep the chessground `after` callback closure pointed at the latest React handler without re-initializing the board every render.
- **2026-04-19**: Phase 3 complete. Explore tab with opening sidebar, click-to-jump move list, arrow-key nav, notes, and orientation-per-color. Hit a macOS case-insensitive FS gotcha: `Explore.tsx` collided with `explore.ts` → renamed component file to `ExploreTab.tsx`.
- **2026-04-19**: Repertoire replaced with user-curated v2 (14 lines, 5 openings), SEED_VERSION=4. Phase 5 pivoted from SRS to Analyze: Lichess + Chess.com importers, PGN-vs-repertoire deviation analysis, per-opening summary table with expandable game list. 35/35 tests.
- **2026-04-19**: Phase 1 complete. `ChessEngine` wrapper (9 tests), `Board.tsx` with chessground drag-drop + move list + reset. Had to cast `Map<string,string[]>` to chessground's `Map<Key,Key[]>` — chessground `Key` is a string-literal union, chess.js returns plain strings. Cast is safe since chess.js only ever returns valid squares.
