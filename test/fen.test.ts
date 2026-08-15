import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialBoard, createEmptyBoard } from '../src/core/board.js';
import { boardToFen, fenToBoard, positionKey } from '../src/core/fen.js';

describe('FEN serialization', () => {
  it('round-trips the initial position', () => {
    const board = createInitialBoard();
    const fen = boardToFen(board, 'red');
    const parsed = fenToBoard(fen);
    assert.equal(boardToFen(parsed.board, parsed.sideToMove), fen);
    assert.equal(parsed.sideToMove, 'red');
  });

  it('round-trips a sparse position', () => {
    const board = createEmptyBoard();
    board[0][4] = { side: 'red', type: 'king' };
    board[9][4] = { side: 'black', type: 'king' };
    board[5][4] = { side: 'red', type: 'pawn' };
    const fen = boardToFen(board, 'black');
    const parsed = fenToBoard(fen);
    assert.equal(parsed.sideToMove, 'black');
    assert.equal(parsed.board[0][4]?.type, 'king');
    assert.equal(parsed.board[9][4]?.side, 'black');
    assert.equal(parsed.board[5][4]?.type, 'pawn');
  });

  it('produces a stable position key', () => {
    const board = createInitialBoard();
    const key1 = positionKey(board, 'red');
    const key2 = positionKey(board, 'red');
    assert.equal(key1, key2);
    const key3 = positionKey(board, 'black');
    assert.notEqual(key1, key3);
  });
});
