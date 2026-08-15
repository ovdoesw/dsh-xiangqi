/**
 * Pure client game helpers (zero React/Cordis/runtime imports).
 *
 * Everything here operates on FEN strings + the core/ modules only, so it can
 * be exercised with `node --test` without pulling in the DSH client runtime.
 * The store re-exports these for the components; the plugin's controller uses
 * them directly to validate and commit moves.
 */

import {
  type Board,
  type Move,
  type Pos,
  type Piece,
  type Side,
  opponent,
  applyMove,
  cloneBoard,
  getPiece,
} from '../core/board.js';
import { fenToBoard, boardToFen, positionKey } from '../core/fen.js';
import { generateLegalMoves, isLegalMove, isInCheck } from '../core/moves.js';
import { checkGameEnd, type GameResult } from '../core/rules.js';
import { identifyOpening } from '../core/openings.js';
import {
  captionForCapture,
  captionForCheck,
  captionForCheckmate,
  captionForStalemate,
} from '../core/flavor.js';

export const HUMAN_SIDE: Side = 'red';

export type LastEventType = 'opening' | 'capture' | 'check' | 'mate';

export type LastEvent = {
  type: LastEventType;
  line: string;
};

/** Standard opening position with red (the human) to move. */
export function initialFen(): string {
  return 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r';
}

/** Parse a FEN string into { board, sideToMove }. */
export function parseFen(fen: string): { board: Board; sideToMove: Side } {
  return fenToBoard(fen);
}

/** Which side is to move right now, decoded from the FEN. */
export function sideToMove(fen: string): Side {
  return fenToBoard(fen).sideToMove;
}

/** Legal destination squares for the piece at `from`, when it is `stm`'s turn. */
export function legalDestinations(fen: string, from: Pos): Pos[] {
  const { board, sideToMove: stm } = fenToBoard(fen);
  const piece = getPiece(board, from);
  if (!piece || piece.side !== stm) return [];
  return generateLegalMoves(board, stm)
    .filter((m) => m.from.file === from.file && m.from.rank === from.rank)
    .map((m) => m.to);
}

/** Whether moving `from` -> `to` is legal for `side` in the given FEN. */
export function canMove(fen: string, side: Side, from: Pos, to: Pos): boolean {
  return isLegalMove(fenToBoard(fen).board, side, from, to);
}

/** Build a Move and the resulting FEN (with side flipped), without mutating history. */
export function moveAndFen(
  fen: string,
  side: Side,
  from: Pos,
  to: Pos,
): { move: Move; nextFen: string; captured: Piece | null } | null {
  const board = cloneBoard(fenToBoard(fen).board);
  const captured = getPiece(board, to);
  const move: Move = { from, to, captured: captured ?? undefined };
  applyMove(board, move);
  return { move, nextFen: boardToFen(board, opponent(side)), captured };
}

/** Derive the "last event" line for a just-played move from core/openings + core/flavor. */
export function detectEvent(
  _fenBefore: string,
  side: Side,
  move: Move,
  history: Move[],
  nextFen: string,
): LastEvent | null {
  const board = fenToBoard(nextFen).board;
  const oppSide = opponent(side);

  // Opening name (matches the head of the history).
  const opening = identifyOpening(history);
  if (opening && history.length <= 5) {
    return { type: 'opening', line: opening };
  }

  // Terminal check takes priority.
  const end = checkGameEnd(board, oppSide, []);
  if (end) {
    const line =
      end.reason === '将杀 checkmate' ? captionForCheckmate() : captionForStalemate();
    return { type: 'mate', line };
  }

  // Capture fluff.
  if (move.captured) {
    const line = captionForCapture(move.captured, getPiece(board, move.to) ?? undefined);
    if (line) return { type: 'capture', line };
  }

  // Check delivered to the opponent.
  if (isInCheck(board, oppSide)) {
    return { type: 'check', line: captionForCheck() };
  }

  return null;
}

/** Terminal detection (checkmate / stalemate / repetition) for `fen`. */
export function terminalResult(fen: string, historyPositions: string[]): GameResult | null {
  const { board, sideToMove: stm } = fenToBoard(fen);
  return checkGameEnd(board, stm, historyPositions);
}

/** Stable position key (FEN). */
export function keyOf(fen: string): string {
  const { board, sideToMove: stm } = fenToBoard(fen);
  return positionKey(board, stm);
}

/** Compact move notation for the comment prompt / logs. */
export function recentMoveNotation(history: Move[]): string[] {
  return history.slice(-6).map((m) => `${m.from.file}${m.from.rank}-${m.to.file}${m.to.rank}`);
}
