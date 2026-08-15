/**
 * Pure TypeScript core: legal move generation for Chinese chess.
 * Handles all special rules: horse leg, cannon platform, elephant eye,
 * palace advisors/kings, river restriction, pawn promotion, kings facing.
 */

import {
  type Piece,
  type PieceType,
  type Pos,
  type Move,
  type Side,
  type Board,
  getPiece,
  applyMove,
  undoMove,
  findKing,
  opponent,
  FILES,
  RANKS,
} from './board.js';

export type { Move, Pos, Piece, Side, Board };

export function isValidPos(pos: Pos): boolean {
  return pos.file >= 0 && pos.file < FILES && pos.rank >= 0 && pos.rank < RANKS;
}

/** The 3×3 palace spans files 3-5. Red palace ranks 0-2, black palace ranks 7-9. */
export function isInPalace(pos: Pos, side: Side): boolean {
  if (pos.file < 3 || pos.file > 5) return false;
  if (side === 'red') return pos.rank >= 0 && pos.rank <= 2;
  return pos.rank >= 7 && pos.rank <= 9;
}

/** Count pieces strictly between two positions (must share a file or rank). */
export function countBetween(board: Board, from: Pos, to: Pos): number {
  let count = 0;
  if (from.file === to.file) {
    const step = to.rank > from.rank ? 1 : -1;
    for (let r = from.rank + step; r !== to.rank; r += step) {
      if (board[r][from.file]) count++;
    }
  } else if (from.rank === to.rank) {
    const step = to.file > from.file ? 1 : -1;
    for (let f = from.file + step; f !== to.file; f += step) {
      if (board[from.rank][f]) count++;
    }
  }
  return count;
}

/** Whether a piece at `from` attacks `to` according to movement geometry.
 *  Does NOT account for check or turn order; used for attack detection.
 */
export function pieceAttacks(board: Board, from: Pos, to: Pos): boolean {
  if (!isValidPos(from) || !isValidPos(to)) return false;
  const attacker = board[from.rank][from.file];
  if (!attacker) return false;

  const dx = to.file - from.file;
  const dy = to.rank - from.rank;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const target = board[to.rank][to.file];

  switch (attacker.type) {
    case 'rook': {
      if (dx !== 0 && dy !== 0) return false;
      return countBetween(board, from, to) === 0;
    }

    case 'cannon': {
      if (dx !== 0 && dy !== 0) return false;
      const between = countBetween(board, from, to);
      if (target) return between === 1;
      return between === 0;
    }

    case 'horse': {
      // Move one step orthogonally, then one step diagonally outward.
      if (adx === 2 && ady === 1) {
        const legFile = from.file + (dx > 0 ? 1 : -1);
        return board[from.rank][legFile] === null;
      }
      if (adx === 1 && ady === 2) {
        const legRank = from.rank + (dy > 0 ? 1 : -1);
        return board[legRank][from.file] === null;
      }
      return false;
    }

    case 'elephant': {
      if (adx !== 2 || ady !== 2) return false;
      // Eye (center of the 田) must be empty.
      const eye: Pos = { file: from.file + dx / 2, rank: from.rank + dy / 2 };
      if (board[eye.rank][eye.file]) return false;
      // Cannot cross the river.
      if (attacker.side === 'red' && to.rank > 4) return false;
      if (attacker.side === 'black' && to.rank < 5) return false;
      return true;
    }

    case 'advisor': {
      if (adx !== 1 || ady !== 1) return false;
      return isInPalace(from, attacker.side) && isInPalace(to, attacker.side);
    }

    case 'king': {
      // Kings move one orthogonal step inside their OWN palace, and also
      // threateningly "face" the opposing king along an open palace file.
      if (dx === 0 && dy === 0) return false;
      // Adjacent orthogonal step: both ends must be inside the king's own palace.
      if (adx + ady === 1) {
        return (
          isInPalace(from, attacker.side) &&
          isInPalace(to, attacker.side)
        );
      }
      // "Facing" threat: same file, nothing between, attacker king in its own
      // palace, target on the palace files (the opposing king column).
      if (adx === 0 && dy !== 0) {
        return (
          countBetween(board, from, to) === 0 &&
          isInPalace(from, attacker.side) &&
          to.file >= 3 &&
          to.file <= 5
        );
      }
      return false;
    }

    case 'pawn': {
      const forward = attacker.side === 'red' ? 1 : -1;
      const crossedRiver =
        attacker.side === 'red' ? from.rank >= 5 : from.rank <= 4;
      // Forward step.
      if (dx === 0 && dy === forward) return true;
      // Sideways after crossing river.
      if (crossedRiver && dy === 0 && adx === 1) return true;
      return false;
    }
  }
}

/** Is the given square attacked by the specified side? */
export function isSquareAttacked(
  board: Board,
  pos: Pos,
  bySide: Side,
): boolean {
  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (piece && piece.side === bySide) {
        if (pieceAttacks(board, { file, rank }, pos)) return true;
      }
    }
  }
  return false;
}

/** Is the king of `side` currently in check? */
export function isInCheck(board: Board, side: Side): boolean {
  const kingPos = findKing(board, side);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos, opponent(side));
}

/** Generate pseudo-legal destination squares for a piece at `pos`.
 *  Does not filter out moves that leave the king in check.
 */
export function generatePseudoDestinations(board: Board, pos: Pos): Pos[] {
  const piece = getPiece(board, pos);
  if (!piece) return [];
  const dests: Pos[] = [];

  const addIfReachable = (to: Pos, extra?: () => boolean) => {
    if (!isValidPos(to)) return;
    const occupant = board[to.rank][to.file];
    if (occupant && occupant.side === piece.side) return;
    if (extra && !extra()) return;
    dests.push(to);
  };

  switch (piece.type) {
    case 'rook': {
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      for (const [df, dr] of dirs) {
        let f = pos.file + df;
        let r = pos.rank + dr;
        while (isValidPos({ file: f, rank: r })) {
          const occupant = board[r][f];
          addIfReachable({ file: f, rank: r });
          if (occupant) break;
          f += df;
          r += dr;
        }
      }
      break;
    }

    case 'cannon': {
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      for (const [df, dr] of dirs) {
        let f = pos.file + df;
        let r = pos.rank + dr;
        let seenPlatform = false;
        while (isValidPos({ file: f, rank: r })) {
          const occupant = board[r][f];
          if (!seenPlatform) {
            // Before the platform: empty squares are plain moves; any piece
            // (friend or foe) becomes the platform — the cannon cannot capture
            // without first reaching a screen.
            if (occupant) {
              seenPlatform = true;
            } else {
              dests.push({ file: f, rank: r });
            }
          } else {
            // After the platform: skip empty squares and capture the FIRST
            // enemy piece (a cannon fires over exactly one screen, however far
            // the target sits beyond it); a friendly piece there is not a legal
            // capture and also ends the ray.
            if (occupant) {
              if (occupant.side !== piece.side) {
                dests.push({ file: f, rank: r });
              }
              break;
            }
          }
          f += df;
          r += dr;
        }
      }
      break;
    }

    case 'horse': {
      const horseJumps = [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2],
      ];
      for (const [df, dr] of horseJumps) {
        const to: Pos = { file: pos.file + df, rank: pos.rank + dr };
        addIfReachable(to, () => pieceAttacks(board, pos, to));
      }
      break;
    }

    case 'elephant': {
      const diagonals = [
        [2, 2],
        [2, -2],
        [-2, 2],
        [-2, -2],
      ];
      for (const [df, dr] of diagonals) {
        const to: Pos = { file: pos.file + df, rank: pos.rank + dr };
        addIfReachable(to, () => pieceAttacks(board, pos, to));
      }
      break;
    }

    case 'advisor': {
      const diagonals = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
      for (const [df, dr] of diagonals) {
        const to: Pos = { file: pos.file + df, rank: pos.rank + dr };
        addIfReachable(to, () => isInPalace(to, piece.side));
      }
      break;
    }

    case 'king': {
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ];
      for (const [df, dr] of dirs) {
        const to: Pos = { file: pos.file + df, rank: pos.rank + dr };
        addIfReachable(to, () => isInPalace(to, piece.side));
      }
      break;
    }

    case 'pawn': {
      const forward = piece.side === 'red' ? 1 : -1;
      const crossedRiver =
        piece.side === 'red' ? pos.rank >= 5 : pos.rank <= 4;
      addIfReachable({ file: pos.file, rank: pos.rank + forward });
      if (crossedRiver) {
        addIfReachable({ file: pos.file + 1, rank: pos.rank });
        addIfReachable({ file: pos.file - 1, rank: pos.rank });
      }
      break;
    }
  }

  return dests;
}

/** Generate all legal moves for `side` on the board.
 *  Filters pseudo-legal moves by the "cannot leave/put own king in check" rule.
 */
export function generateLegalMoves(board: Board, side: Side): Move[] {
  const legal: Move[] = [];
  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (!piece || piece.side !== side) continue;
      const from: Pos = { file, rank };
      const dests = generatePseudoDestinations(board, from);
      for (const to of dests) {
        const move: Move = { from, to };
        applyMove(board, move);
        const stillSafe = !isInCheck(board, side);
        undoMove(board, move);
        if (stillSafe) {
          legal.push(move);
        }
      }
    }
  }
  return legal;
}

/** Convenience: is a specific move legal for `side`? */
export function isLegalMove(
  board: Board,
  side: Side,
  from: Pos,
  to: Pos,
): boolean {
  const piece = getPiece(board, from);
  if (!piece || piece.side !== side) return false;
  const dests = generatePseudoDestinations(board, from);
  if (!dests.some((d) => d.file === to.file && d.rank === to.rank)) return false;
  const move: Move = { from, to };
  applyMove(board, move);
  const safe = !isInCheck(board, side);
  undoMove(board, move);
  return safe;
}

/** Generate a SAN-like short notation for a move (Chinese character + from/to). */
export function moveNotation(board: Board, move: Move): string {
  const piece = board[move.from.rank][move.from.file];
  if (!piece) return `${move.from.file}${move.from.rank}->${move.to.file}${move.to.rank}`;
  const names: Record<Side, Record<PieceType, string>> = {
    red: {
      king: '帅',
      advisor: '仕',
      elephant: '相',
      horse: '傌',
      rook: '俥',
      cannon: '炮',
      pawn: '兵',
    },
    black: {
      king: '將',
      advisor: '士',
      elephant: '象',
      horse: '馬',
      rook: '車',
      cannon: '砲',
      pawn: '卒',
    },
  };
  return `${names[piece.side][piece.type]} ${move.from.file}${move.from.rank}->${move.to.file}${move.to.rank}`;
}
