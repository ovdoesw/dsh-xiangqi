/**
 * Pure TypeScript: build a full game record (棋谱) from a move history.
 * Zero dependencies — usable from node --test and the client alike.
 */

import { type Board, type Move, applyMove, cloneBoard } from '../core/board.js';
import { fenToBoard } from '../core/fen.js';
import { chineseNotation } from '../core/notation.js';
import { checkGameEnd, type GameResult } from '../core/rules.js';

export interface RecordEntry {
  /** 1-based move number (one full round = one entry). */
  round: number;
  red: string;
  black: string;
}

/**
 * Replay `history` from `initialFen` and produce one traditional-notation
 * line per round. Also reports the terminal result if the record ends in
 * checkmate / stalemate / repetition.
 */
export function buildRecord(
  initialFen: string,
  history: Move[],
): { lines: string[]; entries: RecordEntry[]; result: GameResult | null } {
  let board: Board = cloneBoard(fenToBoard(initialFen).board);
  const entries: RecordEntry[] = [];
  let result: GameResult | null = null;

  for (let i = 0; i < history.length; i += 2) {
    const round = Math.floor(i / 2) + 1;
    const redMove = history[i];
    const redNotation = redMove ? chineseNotation(board, redMove) : '--';
    if (redMove) applyMove(board, redMove);

    let blackNotation = '';
    if (i + 1 < history.length) {
      const blackMove = history[i + 1];
      blackNotation = chineseNotation(board, blackMove);
      applyMove(board, blackMove);
    }

    entries.push({ round, red: redNotation, black: blackNotation });

    // Terminal detection after the full round (or after red's lone move).
    const stm = i + 1 < history.length ? 'red' : 'black';
    if (i + 1 >= history.length || i + 1 === history.length - 1) {
      const end = checkGameEnd(board, stm, []);
      if (end) {
        result = end;
        break;
      }
    }
  }

  const lines = entries.map((e) => `${e.round}. ${e.red}${e.black ? ' ' + e.black : ''}`);
  return { lines, entries, result };
}

/** Plain-text record with a result suffix, e.g. "1. 炮二平五 马8进7\n…". */
export function recordText(
  initialFen: string,
  history: Move[],
  opts: { title?: string } = {},
): string {
  const { lines, result } = buildRecord(initialFen, history);
  const body = lines.join('\n');
  const suffix = result
    ? `\n\n${result.winner === 'draw' ? '和棋' : `${result.winner === 'red' ? '红' : '黑'}方胜`}（${result.reason}）`
    : '';
  if (opts.title) return `${opts.title}\n${'─'.repeat(opts.title.length)}\n${body}${suffix}`;
  return `${body}${suffix}`;
}
