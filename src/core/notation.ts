/**
 * Pure TypeScript: traditional Chinese xiangqi notation (记谱法).
 * Zero dependencies.
 *
 * Produces the standard human-readable move text, e.g. 炮二平五, 马八进七,
 * 前车进一. Red uses Chinese numerals on files 1-9 left→right; black uses
 * Arabic numerals on files 1-9 right→left (from black's own perspective).
 *
 * Rules covered:
 * - 平 (sideways) for any piece.
 * - 进/退 (forward/backward) with a step count for 车/炮/兵, and with the
 *   destination file for 马/相/士/帅将.
 * - 前/中/后 disambiguation when two or three identical pieces share a file.
 */

import {
  type Board,
  type Move,
  type Piece,
  type PieceType,
  type Side,
  RANKS,
} from './board.js';

/** Piece names used in written notation (simplified Chinese). */
export const NOTATION_PIECE_NAMES: Record<Side, Record<PieceType, string>> = {
  red: { king: '帅', advisor: '仕', elephant: '相', horse: '马', rook: '车', cannon: '炮', pawn: '兵' },
  black: { king: '将', advisor: '士', elephant: '象', horse: '马', rook: '车', cannon: '炮', pawn: '卒' },
};

const RED_DIGITS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

/** File (column) label for a side's own perspective.
 *  Red: file 0 → 一 … file 8 → 九 (left→right).
 *  Black: file 8 → 1 … file 0 → 9 (black sees its files from right to left).
 */
export function fileNotation(file: number, side: Side): string {
  if (side === 'red') return RED_DIGITS[file] ?? String(file + 1);
  return String(9 - file);
}

/** How many identical same-side pieces share `from`'s file (excluding `from`). */
function sameFilePeers(board: Board, piece: Piece, from: { file: number; rank: number }): {
  ahead: number;
  behind: number;
} {
  let ahead = 0;
  let behind = 0;
  for (let rank = 0; rank < RANKS; rank++) {
    if (rank === from.rank) continue;
    const other = board[rank][from.file];
    if (!other || other.side !== piece.side || other.type !== piece.type) continue;
    // "Ahead" is toward the enemy camp: red moves up (larger rank), black moves
    // down (smaller rank). A peer at rank > from.rank is ahead for red, behind
    // for black.
    const isAheadForRed = rank > from.rank;
    const aheadNow = piece.side === 'red' ? isAheadForRed : !isAheadForRed;
    if (aheadNow) ahead++;
    else behind++;
  }
  return { ahead, behind };
}

/** 前/中/后 prefix when identical pieces share the starting file. */
function frontBackPrefix(board: Board, piece: Piece, from: { file: number; rank: number }): string {
  const { ahead, behind } = sameFilePeers(board, piece, from);
  if (ahead + behind === 0) return '';
  if (ahead > 0 && behind > 0) return '中';
  // "ahead" = at least one peer sits toward the enemy camp relative to `from`,
  // so `from` is the rearmost piece → 后. Only peers behind it → it is 前.
  return behind > 0 ? '前' : '后';
}

/**
 * Traditional notation for one move on the board BEFORE the move is applied.
 * @param board - position before the move (the moving piece at `move.from`).
 * @param move - the move to describe.
 * @returns e.g. "炮二平五", "马八进七", "前车进一".
 */
export function chineseNotation(board: Board, move: Move): string {
  const piece = board[move.from.rank]?.[move.from.file];
  if (!piece) return `${move.from.file}${move.from.rank}-${move.to.file}${move.to.rank}`;

  const name = NOTATION_PIECE_NAMES[piece.side][piece.type];
  const prefix = frontBackPrefix(board, piece, move.from);
  const fromFile = fileNotation(move.from.file, piece.side);
  const toFile = fileNotation(move.to.file, piece.side);
  const dy = move.to.rank - move.from.rank;
  const forward = piece.side === 'red' ? 1 : -1;
  // With a 前/中/后 prefix the origin file is implicit ("前车进一"), so it is
  // omitted; without one it is written ("车一进一").
  const fromPart = prefix ? '' : fromFile;

  if (move.to.rank === move.from.rank) {
    // Sideways move: 平 to the destination file.
    return `${prefix}${name}${fromPart}平${toFile}`;
  }

  // Any vertical component (straight or diagonal — 马/相/士/帅将) is 进/退.
  const advancing = dy * forward > 0;
  const action = advancing ? '进' : '退';
  // 车/炮/兵卒 record the number of steps; 马/相/士/帅将 record the
  // destination file.
  if (piece.type === 'rook' || piece.type === 'cannon' || piece.type === 'pawn') {
    const steps = Math.abs(dy);
    return `${prefix}${name}${fromPart}${action}${RED_DIGITS[steps - 1] ?? steps}`;
  }
  return `${prefix}${name}${fromPart}${action}${toFile}`;
}
