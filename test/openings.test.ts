import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { identifyOpening } from '../src/core/openings.js';
import type { Move } from '../src/core/board.js';

function m(from: [number, number], to: [number, number]): Move {
  return { from: { file: from[0], rank: from[1] }, to: { file: to[0], rank: to[1] } };
}

describe('opening identification', () => {
  it('recognizes 当头炮', () => {
    assert.equal(identifyOpening([m([1, 2], [4, 2])]), '当头炮');
    assert.equal(identifyOpening([m([7, 2], [4, 2])]), '当头炮');
  });

  it('recognizes 仙人指路', () => {
    assert.equal(identifyOpening([m([4, 3], [4, 4])]), '仙人指路');
  });

  it('recognizes 飞相局', () => {
    assert.equal(identifyOpening([m([2, 0], [4, 2])]), '飞相局');
    assert.equal(identifyOpening([m([6, 0], [4, 2])]), '飞相局');
  });

  it('recognizes 顺手炮 vs 当头炮', () => {
    const moves = [m([1, 2], [4, 2]), m([1, 7], [4, 7])];
    assert.equal(identifyOpening(moves), '顺手炮');
  });

  it('recognizes 屏风马 response', () => {
    const moves = [m([1, 2], [4, 2]), m([1, 9], [2, 7])];
    assert.equal(identifyOpening(moves), '屏风马');
  });

  it('prefers longer patterns', () => {
    const moves = [
      m([1, 2], [4, 2]),
      m([1, 9], [2, 7]),
      m([7, 0], [6, 2]),
    ];
    assert.equal(identifyOpening(moves), '中炮对屏风马');
  });

  it('returns null for unknown sequences', () => {
    assert.equal(identifyOpening([]), null);
    assert.equal(identifyOpening([m([0, 0], [0, 1])]), null);
  });
});
