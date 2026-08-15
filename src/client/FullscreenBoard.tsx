/**
 * FullscreenBoard: the large maximized board, opened from the mini panel.
 *
 * Reuses the exact board grid (BoardRenderer) with larger cells, keeps the
 * same click-to-move interaction, and collapses back to the panel on Esc or
 * the close button. It renders a back-drop that itself stays click-through
 * except for the board, so the game never blocks the app underneath.
 */

import { useState, useCallback, useEffect } from 'react';

import { type Pos } from '../core/board.js';
import { BoardRenderer } from './board.js';
import { HUMAN_SIDE, sideToMove } from './store.js';
import type { XiangqiSlotProps } from './inject.js';

export function FullscreenBoard({ useStore, actions, xiangqi }: XiangqiSlotProps) {
  const fen = useStore((s) => s.fen);
  const gameOver = useStore((s) => s.gameOver);
  const aiThinking = useStore((s) => s.aiThinking);
  const lastEvent = useStore((s) => s.lastEvent);
  const comment = useStore((s) => s.comment);

  const [selected, setSelected] = useState<Pos | null>(null);

  const interactive = xiangqi.isHumanTurn() && !gameOver && !aiThinking;

  const onSquareClick = useCallback(
    (pos: Pos) => {
      if (!xiangqi.isHumanTurn()) return;
      if (selected) {
        if (selected.file === pos.file && selected.rank === pos.rank) {
          setSelected(null);
          return;
        }
        const ok = xiangqi.playMove(selected, pos);
        setSelected(ok ? null : pos);
      } else {
        setSelected(pos);
      }
    },
    [selected, xiangqi],
  );

  // Esc collapses to the panel (or closes entirely already handled by panel logic).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') actions.setPanel('closed');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions]);

  const cell = Math.max(44, Math.min(72, Math.floor(window.innerHeight / 11)));
  const status = gameOver
    ? `对局结束：${gameOver.winner === HUMAN_SIDE ? '你赢了' : gameOver.winner === 'draw' ? '和棋' : 'AI 赢了'}（${gameOver.reason}）`
    : aiThinking
      ? 'AI 思考中…'
      : `轮到你走（${sideToMove(fen) === HUMAN_SIDE ? '红方' : '黑方'}）`;

  return (
    <div
      className="dsh-xiangqi-fullscreen"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(20,16,10,0.45)',
        zIndex: 2147483001,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: '#fbf6ea',
          border: '1px solid #e5dcc8',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          padding: 20,
          fontFamily: 'inherit',
          color: '#3a342c',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 16 }}>{status}</strong>
          <button type="button" aria-label="收起" onClick={() => actions.setPanel('panel')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: '#8a7f6a', padding: '0 6px' }}>
            ×
          </button>
        </div>

        <BoardRenderer
          fen={fen}
          selected={selected}
          onSquareClick={onSquareClick}
          interactive={interactive}
          lastMove={xiangqi.lastMove()}
          cellSize={cell}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
          <button type="button" onClick={() => actions.newGame()}
            style={btnStyle}>新局</button>
          <button type="button" onClick={() => actions.undo()} disabled={aiThinking}
            style={btnStyle}>悔棋</button>
          <button type="button" onClick={() => xiangqi.requestCommentary()}
            style={btnStyle}>点评</button>
          <span style={{ fontSize: 12, color: '#8a7f6a' }}>Esc 收起</span>
        </div>

        {(lastEvent || comment) ? (
          <div style={{ marginTop: 14, background: '#fff7e6', border: '1px solid #eadfbe', borderRadius: 10, padding: '8px 14px', fontSize: 14, lineHeight: 1.5, minWidth: 260, maxWidth: 520 }}>
            {lastEvent ? <div>{lastEvent.line}</div> : null}
            {comment ? <div style={{ color: '#6b5d42', marginTop: lastEvent ? 4 : 0 }}>{comment}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid #d8cfba',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  color: '#3a342c',
};
