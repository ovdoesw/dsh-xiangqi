/**
 * Pure TypeScript search: negamax with alpha-beta pruning and iterative deepening.
 * Zero dependencies.
 */

import {
  type Board,
  type Move,
  type Side,
  opponent,
  cloneBoard,
} from '../core/board.js';
import { generateLegalMoves, isInCheck } from '../core/moves.js';
import { evaluate } from './evaluate.js';

export const CHECKMATE_SCORE = 100_000;
export const STALEMATE_SCORE = 50_000;

export type SearchResult = {
  bestMove: Move | null;
  score: number;
  depth: number;
  nodes: number;
};

export type SearchOptions = {
  maxDepth?: number;
  timeLimitMs?: number;
};

function isCapture(board: Board, move: Move): boolean {
  return board[move.to.rank][move.to.file] !== null;
}

/** Simple move ordering: captures first, then checks, then others. */
function orderMoves(board: Board, moves: Move[]): Move[] {
  return moves.slice().sort((a, b) => {
    const aCap = isCapture(board, a) ? 1 : 0;
    const bCap = isCapture(board, b) ? 1 : 0;
    if (aCap !== bCap) return bCap - aCap;
    // Center-seeking heuristic as a tie-breaker.
    const centerA = Math.abs(4 - a.to.file) + Math.abs(4.5 - a.to.rank);
    const centerB = Math.abs(4 - b.to.file) + Math.abs(4.5 - b.to.rank);
    return centerA - centerB;
  });
}

function negamax(
  board: Board,
  side: Side,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  stats: { nodes: number },
): { score: number; bestMove: Move | null } {
  stats.nodes++;

  const moves = generateLegalMoves(board, side);
  if (moves.length === 0) {
    if (isInCheck(board, side)) {
      return { score: -CHECKMATE_SCORE + ply, bestMove: null };
    }
    return { score: -STALEMATE_SCORE + ply, bestMove: null };
  }

  if (depth <= 0) {
    return { score: evaluate(board, side), bestMove: null };
  }

  const ordered = orderMoves(board, moves);
  let bestMove: Move | null = null;

  for (const move of ordered) {
    // Quick make/unmake without relying on captured field being pre-populated.
    const moving = board[move.from.rank][move.from.file];
    const captured = board[move.to.rank][move.to.file];
    board[move.to.rank][move.to.file] = moving;
    board[move.from.rank][move.from.file] = null;

    const child = negamax(
      board,
      opponent(side),
      depth - 1,
      -beta,
      -alpha,
      ply + 1,
      stats,
    );
    const score = -child.score;

    board[move.from.rank][move.from.file] = moving;
    board[move.to.rank][move.to.file] = captured;

    if (score > alpha) {
      alpha = score;
      bestMove = move;
      if (alpha >= beta) break;
    }
  }

  return { score: alpha, bestMove };
}

/** Run a fixed-depth negamax search and return the best move. */
export function searchDepth(
  board: Board,
  sideToMove: Side,
  depth: number,
): SearchResult {
  const stats = { nodes: 0 };
  const { score, bestMove } = negamax(
    board,
    sideToMove,
    depth,
    -Infinity,
    Infinity,
    0,
    stats,
  );
  return { bestMove, score, depth, nodes: stats.nodes };
}

/** Iterative deepening search.
 *  Increases depth until maxDepth or time limit is reached.
 */
export function searchIterative(
  board: Board,
  sideToMove: Side,
  options: SearchOptions = {},
): SearchResult {
  const maxDepth = options.maxDepth ?? 4;
  const timeLimit = options.timeLimitMs ?? 3000;
  const start = Date.now();
  const stats = { nodes: 0 };

  let best: SearchResult = {
    bestMove: null,
    score: evaluate(board, sideToMove),
    depth: 0,
    nodes: 0,
  };

  for (let depth = 1; depth <= maxDepth; depth++) {
    if (Date.now() - start >= timeLimit) break;
    const result = negamax(
      board,
      sideToMove,
      depth,
      -Infinity,
      Infinity,
      0,
      stats,
    );
    if (result.bestMove) {
      best = {
        bestMove: result.bestMove,
        score: result.score,
        depth,
        nodes: stats.nodes,
      };
    }
    // Stop deepening if a forced mate is found for us.
    if (result.score >= CHECKMATE_SCORE - 100) break;
  }

  return best;
}

/** Convenience: search on a cloned board so the caller's board is untouched. */
export function searchClone(
  board: Board,
  sideToMove: Side,
  options: SearchOptions = {},
): SearchResult {
  return searchIterative(cloneBoard(board), sideToMove, options);
}
