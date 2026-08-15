import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyBoard, type Board, type Piece } from '../src/core/board.js';
import {
  generateLegalMoves,
  generatePseudoDestinations,
  isLegalMove,
  isSquareAttacked,
  pieceAttacks,
} from '../src/core/moves.js';

function p(side: Piece['side'], type: Piece['type']): Piece {
  return { side, type };
}

function set(board: Board, file: number, rank: number, piece: Piece | null) {
  board[rank][file] = piece;
}

describe('move generation special rules', () => {
  it('blocks horse when its leg is pinned', () => {
    const board = createEmptyBoard();
    // Red horse at (4,3). Leg at (4,4) if moving to (5,5)?
    // Let's use standard: horse at (1,0), leg at (1,1) blocks (0,2) and (2,2).
    set(board, 1, 0, p('red', 'horse'));
    set(board, 1, 1, p('red', 'pawn'));
    const dests = generatePseudoDestinations(board, { file: 1, rank: 0 });
    // Without leg it could reach (0,2),(2,2),(3,1),(-1,1) etc.
    assert.ok(!dests.some((d) => d.file === 0 && d.rank === 2));
    assert.ok(!dests.some((d) => d.file === 2 && d.rank === 2));
    // Other directions still work, e.g. (3,1) from (1,0) via leg (2,0).
    assert.ok(dests.some((d) => d.file === 3 && d.rank === 1));
  });

  it('allows horse when the leg square is empty', () => {
    const board = createEmptyBoard();
    set(board, 1, 0, p('red', 'horse'));
    const dests = generatePseudoDestinations(board, { file: 1, rank: 0 });
    assert.ok(dests.some((d) => d.file === 0 && d.rank === 2));
    assert.ok(dests.some((d) => d.file === 2 && d.rank === 2));
  });

  it('cannon captures over one platform even with empty squares beyond it', () => {
    const board = createEmptyBoard();
    set(board, 4, 2, p('red', 'cannon'));
    set(board, 4, 4, p('red', 'pawn')); // platform
    // empty at (4,5), black target at (4,6) — the cannon skips the empty square.
    set(board, 4, 6, p('black', 'pawn'));
    const dests = generatePseudoDestinations(board, { file: 4, rank: 2 });
    assert.ok(dests.some((d) => d.file === 4 && d.rank === 6));
  });

  it('cannon cannot capture without a platform (unlike a rook)', () => {
    const board = createEmptyBoard();
    set(board, 4, 2, p('red', 'cannon'));
    set(board, 4, 6, p('black', 'pawn'));
    const dests = generatePseudoDestinations(board, { file: 4, rank: 2 });
    // Must not capture (4,6) directly — that needs a screen.
    assert.ok(!dests.some((d) => d.file === 4 && d.rank === 6));
    // The empty square just before the target is a plain move.
    assert.ok(dests.some((d) => d.file === 4 && d.rank === 5));
  });

  it('requires exactly one platform for cannon captures', () => {
    const board = createEmptyBoard();
    // Red cannon at (4,2), black target at (4,6), platform at (4,4).
    set(board, 4, 2, p('red', 'cannon'));
    set(board, 4, 4, p('red', 'pawn'));
    set(board, 4, 6, p('black', 'pawn'));
    assert.ok(pieceAttacks(board, { file: 4, rank: 2 }, { file: 4, rank: 6 }));

    // No platform: cannot capture.
    const board2 = createEmptyBoard();
    set(board2, 4, 2, p('red', 'cannon'));
    set(board2, 4, 6, p('black', 'pawn'));
    assert.ok(!pieceAttacks(board2, { file: 4, rank: 2 }, { file: 4, rank: 6 }));

    // Two platforms: cannot capture.
    const board3 = createEmptyBoard();
    set(board3, 4, 2, p('red', 'cannon'));
    set(board3, 4, 3, p('red', 'pawn'));
    set(board3, 4, 4, p('red', 'pawn'));
    set(board3, 4, 6, p('black', 'pawn'));
    assert.ok(!pieceAttacks(board3, { file: 4, rank: 2 }, { file: 4, rank: 6 }));
  });

  it('blocks elephant when its eye is occupied', () => {
    const board = createEmptyBoard();
    // Red elephant at (2,0) wants to go to (4,2); eye is (3,1).
    set(board, 2, 0, p('red', 'elephant'));
    set(board, 3, 1, p('red', 'pawn'));
    const dests = generatePseudoDestinations(board, { file: 2, rank: 0 });
    assert.ok(!dests.some((d) => d.file === 4 && d.rank === 2));
  });

  it('prevents elephant from crossing the river', () => {
    const board = createEmptyBoard();
    set(board, 2, 4, p('red', 'elephant')); // exactly at river edge
    const dests = generatePseudoDestinations(board, { file: 2, rank: 4 });
    assert.ok(!dests.some((d) => d.rank > 4));
  });

  it('forbids kings from facing each other', () => {
    const board = createEmptyBoard();
    set(board, 4, 0, p('red', 'king'));
    set(board, 4, 9, p('black', 'king'));
    // With no pieces between, red king is in check and cannot stay.
    assert.ok(isSquareAttacked(board, { file: 4, rank: 0 }, 'black'));

    // Red advisor at (4,1) blocks the file -> no longer attacked.
    set(board, 4, 1, p('red', 'advisor'));
    assert.ok(!isSquareAttacked(board, { file: 4, rank: 0 }, 'black'));

    // Moving the advisor away exposes the kings -> illegal (red would be in check).
    const moves = generateLegalMoves(board, 'red');
    assert.ok(
      !moves.some(
        (m) =>
          m.from.file === 4 &&
          m.from.rank === 1 &&
          m.to.file === 3 &&
          m.to.rank === 2,
      ),
    );
  });

  it('forbids moves that leave own king in check (sui-check)', () => {
    const board = createEmptyBoard();
    set(board, 4, 0, p('red', 'king'));
    set(board, 4, 2, p('red', 'advisor'));
    set(board, 4, 9, p('black', 'king'));
    // Advisor blocks; moving it diagonally exposes king -> illegal.
    assert.ok(!isLegalMove(board, 'red', { file: 4, rank: 2 }, { file: 3, rank: 1 }));
    assert.ok(!isLegalMove(board, 'red', { file: 4, rank: 2 }, { file: 5, rank: 1 }));
  });

  it('allows pawn forward before river and sideways after river', () => {
    const board = createEmptyBoard();
    set(board, 4, 3, p('red', 'pawn'));
    const before = generateLegalMoves(board, 'red');
    assert.ok(before.some((m) => m.to.file === 4 && m.to.rank === 4));
    assert.ok(!before.some((m) => m.to.rank === 2));
    assert.ok(!before.some((m) => m.to.file === 3 && m.to.rank === 3));

    // After crossing river.
    set(board, 4, 3, null);
    set(board, 4, 5, p('red', 'pawn'));
    const after = generateLegalMoves(board, 'red');
    assert.ok(after.some((m) => m.to.file === 4 && m.to.rank === 6));
    assert.ok(after.some((m) => m.to.file === 3 && m.to.rank === 5));
    assert.ok(after.some((m) => m.to.file === 5 && m.to.rank === 5));
  });

  it('generates correct orthogonal sliding moves for an isolated rook', () => {
    const board = createEmptyBoard();
    set(board, 4, 4, p('red', 'rook'));
    const moves = generateLegalMoves(board, 'red');
    // Up 5 + down 4 + left 4 + right 4 = 17.
    assert.equal(moves.length, 17);
  });

  it('king attacks along an open palace file (facing), but not through a blocker', () => {
    const board = createEmptyBoard();
    set(board, 4, 0, p('red', 'king'));
    set(board, 4, 9, p('black', 'king'));
    // Facing: black king threatens the red king one file over.
    assert.ok(pieceAttacks(board, { file: 4, rank: 9 }, { file: 4, rank: 0 }));
    // A blocker on the same file breaks the facing threat.
    set(board, 4, 4, p('red', 'pawn'));
    assert.ok(!pieceAttacks(board, { file: 4, rank: 9 }, { file: 4, rank: 0 }));
  });

  it('king one-step attack requires both squares inside its own palace', () => {
    const board = createEmptyBoard();
    // Black king in its own palace at (4,7), target (4,8) also in black palace -> attacks.
    set(board, 4, 7, p('black', 'king'));
    assert.ok(pieceAttacks(board, { file: 4, rank: 7 }, { file: 4, rank: 8 }));
    // A target outside the king's own palace on a DIFFERENT column (red's side,
    // rank 0) is NOT reachable in one step by the black king.
    set(board, 3, 0, p('red', 'king'));
    assert.ok(!pieceAttacks(board, { file: 4, rank: 7 }, { file: 3, rank: 0 }));
  });
});
