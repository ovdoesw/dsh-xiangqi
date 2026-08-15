/**
 * Shared Chinese chess board renderer (9 files × 10 ranks), reused by both the
 * mini panel and the fullscreen surface. Pure presentation over the FEN:
 * it draws the grid, overlay lines, palace diagonals and river, then places
 * pieces and interaction hints (selected square, legal targets, last move).
 *
 * Coordinate mapping: red sits at the bottom (rank 0), so on screen the
 * top-left is file 8 / rank 9.
 */

import { type Pos } from '../core/board.js';
import { parseFen, legalDestinations } from './store.js';
import { PieceView } from './pieces.js';

export interface BoardProps {
  fen: string;
  /** Selected piece origin (in board coordinates) or null. */
  selected: Pos | null;
  /** Callback when a square is clicked. */
  onSquareClick: (pos: Pos) => void;
  /** Whether the human may currently interact. */
  interactive: boolean;
  /** The last move (for green hint markers) or null. */
  lastMove?: { from: Pos; to: Pos } | null;
  /** Pixel size of one square (board scales to 9×10 cells). */
  cellSize?: number;
}

export function BoardRenderer({
  fen,
  selected,
  onSquareClick,
  interactive,
  lastMove = null,
  cellSize = 40,
}: BoardProps) {
  const { board } = parseFen(fen);
  const hints = selected ? legalDestinations(fen, selected) : [];
  const hintSet = new Set(hints.map((p) => `${p.file},${p.rank}`));

  const width = 9 * cellSize;
  const height = 10 * cellSize;

  // Screen coords: screenFile = 8 - file (red's left = screen left).
  const sx = (file: number) => (8 - file) * cellSize + cellSize / 2;
  const sy = (rank: number) => (9 - rank) * cellSize + cellSize / 2;

  return (
    <div
      className="dsh-xiangqi-board"
      style={{ position: 'relative', width, height, background: '#e8c98a', borderRadius: 8, overflow: 'hidden' }}
    >
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {/* grid: vertical lines break at the river (between rank 4 and 5) */}
        {Array.from({ length: 9 }, (_, f) => (
          <g key={`v${f}`}>
            <line
              x1={(8 - f) * cellSize + cellSize / 2}
              y1={cellSize / 2}
              x2={(8 - f) * cellSize + cellSize / 2}
              y2={4.5 * cellSize}
              stroke="#7a4b26"
              strokeWidth={1}
            />
            <line
              x1={(8 - f) * cellSize + cellSize / 2}
              y1={5.5 * cellSize}
              x2={(8 - f) * cellSize + cellSize / 2}
              y2={height - cellSize / 2}
              stroke="#7a4b26"
              strokeWidth={1}
            />
          </g>
        ))}
        {Array.from({ length: 10 }, (_, r) => (
          <line
            key={`h${r}`}
            x1={cellSize / 2}
            y1={(9 - r) * cellSize + cellSize / 2}
            x2={width - cellSize / 2}
            y2={(9 - r) * cellSize + cellSize / 2}
            stroke="#7a4b26"
            strokeWidth={1}
          />
        ))}
        {/* river gap (between rank 4 and 5) */}
        {/* palace diagonals: red palace (files 3-5 ranks 0-2), black (3-5, 7-9) */}
        <path
          d={`M ${sx(3)} ${sy(0)} L ${sx(5)} ${sy(2)} M ${sx(5)} ${sy(0)} L ${sx(3)} ${sy(2)}`}
          stroke="#7a4b26" strokeWidth={1} fill="none"
        />
        <path
          d={`M ${sx(3)} ${sy(7)} L ${sx(5)} ${sy(9)} M ${sx(5)} ${sy(7)} L ${sx(3)} ${sy(9)}`}
          stroke="#7a4b26" strokeWidth={1} fill="none"
        />
        {/* river label: 楚河 (left) and 漢界 (right) in the river gap */}
        <text x={width * 0.25} y={5 * cellSize} textAnchor="middle" dominantBaseline="middle" fontSize={cellSize * 0.42} fill="#9c6b32" fontFamily="inherit">
          楚 河
        </text>
        <text x={width * 0.75} y={5 * cellSize} textAnchor="middle" dominantBaseline="middle" fontSize={cellSize * 0.42} fill="#9c6b32" fontFamily="inherit">
          漢 界
        </text>
        {/* star points: cannon + pawn positions */}
        {starPoints().map((p, i) => (
          <g key={`sp${i}`}>
            <line x1={sx(p.file) - 4} y1={sy(p.rank)} x2={sx(p.file) + 4} y2={sy(p.rank)} stroke="#7a4b26" strokeWidth={1} />
            <line x1={sx(p.file)} y1={sy(p.rank) - 4} x2={sx(p.file)} y2={sy(p.rank) + 4} stroke="#7a4b26" strokeWidth={1} />
          </g>
        ))}
      </svg>

      {/* interaction tiles */}
      {interactive &&
        Array.from({ length: 10 }, (_, rank) =>
          Array.from({ length: 9 }, (_, file) => {
            const pos = { file, rank };
            const key = `${file},${rank}`;
            const isHint = hintSet.has(key);
            return (
              <div
                key={key}
                onClick={() => onSquareClick(pos)}
                style={{
                  position: 'absolute',
                  left: sx(file) - cellSize / 2,
                  top: sy(rank) - cellSize / 2,
                  width: cellSize,
                  height: cellSize,
                  cursor: isHint ? 'pointer' : 'default',
                  ...(isHint
                    ? { background: 'rgba(39,174,96,0.28)', borderRadius: '50%' }
                    : {}),
                }}
              />
            );
          }),
        )}

      {/* selected highlight */}
      {selected ? (
        <div
          style={{
            position: 'absolute',
            left: sx(selected.file) - cellSize / 2,
            top: sy(selected.rank) - cellSize / 2,
            width: cellSize,
            height: cellSize,
            background: 'rgba(47,128,237,0.35)',
            borderRadius: 8,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {/* last move markers */}
      {lastMove
        ? [lastMove.from, lastMove.to].map((p, i) => (
            <div
              key={`lm${i}`}
              style={{
                position: 'absolute',
                left: sx(p.file) - cellSize / 2 + cellSize * 0.15,
                top: sy(p.rank) - cellSize / 2 + cellSize * 0.15,
                width: cellSize * 0.7,
                height: cellSize * 0.7,
                borderRadius: 4,
                outline: '2px solid rgba(230,184,0,0.85)',
                pointerEvents: 'none',
              }}
            />
          ))
        : null}

      {/* pieces */}
      {board.map((row, rank) =>
        row.map((piece, file) => {
          if (!piece) return null;
          return (
            <div
              key={`${file},${rank}`}
              style={{
                position: 'absolute',
                left: sx(file) - cellSize / 2,
                top: sy(rank) - cellSize / 2,
                width: cellSize,
                height: cellSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <PieceView piece={piece} size={cellSize * 0.82} />
            </div>
          );
        }),
      )}
    </div>
  );
}

/** Cannon (2,7)/(6,7) army points and pawn positions get corner marks. */
function starPoints(): Pos[] {
  const points: Pos[] = [];
  for (const file of [1, 7]) {
    points.push({ file, rank: 2 }, { file, rank: 7 });
  }
  for (const file of [0, 2, 4, 6, 8]) {
    points.push({ file, rank: 3 }, { file, rank: 6 });
  }
  return points;
}
