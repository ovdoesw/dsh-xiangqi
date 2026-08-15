import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  initialFen,
  parseFen,
  sideToMove,
  canMove,
  moveAndFen,
  detectEvent,
  terminalResult,
  keyOf,
  HUMAN_SIDE,
} from '../src/client/game.js';
import { identifyOpening } from '../src/core/openings.js';

describe('client game helpers (pure)', () => {
  it('parses the initial FEN with red to move', () => {
    const { board, sideToMove: stm } = parseFen(initialFen());
    assert.equal(stm, 'red');
    assert.equal(board[0][4]?.type, 'king');
    assert.equal(board[0][4]?.side, 'red');
    assert.equal(board[9][4]?.side, 'black');
  });

  it('red may open with the central cannon (当头炮)', () => {
    // cannon at file 7 rank 2 -> file 4 rank 2
    assert.equal(canMove(initialFen(), HUMAN_SIDE, { file: 7, rank: 2 }, { file: 4, rank: 2 }), true);
    // illegal: a pawn may not retreat
    assert.equal(canMove(initialFen(), HUMAN_SIDE, { file: 0, rank: 3 }, { file: 0, rank: 2 }), false);
  });

  it('moveAndFen flips side and strips the moved piece', () => {
    const r = moveAndFen(initialFen(), HUMAN_SIDE, { file: 7, rank: 2 }, { file: 4, rank: 2 });
    assert.ok(r);
    assert.equal(sideToMove(r!.nextFen), 'black');
    const after = parseFen(r!.nextFen);
    assert.equal(after.board[2][7], null); // cannon left file 7 rank 2
    assert.equal(after.board[2][4]?.type, 'cannon');
  });

  it('detectEvent names the 当头炮 opening on the first move', () => {
    const r = moveAndFen(initialFen(), HUMAN_SIDE, { file: 7, rank: 2 }, { file: 4, rank: 2 })!;
    const history = [r.move];
    const event = detectEvent(initialFen(), HUMAN_SIDE, r.move, history, r.nextFen);
    assert.ok(event);
    assert.equal(event!.type, 'opening');
    assert.equal(event!.line, '当头炮');
  });

  it('identifyOpening agrees with detectEvent for the same first move', () => {
    const r = moveAndFen(initialFen(), HUMAN_SIDE, { file: 7, rank: 2 }, { file: 4, rank: 2 })!;
    assert.equal(identifyOpening([r.move]), '当头炮');
  });

  it('terminalResult is null for the opening position', () => {
    assert.equal(terminalResult(initialFen(), [initialFen()]), null);
  });

  it('keyOf is stable for a position', () => {
    assert.equal(keyOf(initialFen()), initialFen());
    const r = moveAndFen(initialFen(), HUMAN_SIDE, { file: 7, rank: 2 }, { file: 4, rank: 2 })!;
    assert.notEqual(keyOf(r.nextFen), initialFen());
  });
});
