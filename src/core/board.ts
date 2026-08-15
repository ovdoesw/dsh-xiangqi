/**
 * Pure TypeScript core: 9×10 Chinese chess board representation.
 * Zero external dependencies.
 */

export type Side = 'red' | 'black';

export type PieceType =
  | 'king'
  | 'advisor'
  | 'elephant'
  | 'horse'
  | 'rook'
  | 'cannon'
  | 'pawn';

export interface Piece {
  side: Side;
  type: PieceType;
}

export interface Pos {
  file: number; // 0-8, left to right from red's perspective
  rank: number; // 0-9, bottom to top from red's perspective
}

export interface Move {
  from: Pos;
  to: Pos;
  captured?: Piece;
}

export type Board = (Piece | null)[][];

export const FILES = 9;
export const RANKS = 10;

export const RED_SIDE: Side = 'red';
export const BLACK_SIDE: Side = 'black';

export function opponent(side: Side): Side {
  return side === 'red' ? 'black' : 'red';
}

/** Returns a deep clone of the board. */
export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

/** Create an empty board. */
export function createEmptyBoard(): Board {
  return Array.from({ length: RANKS }, () => Array.from({ length: FILES }, () => null));
}

/** Place a piece on the board, returning the previous occupant (if any). */
export function placePiece(
  board: Board,
  pos: Pos,
  piece: Piece | null,
): Piece | null {
  const old = board[pos.rank][pos.file];
  board[pos.rank][pos.file] = piece ? { ...piece } : null;
  return old;
}

/** Get piece at a position. */
export function getPiece(
  board: Board,
  pos: Pos,
): Piece | null {
  return board[pos.rank]?.[pos.file] ?? null;
}

/** Remove and return piece at a position. */
export function removePiece(
  board: Board,
  pos: Pos,
): Piece | null {
  const piece = board[pos.rank][pos.file];
  board[pos.rank][pos.file] = null;
  return piece;
}

/** Apply a move to a board (mutating). Captured piece is recorded on the move. */
export function applyMove(board: Board, move: Move): void {
  const piece = removePiece(board, move.from);
  if (!piece) {
    throw new Error(`Illegal move: no piece at ${move.from.file},${move.from.rank}`);
  }
  const captured = removePiece(board, move.to);
  placePiece(board, move.to, piece);
  move.captured = captured ?? undefined;
}

/** Undo a previously applied move (mutating). */
export function undoMove(board: Board, move: Move): void {
  const piece = removePiece(board, move.to);
  if (!piece) {
    throw new Error(`Cannot undo move: no piece at destination`);
  }
  placePiece(board, move.from, piece);
  if (move.captured) {
    placePiece(board, move.to, move.captured);
  }
}

/** Find the position of a king (general) for the given side. */
export function findKing(board: Board, side: Side): Pos | null {
  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (piece && piece.side === side && piece.type === 'king') {
        return { file, rank };
      }
    }
  }
  return null;
}

/** Create the standard starting board. Red at bottom (ranks 0-4), black at top (ranks 5-9). */
export function createInitialBoard(): Board {
  const board = createEmptyBoard();

  const backRank: PieceType[] = [
    'rook',
    'horse',
    'elephant',
    'advisor',
    'king',
    'advisor',
    'elephant',
    'horse',
    'rook',
  ];

  for (let file = 0; file < FILES; file++) {
    board[0][file] = { side: 'red', type: backRank[file] };
    board[9][file] = { side: 'black', type: backRank[file] };
  }

  board[2][1] = { side: 'red', type: 'cannon' };
  board[2][7] = { side: 'red', type: 'cannon' };
  board[7][1] = { side: 'black', type: 'cannon' };
  board[7][7] = { side: 'black', type: 'cannon' };

  const pawnFiles = [0, 2, 4, 6, 8];
  for (const file of pawnFiles) {
    board[3][file] = { side: 'red', type: 'pawn' };
    board[6][file] = { side: 'black', type: 'pawn' };
  }

  return board;
}

/** Basic position equality. */
export function posEq(a: Pos, b: Pos): boolean {
  return a.file === b.file && a.rank === b.rank;
}

/** Encode a position to a compact string key. */
export function posKey(pos: Pos): string {
  return `${pos.file},${pos.rank}`;
}
