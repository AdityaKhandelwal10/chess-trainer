import type { Opening, Line, OpeningExtract, Color } from '../storage/types'
import generated from './generated-lines.json'

/**
 * Bump this whenever seed content changes. The app compares against the
 * `seedVersion` stored in localStorage and re-seeds the Dexie DB when they
 * differ, so existing users pick up new lines without clearing DevTools.
 */
export const SEED_VERSION = 4

export interface SeedOpening {
  opening: Omit<Opening, 'id'>
  lines: Omit<Line, 'id' | 'openingId'>[]
}

interface GeneratedPayload {
  _meta: Record<string, string>
  lines: { opening: string; line: string; moves: string[] }[]
}

interface OpeningMeta {
  name: string
  eco: string
  color: Color
  description: string
  extract: OpeningExtract
}

const OPENINGS: OpeningMeta[] = [
  {
    name: 'Italian Game',
    eco: 'C50',
    color: 'white',
    description: 'Classical 1.e4 e5 opening. Quiet, principled, and teaches piece coordination around the e4/d4 center.',
    extract: {
      idea: 'Develop rapidly with Bc4 and Nf3, castle, and prepare the central d4 break.',
      pawnStructure: 'e4/d3 against e5/d6 (Giuoco Pianissimo) or a mobile e4/d4 duo after the break.',
      keyPieces: 'The c4-bishop eyes f7; the f3-knight supports d4; rook on e1 prepares central action.',
      yourPlan: 'c3, d3, Re1, Nbd2-f1-g3, then h3 and the d4 break when pieces are coordinated.',
      opponentPlan: 'Black mirrors with ...Bc5, ...Nf6, ...d6, ...O-O and often retreats the bishop to a7.',
      commonTraps: "Avoid early Ng5 bluffs; watch for ...Nxe4 tactics after d4 if the e1-rook is loaded.",
    },
  },
  {
    name: 'Ruy Lopez',
    eco: 'C60',
    color: 'white',
    description: 'The Spanish: most strategically rich open game. Long maneuvering battle around the e5 pawn and d4 break.',
    extract: {
      idea: 'Pressure e5 with Bb5, force ...a6, retreat to a4/b3, then break with d4.',
      pawnStructure: 'Spanish pawn chain: e4/d4 vs e5/d6. Closed centers with maneuvering, or open after ...exd4.',
      keyPieces: 'The a4-b3 bishop is your best piece long-term; the f3-knight re-routes via d2-f1-g3.',
      yourPlan: 'O-O, Re1, c3, h3, Nbd2, d4. Keep the light-squared bishop alive.',
      opponentPlan: 'Black plays ...Be7, ...O-O, ...b5, ...d6, then ...Nb8-d7 (Breyer) or ...Na5 (Chigorin).',
      commonTraps: "Noah's Ark trap (losing Bb3 to ...c5-c4); premature Nxe5 before ...a6-...b5 is played.",
    },
  },
  {
    name: 'Caro-Kann Defense',
    eco: 'B10',
    color: 'black',
    description: 'Solid reply to 1.e4. Prepares ...d5 with pawn support, avoiding the cramped French structure.',
    extract: {
      idea: 'Challenge e4 with ...d5 backed by ...c6, and develop the light-squared bishop outside the pawn chain.',
      pawnStructure: 'Caro pawn triangle c6/d5/e6 after development; Advance variation gives e5/d4 vs c6/d5.',
      keyPieces: 'The c8-bishop is the soul of the Caro — get it to f5 or g4 before playing ...e6.',
      yourPlan: 'Classical: ...dxe4, ...Bf5, ...Nd7, ...Ngf6, ...e6, ...Be7, ...O-O. Trade pieces, head for a solid endgame.',
      opponentPlan: 'White chases the Bf5 bishop with h4-h5 or closes the center with e5 (Advance).',
      commonTraps: 'In Advance, avoid ...Bg4?! Bxf7+ tricks; in Classical, never allow Nf6 without challenging Nxf6+ doubling.',
    },
  },
  {
    name: 'French Defense',
    eco: 'C00',
    color: 'black',
    description: 'Counter 1.e4 with ...e6 and ...d5. Cramped but resilient, with clear attacking plans against d4.',
    extract: {
      idea: 'Lock the center with ...d5, then attack the d4 pawn chain base with ...c5 and ...Nc6.',
      pawnStructure: 'French chain: White e5/d4 vs Black e6/d5. Base of White\'s chain (d4) is the permanent target.',
      keyPieces: 'The c8-bishop is "bad" (locked behind e6); compensate with active queen (...Qb6) and knight maneuvers.',
      yourPlan: '...c5, ...Nc6, ...Qb6 hitting b2+d4, ...Bd7-b5 rerouting, ...O-O-O in some sharp lines.',
      opponentPlan: 'White holds d4 with c3/Nf3/Bd3, attacks on the kingside with f4-f5 or Bd3-Qd2.',
      commonTraps: 'Poisoned pawn on b2 is usually bad — check Na3 defense first. In Tarrasch, ...Qxd5 loses tempo if Bc4 hits.',
    },
  },
  {
    name: "King's Indian Defense",
    eco: 'E60',
    color: 'black',
    description: 'Hypermodern reply to 1.d4. Let White build the big center, then attack it with ...e5 and ...f5.',
    extract: {
      idea: 'Fianchetto the dark-squared bishop, castle, then strike the center with ...e5 and attack the king with ...f5.',
      pawnStructure: 'Closed center after d5: White attacks queenside with c5, Black attacks kingside with ...f5-f4.',
      keyPieces: 'The g7-bishop anchors everything; the f6-knight pivots to h5 or d7 depending on White\'s setup.',
      yourPlan: '...Nf6, ...g6, ...Bg7, ...O-O, ...d6, ...e5, ...Nc6, then ...Nh5, ...f5, ...f4, ...g5 — kingside storm.',
      opponentPlan: 'White plays c5, b4, a4, Nb5 on the queenside. Fastest attacker wins.',
      commonTraps: 'Against Saemisch (f3), don\'t waste time — ...c6 and ...a6/...b5 is thematic. Against Bg5, always ...h6 first.',
    },
  },
]

/** Hand-authored notes keyed by `${opening} :: ${line}`. */
const NOTES: Record<string, string> = {
  'Italian Game :: Main Line (Giuoco Pianissimo)':
    'Slow, classical buildup. Plan: Nbd2-f1-g3 rerouting, Re1, h3, then d4 when ready. Castle before committing the queenside.',
  'Italian Game :: d4 break (critical plan)':
    'The sharp alternative to Pianissimo. After 9.d4 exd4 10.cxd4, the bishop check ...Bb4+ is met by Nc3 and O-O — sacrificing the e-pawn for rapid development and initiative.',

  'Ruy Lopez :: Closed Ruy Lopez (Main Line)':
    'Morphy → Breyer. After 9...Nb8 the knight reroutes to d7, freeing the c-pawn and preparing ...c5. White plays d4 when developed.',
  'Ruy Lopez :: Open Ruy Lopez (vs Nxe4)':
    "Black grabs the e4-pawn but concedes the center. White's plan: c3, Nbd2, Bc2, and eventual f3/Nd4 to punish the exposed knight on e4.",
  'Ruy Lopez :: Berlin Defense':
    "The Berlin Wall — Black accepts an endgame with a damaged pawn structure but active pieces. Solid but drawish. If you don't enjoy endgames, play 4.d3 (Anti-Berlin).",

  'Caro-Kann Defense :: Classical Main Line':
    'Definitive Caro. The ...Bf5 bishop is the whole point. After h4-h5, retreat to h7 — it stays useful on the b1-h7 diagonal. Complete development with ...Nd7, ...Ngf6, ...e6.',
  'Caro-Kann Defense :: Advance Variation':
    "White closes the center with e5. Classical response: ...Bf5 getting the bishop out before ...e6, then challenge d4 with ...c5. Don't let White untangle.",
  'Caro-Kann Defense :: Exchange Variation':
    'Symmetric and drawish-looking, but Black has the ...Bg4 pin and can play for a minority attack with ...b5-b4 on the queenside.',

  'French Defense :: Advance Variation':
    'The main French battleground. ...Qb6 hits b2 and d4 simultaneously, and ...Bd7-Bb5 reroutes the bad bishop. d4 is the permanent target.',
  'French Defense :: Classical (Nc3)':
    'Steinitz Variation. After 4.e5 Nfd7 the plan is ...c5 attacking d4. White\'s f4 push looks menacing but weakens e4-square control.',
  'French Defense :: Tarrasch (3.Nd2)':
    'Tarrasch avoids the pin. ...c5 immediately is the classical reply; after ...Qxd5 Ngf3 cxd4 watch for Bc4 hitting the queen — be ready to step aside with ...Qd6 or ...Qd8.',

  "King's Indian Defense :: Classical Main Line":
    'Mar del Plata mainline. After d5, the race is on: White attacks with c5/b4 on the queenside, Black with ...f5/...g5 on the kingside. Speed and accuracy decide.',
  "King's Indian Defense :: vs f3 (Saemisch)":
    'Saemisch: White builds a huge center with e4/d4/f3 but commits the king. Counter with ...e5 and ...c6, preparing ...a6/...b5 queenside counterplay.',
  "King's Indian Defense :: vs Bg5":
    "Averbakh system. Always play ...h6 to force a decision: if Bxf6, the dark squares are yours; if Be3, you've gained a tempo.",
}

const GENERATED = generated as GeneratedPayload

function notesFor(openingName: string, lineName: string): string {
  const key = `${openingName} :: ${lineName}`
  return NOTES[key] ?? 'Play principled developing moves and understand the resulting structure.'
}

export const SEED: SeedOpening[] = OPENINGS.map((meta) => ({
  opening: meta,
  lines: GENERATED.lines
    .filter((l) => l.opening === meta.name)
    .map((l) => ({
      name: l.line,
      moves: l.moves,
      notes: notesFor(l.opening, l.line),
    })),
}))
