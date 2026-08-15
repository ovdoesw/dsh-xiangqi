/**
 * Pure TypeScript AI evaluation: material + simple positional scores.
 * Zero dependencies.
 */

import {
  type Board,
  type Piece,
  type PieceType,
  type Side,
  RANKS,
  FILES,
} from '../core/board.js';

export const MATERIAL: Record<PieceType, number> = {
  king: 10000,
  rook: 900,
  cannon: 450,
  horse: 400,
  elephant: 200,
  advisor: 200,
  pawn: 100,
};

/** Piece-square tables for red. Black scores are mirrored vertically. */
const PST: Record<PieceType, number[]> = {
  // Pawns: encourage advancing and crossing the river.
  pawn: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, // rank 0
    5, 5, 5, 5, 5, 5, 5, 5, 5, // rank 1
    10, 10, 10, 10, 10, 10, 10, 10, 10, // rank 2
    15, 15, 15, 20, 20, 15, 15, 15, 15, // rank 3
    25, 25, 25, 30, 30, 25, 25, 25, 25, // rank 4 (river edge)
    35, 35, 40, 45, 45, 40, 35, 35, 35, // rank 5 (crossed)
    45, 45, 50, 55, 55, 50, 45, 45, 45,
    55, 55, 60, 65, 65, 60, 55, 55, 55,
    70, 70, 75, 80, 80, 75, 70, 70, 70,
    90, 90, 95, 100, 100, 95, 90, 90, 90, // rank 9 (deep in enemy territory)
  ],
  // Horses: centralize and avoid river corners.
  horse: [
    -10, -5, 0, 5, 5, 5, 0, -5, -10,
    -5, 0, 10, 15, 15, 15, 10, 0, -5,
    0, 10, 20, 25, 25, 25, 20, 10, 0,
    5, 15, 25, 35, 35, 35, 25, 15, 5,
    5, 15, 30, 40, 40, 40, 30, 15, 5,
    5, 15, 30, 40, 40, 40, 30, 15, 5,
    5, 15, 25, 35, 35, 35, 25, 15, 5,
    0, 10, 20, 25, 25, 25, 20, 10, 0,
    -5, 0, 10, 15, 15, 15, 10, 0, -5,
    -10, -5, 0, 5, 5, 5, 0, -5, -10,
  ],
  // Rooks: encourage open files and 7th-rank activity.
  rook: [
    0, 0, 0, 5, 5, 5, 0, 0, 0,
    0, 5, 5, 10, 10, 10, 5, 5, 0,
    0, 5, 10, 15, 15, 15, 10, 5, 0,
    5, 10, 15, 20, 20, 20, 15, 10, 5,
    5, 10, 15, 20, 20, 20, 15, 10, 5,
    5, 10, 15, 20, 20, 20, 15, 10, 5,
    5, 10, 15, 20, 20, 20, 15, 10, 5,
    10, 15, 20, 25, 25, 25, 20, 15, 10,
    15, 20, 25, 30, 30, 30, 25, 20, 15,
    20, 25, 30, 35, 35, 35, 30, 25, 20,
  ],
  // Cannons: central files and advanced positions.
  cannon: [
    0, 5, 5, 10, 10, 10, 5, 5, 0,
    0, 5, 10, 15, 15, 15, 10, 5, 0,
    5, 10, 15, 20, 20, 20, 15, 10, 5,
    5, 10, 20, 25, 25, 25, 20, 10, 5,
    5, 10, 20, 30, 30, 30, 20, 10, 5,
    5, 10, 20, 30, 30, 30, 20, 10, 5,
    5, 10, 20, 25, 25, 25, 20, 10, 5,
    5, 10, 15, 20, 20, 20, 15, 10, 5,
    0, 5, 10, 15, 15, 15, 10, 5, 0,
    0, 5, 5, 10, 10, 10, 5, 5, 0,
  ],
  // Elephant: keep home-side defensive shape.
  elephant: [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 10, 0, 0, 0, 10, 0, 0,
    0, 0, 0, 5, 0, 5, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 5, 0, 5, 0, 0, 0,
    0, 0, 10, 0, 0, 0, 10, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  // Advisor: palace centre is best.
  advisor: [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 10, 0, 10, 0, 0, 0,
    0, 0, 0, 0, 20, 0, 0, 0, 0,
    0, 0, 0, 0, 20, 0, 0, 0, 0,
    0, 0, 0, 10, 0, 10, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  // King: central file preferred, safety by staying back.
  king: [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 10, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 10, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
};

function pstIndex(piece: Piece, rank: number, file: number): number {
  const r = piece.side === 'red' ? rank : RANKS - 1 - rank;
  return r * FILES + file;
}

/** Evaluate the board from the perspective of `sideToMove`.
 *  Positive = better for sideToMove; negative = worse.
 */
export function evaluate(board: Board, sideToMove: Side): number {
  let redScore = 0;
  let blackScore = 0;

  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (!piece) continue;
      const value = MATERIAL[piece.type] + PST[piece.type][pstIndex(piece, rank, file)];
      if (piece.side === 'red') redScore += value;
      else blackScore += value;
    }
  }

  const myScore = sideToMove === 'red' ? redScore : blackScore;
  const oppScore = sideToMove === 'red' ? blackScore : redScore;
  // Small tempo bonus for being the side to move.
  return myScore - oppScore + 15;
}

/** Estimated game phase (0 = opening, 1 = endgame). Simplistic. */
export function gamePhase(board: Board): number {
  let majorPieces = 0;
  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (piece && (piece.type === 'rook' || piece.type === 'cannon' || piece.type === 'horse')) {
        majorPieces++;
      }
    }
  }
  // Starts at ~8 major pieces per side, endgame around <= 4 total.
  const clamped = Math.max(0, Math.min(16, majorPieces));
  return 1 - clamped / 16;
}
