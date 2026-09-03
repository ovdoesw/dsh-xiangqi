/**
 * Pure TypeScript core: check, checkmate, stalemate, and simplified repetition.
 */

import { type Board, type Side, opponent } from './board.js';
import { generateLegalMoves, isInCheck } from './moves.js';

export type GameResult = {
  winner: Side | 'draw';
  reason: string;
};

/** True if `side` has no legal moves and is currently in check -> checkmate. */
export function isCheckmate(board: Board, side: Side): boolean {
  return isInCheck(board, side) && generateLegalMoves(board, side).length === 0;
}

/** True if `side` has no legal moves and is NOT in check -> stalemate (判负). */
export function isStalemate(board: Board, side: Side): boolean {
  return !isInCheck(board, side) && generateLegalMoves(board, side).length === 0;
}

/** Determine if the game is over by checkmate or stalemate for the side to move. */
export function checkTerminalByImmobility(
  board: Board,
  sideToMove: Side,
): GameResult | null {
  const moves = generateLegalMoves(board, sideToMove);
  if (moves.length > 0) return null;
  if (isInCheck(board, sideToMove)) {
    return {
      winner: opponent(sideToMove),
      reason: '将杀 checkmate',
    };
  }
  return {
    winner: opponent(sideToMove),
    reason: '困毙 stalemate',
  };
}

/** Simplified repetition rule:
 *  If the exact same position (including side to move) appears three times,
 *  the side that made the repetition loses (approximation of 长将判负 — the
 *  perpetual checker is the one at fault, so the side who is NOT to move in
 *  the repeated position is declared the loser).
 *
 *  @param positionHistory array of position keys in chronological order.
 *                       Each key must encode side to move (e.g. a FEN string).
 *  @param sideToMove      side whose turn it is in the latest position.
 */
export function detectRepetition(
  positionHistory: string[],
  sideToMove: Side,
): GameResult | null {
  if (positionHistory.length < 3) return null;
  const last = positionHistory[positionHistory.length - 1];
  let count = 0;
  for (const pos of positionHistory) {
    if (pos === last) count++;
  }
  if (count >= 3) {
    return {
      // The repeated position is produced by the opponent of `sideToMove`
      // (they just moved into it); the perpetual checker / repetition-maker
      // is the one at fault. Winner = sideToMove (the non-repeating side).
      winner: sideToMove,
      reason: '长将/重复局面 repetition',
    };
  }
  return null;
}

/** Combined terminal check: immobility first, then repetition. */
export function checkGameEnd(
  board: Board,
  sideToMove: Side,
  positionHistory: string[],
): GameResult | null {
  return (
    checkTerminalByImmobility(board, sideToMove) ??
    detectRepetition(positionHistory, sideToMove)
  );
}
