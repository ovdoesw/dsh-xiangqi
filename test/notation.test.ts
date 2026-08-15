import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyBoard, type Board, type Piece } from '../src/core/board.js';
import { chineseNotation, fileNotation } from '../src/core/notation.js';
import { buildRecord, recordText } from '../src/client/record.js';
import { applyMove, cloneBoard } from '../src/core/board.js';
import { fenToBoard } from '../src/core/fen.js';
import { initialFen } from '../src/client/game.js';

function p(side: Piece['side'], type: Piece['type']): Piece {
  return { side, type };
}

function set(board: Board, file: number, rank: number, piece: Piece | null) {
  board[rank][file] = piece;
}

describe('xiangqi notation (记谱)', () => {
  it('file labels: red 一..九 left→right, black 1..9 right→left', () => {
    assert.equal(fileNotation(0, 'red'), '一');
    assert.equal(fileNotation(8, 'red'), '九');
    assert.equal(fileNotation(8, 'black'), '1');
    assert.equal(fileNotation(0, 'black'), '9');
  });

  it('cannon sideways: 炮二平五 (red file-1 cannon to the center)', () => {
    const board = createEmptyBoard();
    set(board, 1, 2, p('red', 'cannon'));
    const n = chineseNotation(board, { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 } });
    assert.equal(n, '炮二平五');
  });

  it('black horse forward: 马8进7', () => {
    const board = createEmptyBoard();
    set(board, 1, 9, p('black', 'horse'));
    // Black's file-8 horse (red file 1) advances to black's file 7 (red file 2).
    const n = chineseNotation(board, { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 } });
    assert.equal(n, '马8进7');
  });

  it('rook forward records steps: 车一进一', () => {
    const board = createEmptyBoard();
    set(board, 0, 0, p('red', 'rook'));
    const n = chineseNotation(board, { from: { file: 0, rank: 0 }, to: { file: 0, rank: 1 } });
    assert.equal(n, '车一进一');
  });

  it('pawn sideways after the river: 兵七平六', () => {
    const board = createEmptyBoard();
    set(board, 6, 5, p('red', 'pawn'));
    const n = chineseNotation(board, { from: { file: 6, rank: 5 }, to: { file: 5, rank: 5 } });
    assert.equal(n, '兵七平六');
  });

  it('front/back disambiguation for twin rooks: 前车进一', () => {
    const board = createEmptyBoard();
    set(board, 0, 0, p('red', 'rook')); // behind (rank 0)
    set(board, 0, 3, p('red', 'rook')); // ahead (rank 3, toward black)
    const n = chineseNotation(board, { from: { file: 0, rank: 3 }, to: { file: 0, rank: 4 } });
    assert.equal(n, '前车进一');
  });

  it('full record replays to 当头炮 opening', () => {
    const { board, sideToMove } = fenToBoard(initialFen());
    // Red 炮八平五 (right cannon to the center) — file 7 is red's 八 route.
    const m1 = { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 } };
    assert.equal(sideToMove, 'red');
    applyMove(board, m1);
    const rec = buildRecord(initialFen(), [m1]);
    assert.equal(rec.entries[0].red, '炮八平五');
    assert.equal(rec.entries[0].black, '');
  });

  it('recordText renders multi-round record with result', () => {
    const b0 = cloneBoard(fenToBoard(initialFen()).board);
    // Red 炮八平五, black 炮2平5 (顺手炮), red 马二进三
    const m1 = { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 } };
    applyMove(b0, m1);
    const m2 = { from: { file: 7, rank: 7 }, to: { file: 4, rank: 7 } };
    applyMove(b0, m2);
    const m3 = { from: { file: 1, rank: 0 }, to: { file: 2, rank: 2 } };
    applyMove(b0, m3);
    const text = recordText(initialFen(), [m1, m2, m3]);
    assert.match(text, /1\. 炮八平五 炮2平5/);
    assert.match(text, /2\. 马二进三/);
  });
});
