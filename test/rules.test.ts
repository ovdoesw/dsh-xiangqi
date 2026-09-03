import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyBoard, type Board, type Piece } from '../src/core/board.js';
import {
  isCheckmate,
  isStalemate,
  checkTerminalByImmobility,
  detectRepetition,
  checkGameEnd,
} from '../src/core/rules.js';

function p(side: Piece['side'], type: Piece['type']): Piece {
  return { side, type };
}

function set(board: Board, file: number, rank: number, piece: Piece | null) {
  board[rank][file] = piece;
}

describe('terminal rule detection', () => {
  it('detects a simple checkmate', () => {
    // Back-rank mate pattern: red king trapped in palace.
    const board = createEmptyBoard();
    set(board, 4, 0, p('red', 'king'));
    set(board, 4, 8, p('black', 'rook')); // delivers check on the central file
    set(board, 3, 9, p('black', 'rook')); // guards (3,0) and (3,1)
    set(board, 5, 9, p('black', 'rook')); // guards (5,0) and (5,1)
    set(board, 4, 2, p('black', 'rook')); // protects the checking rook so king cannot capture it
    assert.equal(isCheckmate(board, 'red'), true);
    assert.equal(isStalemate(board, 'red'), false);
    const result = checkTerminalByImmobility(board, 'red');
    assert.equal(result?.winner, 'black');
    assert.ok(result?.reason.includes('将杀'));
  });

  it('detects a stalemate (no legal moves, not in check)', () => {
    const board = createEmptyBoard();
    set(board, 4, 0, p('red', 'king'));
    // Black rook guards all king moves without actually checking.
    set(board, 3, 2, p('black', 'rook'));
    set(board, 5, 2, p('black', 'rook'));
    set(board, 3, 1, p('black', 'rook'));
    set(board, 5, 1, p('black', 'rook'));
    // King cannot move to any palace square and is not in check.
    assert.equal(isCheckmate(board, 'red'), false);
    assert.equal(isStalemate(board, 'red'), true);
    const result = checkTerminalByImmobility(board, 'red');
    assert.equal(result?.winner, 'black');
    assert.ok(result?.reason.includes('困毙'));
  });

  it('does not call checkmate when the king can capture the attacker', () => {
    const board = createEmptyBoard();
    set(board, 4, 0, p('red', 'king'));
    set(board, 4, 1, p('black', 'rook')); // adjacent, unprotected
    assert.equal(isCheckmate(board, 'red'), false);
    assert.equal(isStalemate(board, 'red'), false);
  });

  it('detects a repeated position three times (perpetual checker loses)', () => {
    // The repeated position ('A r') is produced by black just having moved
    // into it; under 长将 rules the repetition-maker (perpetual checker)
    // loses, so red — the side to move — is the winner.
    const history = [
      'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r',
      'someOtherPosition b',
      'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r',
      'anotherPosition r',
      'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r',
    ];
    const result = detectRepetition(history, 'red');
    assert.equal(result?.winner, 'red');
    assert.ok(result?.reason.includes('重复'));
  });

  it('does not flag repetition before three occurrences', () => {
    const history = [
      'posA r',
      'posB b',
      'posA r',
      'posC b',
    ];
    assert.equal(detectRepetition(history, 'black'), null);
  });

  it('returns null when the game is not over', () => {
    const board = createEmptyBoard();
    set(board, 4, 0, p('red', 'king'));
    set(board, 4, 9, p('black', 'king'));
    set(board, 4, 5, p('red', 'pawn'));
    assert.equal(checkGameEnd(board, 'red', []), null);
  });

  it('uses checkmate over repetition when both apply', () => {
    const board = createEmptyBoard();
    set(board, 4, 0, p('red', 'king'));
    set(board, 4, 8, p('black', 'rook'));
    set(board, 3, 9, p('black', 'rook'));
    set(board, 5, 9, p('black', 'rook'));
    set(board, 4, 2, p('black', 'rook'));
    const history = ['same r', 'same b', 'same r', 'same b', 'same r'];
    const result = checkGameEnd(board, 'red', history);
    assert.equal(result?.winner, 'black');
    assert.ok(result?.reason.includes('将杀'));
  });
});
