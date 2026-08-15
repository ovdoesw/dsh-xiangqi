/**
 * Pure TypeScript engine facade: difficulty tiers and async getBestMove.
 * Zero dependencies, no React/Cordis.
 */

import { type Board, type Move, type Side, opponent } from '../core/board.js';
import { fenToBoard } from '../core/fen.js';
import { generateLegalMoves } from '../core/moves.js';
import { evaluate } from './evaluate.js';
import { searchIterative, searchDepth, type SearchResult } from './search.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type EngineResult = {
  move: Move | null;
  score: number;
  depth: number;
  nodes: number;
  difficulty: Difficulty;
};

function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

/** Pick one of the top-k moves with small random perturbation for easy mode. */
function pickWithPerturbation(
  board: Board,
  sideToMove: Side,
  topK: number,
): SearchResult {
  const moves = generateLegalMoves(board, sideToMove);
  if (moves.length === 0) {
    return { bestMove: null, score: 0, depth: 0, nodes: 0 };
  }

  const scored = moves.map((move) => {
    const moving = board[move.from.rank][move.from.file];
    const captured = board[move.to.rank][move.to.file];
    board[move.to.rank][move.to.file] = moving;
    board[move.from.rank][move.from.file] = null;
    const score = -evaluate(board, opponent(sideToMove));
    board[move.from.rank][move.from.file] = moving;
    board[move.to.rank][move.to.file] = captured;
    return { move, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const k = Math.min(topK, scored.length);
  const chosen = scored[randomInt(k)];
  return {
    bestMove: chosen.move,
    score: chosen.score,
    depth: 1,
    nodes: scored.length,
  };
}

/** Convert a SearchResult into the public EngineResult shape. */
function toEngineResult(
  result: SearchResult,
  difficulty: Difficulty,
): EngineResult {
  return {
    move: result.bestMove,
    score: result.score,
    depth: result.depth,
    nodes: result.nodes,
    difficulty,
  };
}

/** Async best-move selector. Parses FEN, searches by difficulty, returns move.
 *  Uses setTimeout to yield to the event loop before heavy calculation.
 */
export function getBestMove(
  fen: string,
  difficulty: Difficulty,
): Promise<EngineResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const { board, sideToMove } = fenToBoard(fen);
        let result: SearchResult;
        switch (difficulty) {
          case 'easy':
            result = pickWithPerturbation(board, sideToMove, 3);
            break;
          case 'medium':
            result = searchDepth(board, sideToMove, 2);
            break;
          case 'hard':
            result = searchIterative(board, sideToMove, {
              maxDepth: 4,
              timeLimitMs: 5000,
            });
            break;
          default:
            result = searchDepth(board, sideToMove, 2);
        }
        resolve(toEngineResult(result, difficulty));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}

/** Synchronous variant for callers that do not need async yielding. */
export function getBestMoveSync(fen: string, difficulty: Difficulty): EngineResult {
  const { board, sideToMove } = fenToBoard(fen);
  let result: SearchResult;
  switch (difficulty) {
    case 'easy':
      result = pickWithPerturbation(board, sideToMove, 3);
      break;
    case 'medium':
      result = searchDepth(board, sideToMove, 2);
      break;
    case 'hard':
      result = searchIterative(board, sideToMove, {
        maxDepth: 4,
        timeLimitMs: 5000,
      });
      break;
    default:
      result = searchDepth(board, sideToMove, 2);
  }
  return toEngineResult(result, difficulty);
}
