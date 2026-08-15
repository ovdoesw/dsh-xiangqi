/**
 * Generate a demo screenshot for the README as an SVG that GitHub renders
 * inline. Draws a full 9×10 xiangqi opening position with the river (楚河汉界),
 * palace diagonals, and a small mascot hint in the corner. Zero dependencies.
 *
 * Usage: node scripts/generate-screenshot.mjs  → writes assets/screenshot.svg
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../assets/screenshot.svg');

const CELL = 64;
const F = 9;
const R = 10;
const W = F * CELL;
const H = R * CELL;
const PAD = 48;

const sx = (file) => (8 - file) * CELL + CELL / 2;
const sy = (rank) => (9 - rank) * CELL + CELL / 2;

// ── piece map: [file, rank, side, unicode-char, color] ──────────────────────
const RED = '#c0392b';
const BLACK = '#2d2d2d';
const PIECES = [
  // black back + cannons + pawns
  ['r', 'y', '車', BLACK], ['h', 'y', '馬', BLACK], ['e', 'y', '象', BLACK],
  ['a', 'y', '士', BLACK], ['k', 'y', '將', BLACK], ['a', 'y', '士', BLACK],
  ['e', 'y', '象', BLACK], ['h', 'y', '馬', BLACK], ['r', 'y', '車', BLACK],
  [1, 7, '砲', BLACK], [7, 7, '砲', BLACK],
  [0, 6, '卒', BLACK], [2, 6, '卒', BLACK], [4, 6, '卒', BLACK], [6, 6, '卒', BLACK], [8, 6, '卒', BLACK],
  // red back + cannons + pawns
  ['r', 'r', '俥', RED], ['h', 'r', '傌', RED], ['e', 'r', '相', RED],
  ['a', 'r', '仕', RED], ['k', 'r', '帥', RED], ['a', 'r', '仕', RED],
  ['e', 'r', '相', RED], ['h', 'r', '傌', RED], ['r', 'r', '俥', RED],
  [1, 2, '炮', RED], [7, 2, '炮', RED],
  [0, 3, '兵', RED], [2, 3, '兵', RED], [4, 3, '兵', RED], [6, 3, '兵', RED], [8, 3, '兵', RED],
];

function fileOf(v, side) { return v === 'r' ? (side === RED ? 0 : 8) : Number(v); }
function rankOf(v, side) { return v === 'y' ? (side === BLACK ? 9 : 0) : Number(v); }

function pieceSvg(p) {
  const [fChar, rChar, ch, color] = p;
  const side = color === RED ? 'red-coord' : 'black-coord';
  let f = fileOf(fChar, color);
  let r = rankOf(rChar, color);
  // mirrors: black uses file axis opposite; handled by sx already for all.
  const x = sx(f);
  const y = sy(r);
  const rl = CELL * 0.72;
  const fill = color === RED ? '#f8d6c8' : '#f2e4cf';
  const stroke = color;
  return `
  <g>
    <circle cx="${x}" cy="${y}" r="${rl}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    <circle cx="${x}" cy="${y}" r="${rl - 6}" fill="none" stroke="${stroke}" stroke-width="1" opacity="0.55"/>
    <text x="${x}" y="${y + rl * 0.34}" font-size="${rl * 0.95}" text-anchor="middle" fill="${stroke}" font-family="'Noto Sans CJK SC','PingFang SC','Microsoft YaHei',sans-serif" font-weight="700">${ch}</text>
  </g>`;
}

const verticals = Array.from({ length: F }, (_, f) => {
  const x = sx(f);
  // vertical lines break at the river
  return `<line x1="${x}" y1="${CELL/2}" x2="${x}" y2="${4.5*CELL}" stroke="#7a4b26" stroke-width="2"/>`
       + `<line x1="${x}" y1="${5.5*CELL}" x2="${x}" y2="${H - CELL/2}" stroke="#7a4b26" stroke-width="2"/>`;
}).join('');

const horizontals = Array.from({ length: R }, (_, r) => {
  const y = sy(r);
  return `<line x1="${CELL/2}" y1="${y}" x2="${W - CELL/2}" y2="${y}" stroke="#7a4b26" stroke-width="2"/>`;
}).join('');

const palace = `
  <path d="M ${sx(3)} ${sy(0)} L ${sx(5)} ${sy(2)} M ${sx(5)} ${sy(0)} L ${sx(3)} ${sy(2)}" stroke="#7a4b26" stroke-width="2" fill="none"/>
  <path d="M ${sx(3)} ${sy(7)} L ${sx(5)} ${sy(9)} M ${sx(5)} ${sy(7)} L ${sx(3)} ${sy(9)}" stroke="#7a4b26" stroke-width="2" fill="none"/>`;

const river = `
  <text x="${W*0.27}" y="${5*CELL}" font-size="${CELL*0.5}" text-anchor="middle" fill="#9c6b32" font-family="'Noto Serif SC','SimSun',serif">楚 河</text>
  <text x="${W*0.73}" y="${5*CELL}" font-size="${CELL*0.5}" text-anchor="middle" fill="#9c6b32" font-family="'Noto Serif SC','SimSun',serif">漢 界</text>`;

const starPoints = [
  ...[[1,2],[7,2],[1,7],[7,7]],
  ...[0,2,4,6,8].map(f=>[f,3]), ...[0,2,4,6,8].map(f=>[f,6]),
];
const stars = starPoints.map(([f, r]) => {
  const x = sx(f), y = sy(r);
  return `<g stroke="#7a4b26" stroke-width="2"><line x1="${x-5}" y1="${y}" x2="${x+5}" y2="${y}"/><line x1="${x}" y1="${y-5}" x2="${x}" y2="${y+5}"/></g>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W + PAD*2}" height="${H + PAD*2}" viewBox="0 0 ${W + PAD*2} ${H + PAD*2}">
  <defs>
    <linearGradient id="board" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8c98a"/><stop offset="1" stop-color="#dbb870"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W+PAD*2}" height="${H+PAD*2}" rx="18" fill="url(#board)"/>
  <g transform="translate(${PAD} ${PAD})">
    ${verticals}
    ${horizontals}
    ${palace}
    ${river}
    ${stars}
    ${PIECES.map((p, i) => `<!-- piece ${i} -->${pieceSvg(p)}`).join('')}
  </g>
</svg>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg, 'utf8');
console.log(`✅ wrote ${OUT}`);
