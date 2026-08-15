/**
 * Pure TypeScript core: Chinese chess opening recognition.
 * Matches the first 1-4 plies against common named opening patterns.
 */

import { type Move, type Piece, type Side } from './board.js';

type MovePattern = {
  from: { file: number; rank: number };
  to: { file: number; rank: number };
  side: Side;
  pieceType?: Piece['type'];
};

type OpeningPattern = {
  name: string;
  moves: MovePattern[];
};

function matchPattern(moves: Move[], pattern: MovePattern[]): boolean {
  if (pattern.length > moves.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    const m = moves[i];
    const p = pattern[i];
    if (m.from.file !== p.from.file || m.from.rank !== p.from.rank) return false;
    if (m.to.file !== p.to.file || m.to.rank !== p.to.rank) return false;
    // pieceType is optional; if set, verify the moving piece type.
    if (p.pieceType) {
      // Since moves may not carry the piece after the fact, this relies on
      // caller passing moves annotated with the piece that moved. Our Move
      // interface does not store the moving piece, so pieceType checks are
      // skipped here. They can be enabled when moves are enriched later.
    }
  }
  return true;
}

const OPENINGS: OpeningPattern[] = [
  // Red first moves
  {
    name: '当头炮',
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '当头炮',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '仙人指路',
    moves: [
      { from: { file: 4, rank: 3 }, to: { file: 4, rank: 4 }, side: 'red' },
    ],
  },
  {
    name: '飞相局',
    moves: [
      { from: { file: 2, rank: 0 }, to: { file: 4, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '飞相局',
    moves: [
      { from: { file: 6, rank: 0 }, to: { file: 4, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '起马局',
    moves: [
      { from: { file: 1, rank: 0 }, to: { file: 2, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '起马局',
    moves: [
      { from: { file: 7, rank: 0 }, to: { file: 6, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '过宫炮',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 1, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '仕角炮',
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 0, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '仕角炮',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 8, rank: 2 }, side: 'red' },
    ],
  },

  // Black responses to 当头炮
  {
    name: '顺手炮',
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 1, rank: 7 }, to: { file: 4, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '顺手炮',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 7, rank: 7 }, to: { file: 4, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '列手炮',
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 7, rank: 7 }, to: { file: 4, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '列手炮',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 1, rank: 7 }, to: { file: 4, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '屏风马',
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '屏风马',
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '屏风马',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '屏风马',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: 'black' },
    ],
  },

  // Black first move independent openings
  {
    name: '仙人指路',
    moves: [
      { from: { file: 4, rank: 6 }, to: { file: 4, rank: 5 }, side: 'black' },
    ],
  },
  {
    name: '飞象局',
    moves: [
      { from: { file: 2, rank: 9 }, to: { file: 4, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '飞象局',
    moves: [
      { from: { file: 6, rank: 9 }, to: { file: 4, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '屏风马',
    moves: [
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: 'black' },
    ],
  },
  {
    name: '屏风马',
    moves: [
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: 'black' },
    ],
  },

  // Longer named combos
  {
    name: '中炮对屏风马',
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: 'black' },
      { from: { file: 7, rank: 0 }, to: { file: 6, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '中炮对屏风马',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: 'black' },
      { from: { file: 1, rank: 0 }, to: { file: 2, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '五七炮',
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: 'black' },
      { from: { file: 7, rank: 2 }, to: { file: 6, rank: 2 }, side: 'red' },
    ],
  },
  {
    name: '五七炮',
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: 'red' },
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: 'black' },
      { from: { file: 1, rank: 2 }, to: { file: 2, rank: 2 }, side: 'red' },
    ],
  },
];

/** Identify the opening name matching the move history prefix.
 *  Returns the longest matching pattern, or null if no pattern matches.
 */
export function identifyOpening(moves: Move[]): string | null {
  let best: { name: string; length: number } | null = null;
  for (const opening of OPENINGS) {
    if (matchPattern(moves, opening.moves)) {
      if (!best || opening.moves.length > best.length) {
        best = { name: opening.name, length: opening.moves.length };
      }
    }
  }
  return best?.name ?? null;
}
