/**
 * dsh-xiangqi piece rendering: Chinese chess pieces as compact SVGs.
 *
 * Renders the traditional red/black Chinese characters (帅仕相俥傌炮兵 /
 * 将士象車馬砲卒) inside a round wooden disc. Pure presentational — no store,
 * no game logic.
 */

import { type Piece, type Side } from '../core/board.js';
import { pieceName } from '../core/flavor.js';

/** Chinese character + color for each (side, pieceType) pair. */
export function pieceLabel(piece: Piece): string {
  return pieceName(piece);
}

/** Ink color for a side. */
export function inkColor(side: Side): string {
  return side === 'red' ? '#c1272d' : '#1a1a1a';
}

export interface PieceViewProps {
  piece: Piece;
  size?: number;
  /** Apply a selected/legal hint highlight ring (used by the board). */
  selected?: boolean;
  hint?: boolean;
  isLastMove?: boolean;
}

/**
 * A single piece: a filled disc with a darker ring and the Chinese glyph.
 * The disc scales with `size` so both the mini panel and fullscreen board reuse it.
 */
export function PieceView({
  piece,
  size = 32,
  selected = false,
  hint = false,
  isLastMove = false,
}: PieceViewProps) {
  const char = pieceLabel(piece);
  const ink = inkColor(piece.side);
  const r = size / 2;
  const innerR = r * 0.72;
  const stroke = selected ? '#2f80ed' : hint ? '#27ae60' : '#7a4b26';
  const strokeWidth = selected || hint ? Math.max(1.5, size * 0.08) : Math.max(1, size * 0.05);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`-${r} -${r} ${size} ${size}`}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* optional last-move marker */}
      {isLastMove ? (
        <circle r={r - 1} fill="none" stroke="#e6b800" strokeWidth={size * 0.06} opacity={0.9} />
      ) : null}
      {/* disc body */}
      <circle r={r - strokeWidth / 2} fill="#f3e3be" stroke={stroke} strokeWidth={strokeWidth} />
      <circle r={innerR} fill="none" stroke={ink} strokeWidth={Math.max(0.8, size * 0.035)} opacity={0.55} />
      {/* glyph */}
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.58}
        fontWeight={700}
        fill={ink}
        fontFamily="'Noto Serif SC', 'Songti SC', 'SimSun', 'KaiTi', serif"
      >
        {char}
      </text>
    </svg>
  );
}

/** A bare glyph (no disc) for the mascot's held piece. */
export function PieceGlyph({ piece, size = 20 }: { piece: Piece; size?: number }) {
  return (
    <text
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fontWeight={700}
      fill={inkColor(piece.side)}
      fontFamily="'Noto Serif SC', 'Songti SC', 'SimSun', serif"
    >
      {pieceLabel(piece)}
    </text>
  );
}
