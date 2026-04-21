# Shared Memory — Chess Openings Trainer

Long-lived context for future Claude sessions working on this project. Update this file whenever a decision, constraint, or non-obvious detail emerges.

## Project goal
Visual system to help the user (Aditya) learn chess openings. V1 = learn/drill. V2 = plug in own games (Chess.com / Lichess) and get analysis.

## User preferences for this project
- Wants to **review each phase in depth** before moving on. Build in small test-driven phases. Pause after each.
- Prefers simple, understandable code over clever abstractions.
- No emojis in files unless asked.

## Decisions locked in (with reasoning)

| Decision | Choice | Why |
|---|---|---|
| Platform | Local web app (Vite + React + TS) | User picked "Local web app" over CLI/Jupyter. Best for visual chess board. |
| Board UI | `chessground` (Lichess's library) | Battle-tested, same feel as Lichess, good a11y. |
| Move logic | `chess.js` | Standard, handles PGN/FEN/legality. |
| Storage | Dexie (IndexedDB) | All client-side, no backend needed for v1. User wants no server complexity. |
| Styling | Tailwind | Fast iteration. |
| Learning modes | All three: Explore, Guided drill, SRS | User selected all three. |
| Game import source | Chess.com + Lichess APIs | User selected both. Deferred to v2. |
| Engine | **None for v1** | User chose "No engine yet". For v2 analysis, use *repertoire deviation* (compare played moves to saved lines) instead of engine eval — still valuable. |
| SRS algorithm | SM-2 (deferred) | User pivoted away from SRS in favor of game analysis. Kept here for reference if revisited. |
| Analyze sources | Lichess + Chess.com public APIs, date range | No auth required for public games. |

## Build order (phases)
1. **Phase 1** — Vite scaffold + board renders + accepts moves. Test: play e4, board updates, chess.js tracks state.
2. **Phase 2** — Dexie schema + seed openings JSON + load into DB.
3. **Phase 3** — Explore tab: opening tree + board sync + arrow-key nav.
4. **Phase 4** — Drill tab: line playback, correctness check, retry.
5. **Phase 5** — ~~SRS~~ **Analyze tab**: Lichess + Chess.com importer, per-opening deviation report. (SRS deferred — user prioritized game analysis.)
6. **Phase 6** — Future: engine eval, incremental re-fetch, SRS if revisited.

## Test-driven approach
Each phase:
1. Write failing test (Vitest for unit, Playwright optional for e2e).
2. Implement minimum to pass.
3. Pause for user review before next phase.

## Project layout (planned)
```
chess-trainer/
  docs/           PLAN.md, MEMORY.md, PROGRESS.md
  src/
    board/        Chessground wrapper
    openings/     Seed JSON + tree view
    drill/        Guided drill
    srs/          SM-2 scheduler
    storage/      Dexie schema
    games/        (v2) importers
    App.tsx
  public/seed-openings.json
  tests/
```

## Key external resources
- Chessground docs: https://github.com/lichess-org/chessground
- chess.js: https://github.com/jhlywa/chess.js
- Lichess API games: `GET https://lichess.org/api/games/user/{username}?pgnInJson=true` (ndjson)
- Chess.com API games: `GET https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}`
- SM-2 algorithm reference: https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm

## Target audience
Current repertoire targets **1000–2000** rated club players (Lichess/Chess.com). Lines sourced from Lichess Opening Explorer at the 1600,1800 rating band so sidelines reflect what opponents at that level actually play. See `docs/PLAN.md` "Target audience & future rating tiers" for the planned progression (Beginner 800–1200, Advanced 2000–2400, Master 2400+). Higher tiers will likely need a variation-tree data model and engine analysis — both deferred.

## Open questions / future
- Should the repertoire editor allow branching (variations) or only linear lines? → Lean toward variations (tree), likely required for the Advanced/Master tiers.
- Add an engine (Stockfish WASM) later for v2 analysis depth? Deferred per user, but needed for the Master tier.
- User profile / Chess.com or Lichess username: not yet provided.
- Rating tiers as selectable "repertoire packs": add `tier` field to `Opening` when we build the second tier.

## How to resume
1. Read `docs/PROGRESS.md` to see where we left off.
2. Read `docs/PLAN.md` for full scope.
3. Continue with next phase.
