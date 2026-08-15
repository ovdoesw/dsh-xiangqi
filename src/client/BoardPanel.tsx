/**
 * BoardPanel: the floating mini board (9×10) opened from the mascot.
 *
 * Supports click-to-move (select highlight + legal target hints), a difficulty
 * selector, new-game / undo / comment buttons, and a speech bubble showing the
 * last local event line and the resolved LLM commentary. Shares the board grid
 * with FullscreenBoard via `BoardRenderer`.
 */

import { useState, useCallback, useMemo } from 'react';

import { type Pos } from '../core/board.js';
import { BoardRenderer } from './board.js';
import { HUMAN_SIDE, sideToMove, initialFen } from './store.js';
import { recordText } from './record.js';
import type { XiangqiSlotProps } from './inject.js';

const DIFFICULTIES = [
  { id: 'easy', label: '初级' },
  { id: 'medium', label: '中级' },
  { id: 'hard', label: '高级' },
] as const;

export function BoardPanel({ useStore, actions, xiangqi }: XiangqiSlotProps) {
  const fen = useStore((s) => s.fen);
  const difficulty = useStore((s) => s.difficulty);
  const gameOver = useStore((s) => s.gameOver);
  const lastEvent = useStore((s) => s.lastEvent);
  const aiThinking = useStore((s) => s.aiThinking);
  const comment = useStore((s) => s.comment);
  const history = useStore((s) => s.history);

  const [selected, setSelected] = useState<Pos | null>(null);
  const [showRecord, setShowRecord] = useState(false);

  const record = useMemo(() => recordText(initialFen(), history), [history]);
  const hasMoves = history.length > 0;

  const onCopyRecord = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(record);
    } catch {
      /* clipboard unavailable (permissions / non-secure context) — ignore */
    }
  }, [record]);

  const onDownloadRecord = useCallback(() => {
    const blob = new Blob([record], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `xiangqi-${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [record]);

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
        if (ok) {
          setSelected(null);
        } else {
          // Clicking an own piece re-selects it.
          setSelected(pos);
        }
      } else {
        setSelected(pos);
      }
    },
    [selected, xiangqi],
  );

  const onCommentClick = useCallback(() => {
    xiangqi.requestCommentary();
  }, [xiangqi]);

  const bubbleLine = lastEvent?.line ?? (aiThinking ? 'AI 思考中…' : null);

  return (
    <div
      className="dsh-xiangqi-panel"
      style={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 2147483000,
        pointerEvents: 'auto',
        background: '#fbf6ea',
        border: '1px solid #e5dcc8',
        borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
        padding: 14,
        width: 380,
        fontFamily: 'inherit',
        color: '#3a342c',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}>中国象棋</strong>
        <button type="button" aria-label="关闭" onClick={() => actions.setPanel('closed')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#8a7f6a', padding: '2px 8px' }}>
          ×
        </button>
      </div>

      {/* status line */}
      <div style={{ fontSize: 12, color: '#7a6f5a', marginBottom: 6 }}>
        {gameOver
          ? `对局结束：${gameOver.winner === HUMAN_SIDE ? '你赢了' : gameOver.winner === 'draw' ? '和棋' : 'AI 赢了'}（${gameOver.reason}）`
          : aiThinking
            ? 'AI 思考中…'
            : `轮到你走（${sideToMove(fen) === HUMAN_SIDE ? '红方' : '黑方'}）`}
      </div>

      <BoardRenderer
        fen={fen}
        selected={selected}
        onSquareClick={onSquareClick}
        interactive={interactive}
        lastMove={xiangqi.lastMove()}
        cellSize={38}
      />

      {/* controls */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={difficulty}
          onChange={(e) => actions.setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
          style={{ padding: '4px 8px', borderRadius: 8, border: '1px solid #d8cfba', background: '#fff', fontSize: 13 }}
          aria-label="难度"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
        <button type="button" onClick={() => actions.newGame()}
          style={btnStyle}>新局</button>
        <button type="button" onClick={() => actions.undo()} disabled={aiThinking}
          style={btnStyle}>悔棋</button>
        <button type="button" onClick={onCommentClick}
          style={btnStyle}>点评</button>
        <button type="button" onClick={() => actions.openFullscreen()}
          style={btnStyle}>全屏</button>
        <button type="button" onClick={() => setShowRecord((v) => !v)} disabled={!hasMoves}
          style={btnStyle}>棋谱</button>
      </div>

      {/* game record: view / copy / download */}
      {showRecord && hasMoves ? (
        <div style={{ marginTop: 10, background: '#fffdf7', border: '1px solid #e5dcc8', borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 13 }}>棋谱</strong>
            <span style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={onCopyRecord} style={btnStyle}>复制</button>
              <button type="button" onClick={onDownloadRecord} style={btnStyle}>下载</button>
            </span>
          </div>
          <pre style={{ margin: 0, maxHeight: 180, overflow: 'auto', fontSize: 12.5, lineHeight: 1.6, fontFamily: 'inherit', whiteSpace: 'pre-wrap', color: '#3a342c' }}>
            {record}
          </pre>
        </div>
      ) : null}

      {/* speech bubble for local event + commentary */}
      {(bubbleLine || comment) ? (
        <div style={{ marginTop: 10, background: '#fff7e6', border: '1px solid #eadfbe', borderRadius: 10, padding: '8px 12px', fontSize: 13, lineHeight: 1.5, minHeight: 20 }}>
          {bubbleLine ? <div>{bubbleLine}</div> : null}
          {comment ? <div style={{ color: '#6b5d42', marginTop: bubbleLine ? 4 : 0 }}>{comment}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '5px 12px',
  borderRadius: 8,
  border: '1px solid #d8cfba',
  background: '#fff',
  cursor: 'pointer',
  fontSize: 13,
  color: '#3a342c',
};
