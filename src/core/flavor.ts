/**
 * Pure TypeScript core: Sanguosha-style flavor captions for captures and events.
 */

import { type Piece, type PieceType, type Side } from './board.js';

const CAPTURE_TABLE: Record<PieceType, string[]> = {
  king: [
    '一破，卧龙出山！',
    '主公，快走！',
    '王侯将相，宁有种乎？',
    '天下大势，尽入我手。',
  ],
  rook: [
    '你的大将，我收下了！',
    '车如流水马如龙，今为我用。',
    '断其车阵，破其锋芒！',
    '此车，我笑纳了。',
  ],
  horse: [
    '好马配好鞍，可惜归我了。',
    '马失前蹄，局势已去。',
    '金戈铁马，气吞万里如虎。',
  ],
  cannon: [
    '雷公助我！',
    '炮声一响，黄金万两。',
    '隔山打牛，正中要害！',
  ],
  elephant: [
    '塞翁失马，焉知非福。',
    '象走田，眼被塞，局势崩。',
    '拔其象眼，断其根基。',
  ],
  advisor: [
    '断其左膀右臂！',
    '士为知己者死，可惜不是为我。',
    '谋士去，霸业可图。',
  ],
  pawn: [
    '一鼓作气，再而衰，三而竭。',
    '小卒过河顶大车！',
    '兵无常势，水无常形。',
  ],
};

const CHECK_LINES: string[] = [
  '将军！',
  '主公，危矣！',
  '此地不宜久留。',
  '看这一招！',
];

const CHECKMATE_LINES: string[] = [
  '一破，卧龙出山！',
  '天下大势，为我所控。',
  '观今夜天象，知天下大事。',
  '滚滚长江东逝水，浪花淘尽英雄。',
];

const STALEMATE_LINES: string[] = [
  '困毙！进退维谷，插翅难飞。',
  '此局，已无活路。',
];

function hashPair(a: string, b: string): number {
  let h = 0;
  for (const ch of a + b) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return h;
}

function pickLine(lines: string[], seed: number): string {
  return lines[seed % lines.length];
}

/** Return a Sanguosha-style caption for a capture event.
 *  Null if no caption is appropriate.
 */
export function captionForCapture(
  capturedPiece: Piece,
  attackerPiece?: Piece,
): string | null {
  const pool = CAPTURE_TABLE[capturedPiece.type];
  if (!pool || pool.length === 0) return null;
  const seed = attackerPiece
    ? hashPair(capturedPiece.type, attackerPiece.type)
    : hashPair(capturedPiece.type, capturedPiece.side);
  return pickLine(pool, seed);
}

/** Caption for delivering a check. */
export function captionForCheck(): string {
  return pickLine(CHECK_LINES, Date.now() % CHECK_LINES.length);
}

/** Caption for delivering checkmate. */
export function captionForCheckmate(): string {
  return pickLine(CHECKMATE_LINES, Date.now() % CHECKMATE_LINES.length);
}

/** Caption for stalemate (困毙). */
export function captionForStalemate(): string {
  return pickLine(STALEMATE_LINES, Date.now() % STALEMATE_LINES.length);
}

/** Side-specific Chinese character for a piece type. */
export function pieceName(piece: Piece): string {
  const names: Record<Side, Record<PieceType, string>> = {
    red: {
      king: '帅',
      advisor: '仕',
      elephant: '相',
      horse: '傌',
      rook: '俥',
      cannon: '炮',
      pawn: '兵',
    },
    black: {
      king: '將',
      advisor: '士',
      elephant: '象',
      horse: '馬',
      rook: '車',
      cannon: '砲',
      pawn: '卒',
    },
  };
  return names[piece.side][piece.type];
}
