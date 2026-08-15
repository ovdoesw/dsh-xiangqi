/**
 * Pure TypeScript core: simple Chinese chess FEN serialization.
 * Ranks are listed from top (black side, rank 9) to bottom (red side, rank 0).
 * Side to move follows after a space: 'r' for red, 'b' for black.
 */

import {
  type Board,
  type Piece,
  type PieceType,
  type Side,
  createEmptyBoard,
  FILES,
  RANKS,
} from './board.js';

const TYPE_TO_CHAR: Record<Side, Record<PieceType, string>> = {
  red: {
    king: 'K',
    advisor: 'A',
    elephant: 'E',
    horse: 'H',
    rook: 'R',
    cannon: 'C',
    pawn: 'P',
  },
  black: {
    king: 'k',
    advisor: 'a',
    elephant: 'e',
    horse: 'h',
    rook: 'r',
    cannon: 'c',
    pawn: 'p',
  },
};

const CHAR_TO_PIECE: Record<string, { side: Side; type: PieceType }> = {
  K: { side: 'red', type: 'king' },
  A: { side: 'red', type: 'advisor' },
  E: { side: 'red', type: 'elephant' },
  H: { side: 'red', type: 'horse' },
  R: { side: 'red', type: 'rook' },
  C: { side: 'red', type: 'cannon' },
  P: { side: 'red', type: 'pawn' },
  k: { side: 'black', type: 'king' },
  a: { side: 'black', type: 'advisor' },
  e: { side: 'black', type: 'elephant' },
  h: { side: 'black', type: 'horse' },
  r: { side: 'black', type: 'rook' },
  c: { side: 'black', type: 'cannon' },
  p: { side: 'black', type: 'pawn' },
};

/** Serialize one rank to a FEN-like run-length encoded string. */
export function rankToFen(rank: (Piece | null)[]): string {
  let result = '';
  let empty = 0;
  for (const cell of rank) {
    if (!cell) {
      empty++;
      continue;
    }
    if (empty > 0) {
      result += empty;
      empty = 0;
    }
    result += TYPE_TO_CHAR[cell.side][cell.type];
  }
  if (empty > 0) result += empty;
  return result;
}

/** Serialize the board + side to move to a FEN string. */
export function boardToFen(board: Board, sideToMove: Side): string {
  const ranks: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    ranks.push(rankToFen(board[rank]));
  }
  return `${ranks.join('/')} ${sideToMove === 'red' ? 'r' : 'b'}`;
}

/** Parse a single FEN rank into an array of 9 pieces/nulls. */
export function fenToRank(rankStr: string): (Piece | null)[] {
  const rank: (Piece | null)[] = [];
  for (const ch of rankStr) {
    if (ch >= '1' && ch <= '9') {
      const empty = parseInt(ch, 10);
      for (let i = 0; i < empty; i++) rank.push(null);
    } else if (CHAR_TO_PIECE[ch]) {
      rank.push({ ...CHAR_TO_PIECE[ch] });
    } else {
      throw new Error(`Invalid FEN rank character: ${ch}`);
    }
  }
  if (rank.length !== FILES) {
    throw new Error(`FEN rank has ${rank.length} files, expected ${FILES}`);
  }
  return rank;
}

/** Parse a full FEN string into { board, sideToMove }. */
export function fenToBoard(fen: string): { board: Board; sideToMove: Side } {
  const [placement, side] = fen.trim().split(/\s+/);
  if (!placement || !side) {
    throw new Error(`Invalid FEN: ${fen}`);
  }
  const rankStrs = placement.split('/');
  if (rankStrs.length !== RANKS) {
    throw new Error(`FEN has ${rankStrs.length} ranks, expected ${RANKS}`);
  }
  const board = createEmptyBoard();
  for (let i = 0; i < RANKS; i++) {
    // rankStrs[0] is rank 9 (top), rankStrs[9] is rank 0 (bottom).
    const rank = fenToRank(rankStrs[i]);
    board[RANKS - 1 - i] = rank;
  }
  if (side !== 'r' && side !== 'b') {
    throw new Error(`Invalid side to move: ${side}`);
  }
  return { board, sideToMove: side === 'r' ? 'red' : 'black' };
}

/** Stable key for repetition detection and transposition tables. */
export function positionKey(board: Board, sideToMove: Side): string {
  return boardToFen(board, sideToMove);
}
