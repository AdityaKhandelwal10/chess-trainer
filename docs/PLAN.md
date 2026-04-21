# Chess Openings Trainer — Design Plan

## Context
You want a visual system to learn chess openings, with a path to later plug in your own games for analysis. Scope for v1 is learning/drilling; game-import analysis is a v2 add-on. Decisions locked in: local web app, all three learning modes (guided repertoire + spaced repetition + explore), games sourced from Chess.com/Lichess APIs later, no engine for now.

## Stack (keep it simple)
- **Vite + React + TypeScript** — fast local dev, minimal config.
- **chessground** (Lichess's board component) for the interactive board UI.
- **chess.js** for move legality, PGN parsing, FEN handling.
- **Dexie (IndexedDB)** for local storage of repertoire + SRS review state. No server, no auth.
- **Tailwind** for quick styling.

All client-side. `npm create vite` → one folder, `npm run dev`, done.

## Data model (stored in IndexedDB)
```
Opening       { id, name, eco, color: 'white'|'black', rootFen }
Line          { id, openingId, name, moves: ["e4","e5","Nf3",...], notes }
Position      { fen, bestMoves: [{san, comment}], lineIds: [...] }   // derived
ReviewCard    { id, fen, expectedMove, ease, interval, dueAt, lineId }
Game          { id, source: 'lichess'|'chesscom', pgn, playedAt, result }  // v2
```

Seed data: ship a small curated JSON of ~5 starter openings (Italian, Ruy Lopez, Caro-Kann, French, King's Indian). You can add more via paste-PGN later.

## Three learning modes (single app, three tabs)

### 1. Explore
Left: opening tree (collapsible, grouped by ECO). Right: chessground board + move list + notes. Clicking a move in the tree plays it on the board. Arrow keys step forward/back. This is also how you *author* a repertoire — reach a position, click "save line".

### 2. Guided repertoire drill
Pick an opening + color. System plays the opponent's moves; you must play the correct reply. Wrong move → board shakes, shows correct move, offers retry. End of line → "next line" / "shuffle".

### 3. Spaced repetition
SM-2 algorithm (simple, well-known). Each `(fen, expectedMove)` pair is a card. Daily queue of due cards. Grade self after each: Again / Hard / Good / Easy → updates interval. Storage: `ReviewCard` table.

## Project layout
```
chess-trainer/
  src/
    board/        Chessground wrapper, move input
    openings/     Seed JSON + tree view
    drill/        Guided drill mode
    srs/          SM-2 scheduler + review UI
    storage/      Dexie schema + queries
    games/        (v2) Lichess/Chess.com importers
    App.tsx       tabs: Explore | Drill | Review | (Games)
  public/seed-openings.json
```

## V2: game import (stub the interfaces now)
- `games/lichess.ts`: `fetchGames(username, since)` → `GET https://lichess.org/api/games/user/{username}?since=...&pgnInJson=true` (ndjson stream).
- `games/chesscom.ts`: `fetchGames(username, month)` → `https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}`.
- Analysis for v2 (no engine): match each game's opening moves against your repertoire tree → report *"you deviated from your Italian line on move 6: played Bd3, repertoire says Bb3"*. This is valuable with zero engine.
- Leave an empty `Games` tab + `games/` folder with typed stubs so the structure is in place.

## Build order
1. Vite scaffold + chessground + chess.js wired to a board that accepts moves.
2. Dexie schema + seed-openings loader.
3. Explore tab: opening tree + board sync.
3.5. Expand repertoire (4–5 lines/opening, depth 12–14, sidelines) targeting 1000–2000 rated players; pulled from Lichess Opening Explorer with hand-authored notes on plans/traps/punishing common mistakes. Dexie v2 adds `meta` table for `seedVersion` re-seed.
4. Drill tab: line playback with correctness check.
5. SRS tab: SM-2 scheduler + review UI.
6. (V2) Games tab: Lichess importer + deviation report.

## Target audience & future rating tiers
The current seed repertoire is built for the **1000–2000** rating band (casual/club players on Lichess/Chess.com). Lines are generated from Lichess Opening Explorer at the 1600,1800 bucket — so the opponent replies you drill are the ones you'll actually face, including the common sub-optimal moves.

Future tiers (not yet built):

| Tier | Target | Data source | Line depth | Emphasis |
|---|---|---|---|---|
| **Beginner** | 800–1200 | Lichess explorer 1000,1200 | shallow (8–12 plies) | just the first few moves + biggest traps (Scholar's, Fried Liver) |
| **Club** *(current)* | 1000–2000 | Lichess explorer 1600,1800 | 14–20 plies | plans, structures, punishing common mistakes |
| **Advanced** | 2000–2400 | Lichess explorer 2200,2500 + masters DB | 20–30 plies + variations | sharp modern theory, sideline nuance, transpositions |
| **Master** | 2400+ | Lichess masters DB + curated engine annotations | 30+ plies, deep variation trees | novelties, engine-approved precise move orders, known endgame tabiyas |

Implementation notes for higher tiers:
- Advanced/Master tiers likely need a **variation tree** data model, not flat lines — too much prefix duplication otherwise. See "Open questions" in MEMORY.md.
- Master tier will likely need engine analysis (Stockfish WASM) to annotate move quality and justify choices — currently deferred per user.
- Each tier should be a selectable "repertoire pack" — pick your rating, drill that pack. `Opening` table can gain a `tier: 'beginner'|'club'|'advanced'|'master'` field.

## Verification
- `npm run dev` → open in browser.
- Explore: click through Italian Game main line, confirm board matches.
- Drill: play through a line, intentionally play a wrong move, confirm feedback + retry.
- SRS: create 3 cards, grade them, advance system date (or mock `Date.now`), confirm due queue updates correctly per SM-2.
- (V2) Paste your Lichess username, fetch last 10 games, confirm deviation report flags at least one off-repertoire move.

## Key files to create
- `src/board/Board.tsx` — chessground wrapper
- `src/storage/db.ts` — Dexie schema
- `src/openings/tree.ts` — line → tree transform
- `src/drill/Drill.tsx` — guided mode
- `src/srs/scheduler.ts` — SM-2 implementation
- `public/seed-openings.json` — starter repertoire
