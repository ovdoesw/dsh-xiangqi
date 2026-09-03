window.__ModuleLoader__.load({ id: "dsh-xiangqi", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);

// src/core/board.ts
var FILES = 9;
var RANKS = 10;
function opponent(side) {
  return side === "red" ? "black" : "red";
}
function cloneBoard(board) {
  return board.map((row) => row.map((cell) => cell ? { ...cell } : null));
}
function createEmptyBoard() {
  return Array.from({ length: RANKS }, () => Array.from({ length: FILES }, () => null));
}
function placePiece(board, pos, piece) {
  const old = board[pos.rank][pos.file];
  board[pos.rank][pos.file] = piece ? { ...piece } : null;
  return old;
}
function getPiece(board, pos) {
  return board[pos.rank]?.[pos.file] ?? null;
}
function removePiece(board, pos) {
  const piece = board[pos.rank][pos.file];
  board[pos.rank][pos.file] = null;
  return piece;
}
function applyMove(board, move) {
  const piece = removePiece(board, move.from);
  if (!piece) {
    throw new Error(`Illegal move: no piece at ${move.from.file},${move.from.rank}`);
  }
  const captured = removePiece(board, move.to);
  placePiece(board, move.to, piece);
  move.captured = captured ?? void 0;
}
function undoMove(board, move) {
  const piece = removePiece(board, move.to);
  if (!piece) {
    throw new Error(`Cannot undo move: no piece at destination`);
  }
  placePiece(board, move.from, piece);
  if (move.captured) {
    placePiece(board, move.to, move.captured);
  }
}
function findKing(board, side) {
  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (piece && piece.side === side && piece.type === "king") {
        return { file, rank };
      }
    }
  }
  return null;
}

// src/core/fen.ts
var TYPE_TO_CHAR = {
  red: {
    king: "K",
    advisor: "A",
    elephant: "E",
    horse: "H",
    rook: "R",
    cannon: "C",
    pawn: "P"
  },
  black: {
    king: "k",
    advisor: "a",
    elephant: "e",
    horse: "h",
    rook: "r",
    cannon: "c",
    pawn: "p"
  }
};
var CHAR_TO_PIECE = {
  K: { side: "red", type: "king" },
  A: { side: "red", type: "advisor" },
  E: { side: "red", type: "elephant" },
  H: { side: "red", type: "horse" },
  R: { side: "red", type: "rook" },
  C: { side: "red", type: "cannon" },
  P: { side: "red", type: "pawn" },
  k: { side: "black", type: "king" },
  a: { side: "black", type: "advisor" },
  e: { side: "black", type: "elephant" },
  h: { side: "black", type: "horse" },
  r: { side: "black", type: "rook" },
  c: { side: "black", type: "cannon" },
  p: { side: "black", type: "pawn" }
};
function rankToFen(rank) {
  let result = "";
  let empty = 0;
  for (const cell of rank) {
    if (!cell) {
      empty++;
      continue;
    }
    if (empty > 0) {
      result += empty;
      empty = 0;
    }
    result += TYPE_TO_CHAR[cell.side][cell.type];
  }
  if (empty > 0) result += empty;
  return result;
}
function boardToFen(board, sideToMove2) {
  const ranks = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    ranks.push(rankToFen(board[rank]));
  }
  return `${ranks.join("/")} ${sideToMove2 === "red" ? "r" : "b"}`;
}
function fenToRank(rankStr) {
  const rank = [];
  for (const ch of rankStr) {
    if (ch >= "1" && ch <= "9") {
      const empty = parseInt(ch, 10);
      for (let i = 0; i < empty; i++) rank.push(null);
    } else if (CHAR_TO_PIECE[ch]) {
      rank.push({ ...CHAR_TO_PIECE[ch] });
    } else {
      throw new Error(`Invalid FEN rank character: ${ch}`);
    }
  }
  if (rank.length !== FILES) {
    throw new Error(`FEN rank has ${rank.length} files, expected ${FILES}`);
  }
  return rank;
}
function fenToBoard(fen) {
  const [placement, side] = fen.trim().split(/\s+/);
  if (!placement || !side) {
    throw new Error(`Invalid FEN: ${fen}`);
  }
  const rankStrs = placement.split("/");
  if (rankStrs.length !== RANKS) {
    throw new Error(`FEN has ${rankStrs.length} ranks, expected ${RANKS}`);
  }
  const board = createEmptyBoard();
  for (let i = 0; i < RANKS; i++) {
    const rank = fenToRank(rankStrs[i]);
    board[RANKS - 1 - i] = rank;
  }
  if (side !== "r" && side !== "b") {
    throw new Error(`Invalid side to move: ${side}`);
  }
  return { board, sideToMove: side === "r" ? "red" : "black" };
}

// src/core/moves.ts
function isValidPos(pos) {
  return pos.file >= 0 && pos.file < FILES && pos.rank >= 0 && pos.rank < RANKS;
}
function isInPalace(pos, side) {
  if (pos.file < 3 || pos.file > 5) return false;
  if (side === "red") return pos.rank >= 0 && pos.rank <= 2;
  return pos.rank >= 7 && pos.rank <= 9;
}
function countBetween(board, from, to) {
  let count = 0;
  if (from.file === to.file) {
    const step = to.rank > from.rank ? 1 : -1;
    for (let r = from.rank + step; r !== to.rank; r += step) {
      if (board[r][from.file]) count++;
    }
  } else if (from.rank === to.rank) {
    const step = to.file > from.file ? 1 : -1;
    for (let f = from.file + step; f !== to.file; f += step) {
      if (board[from.rank][f]) count++;
    }
  }
  return count;
}
function pieceAttacks(board, from, to) {
  if (!isValidPos(from) || !isValidPos(to)) return false;
  const attacker = board[from.rank][from.file];
  if (!attacker) return false;
  const dx = to.file - from.file;
  const dy = to.rank - from.rank;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const target = board[to.rank][to.file];
  switch (attacker.type) {
    case "rook": {
      if (dx !== 0 && dy !== 0) return false;
      return countBetween(board, from, to) === 0;
    }
    case "cannon": {
      if (dx !== 0 && dy !== 0) return false;
      const between = countBetween(board, from, to);
      if (target) return between === 1;
      return between === 0;
    }
    case "horse": {
      if (adx === 2 && ady === 1) {
        const legFile = from.file + (dx > 0 ? 1 : -1);
        return board[from.rank][legFile] === null;
      }
      if (adx === 1 && ady === 2) {
        const legRank = from.rank + (dy > 0 ? 1 : -1);
        return board[legRank][from.file] === null;
      }
      return false;
    }
    case "elephant": {
      if (adx !== 2 || ady !== 2) return false;
      const eye = { file: from.file + dx / 2, rank: from.rank + dy / 2 };
      if (board[eye.rank][eye.file]) return false;
      if (attacker.side === "red" && to.rank > 4) return false;
      if (attacker.side === "black" && to.rank < 5) return false;
      return true;
    }
    case "advisor": {
      if (adx !== 1 || ady !== 1) return false;
      return isInPalace(from, attacker.side) && isInPalace(to, attacker.side);
    }
    case "king": {
      if (dx === 0 && dy === 0) return false;
      if (adx + ady === 1) {
        return isInPalace(from, attacker.side) && isInPalace(to, attacker.side);
      }
      if (adx === 0 && dy !== 0) {
        return countBetween(board, from, to) === 0 && isInPalace(from, attacker.side) && to.file >= 3 && to.file <= 5;
      }
      return false;
    }
    case "pawn": {
      const forward = attacker.side === "red" ? 1 : -1;
      const crossedRiver = attacker.side === "red" ? from.rank >= 5 : from.rank <= 4;
      if (dx === 0 && dy === forward) return true;
      if (crossedRiver && dy === 0 && adx === 1) return true;
      return false;
    }
  }
}
function isSquareAttacked(board, pos, bySide) {
  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (piece && piece.side === bySide) {
        if (pieceAttacks(board, { file, rank }, pos)) return true;
      }
    }
  }
  return false;
}
function isInCheck(board, side) {
  const kingPos = findKing(board, side);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos, opponent(side));
}
function generatePseudoDestinations(board, pos) {
  const piece = getPiece(board, pos);
  if (!piece) return [];
  const dests = [];
  const addIfReachable = (to, extra) => {
    if (!isValidPos(to)) return;
    const occupant = board[to.rank][to.file];
    if (occupant && occupant.side === piece.side) return;
    if (extra && !extra()) return;
    dests.push(to);
  };
  switch (piece.type) {
    case "rook": {
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0]
      ];
      for (const [df, dr] of dirs) {
        let f = pos.file + df;
        let r = pos.rank + dr;
        while (isValidPos({ file: f, rank: r })) {
          const occupant = board[r][f];
          addIfReachable({ file: f, rank: r });
          if (occupant) break;
          f += df;
          r += dr;
        }
      }
      break;
    }
    case "cannon": {
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0]
      ];
      for (const [df, dr] of dirs) {
        let f = pos.file + df;
        let r = pos.rank + dr;
        let seenPlatform = false;
        while (isValidPos({ file: f, rank: r })) {
          const occupant = board[r][f];
          if (!seenPlatform) {
            if (occupant) {
              seenPlatform = true;
            } else {
              dests.push({ file: f, rank: r });
            }
          } else {
            if (occupant) {
              if (occupant.side !== piece.side) {
                dests.push({ file: f, rank: r });
              }
              break;
            }
          }
          f += df;
          r += dr;
        }
      }
      break;
    }
    case "horse": {
      const horseJumps = [
        [2, 1],
        [2, -1],
        [-2, 1],
        [-2, -1],
        [1, 2],
        [1, -2],
        [-1, 2],
        [-1, -2]
      ];
      for (const [df, dr] of horseJumps) {
        const to = { file: pos.file + df, rank: pos.rank + dr };
        addIfReachable(to, () => pieceAttacks(board, pos, to));
      }
      break;
    }
    case "elephant": {
      const diagonals = [
        [2, 2],
        [2, -2],
        [-2, 2],
        [-2, -2]
      ];
      for (const [df, dr] of diagonals) {
        const to = { file: pos.file + df, rank: pos.rank + dr };
        addIfReachable(to, () => pieceAttacks(board, pos, to));
      }
      break;
    }
    case "advisor": {
      const diagonals = [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1]
      ];
      for (const [df, dr] of diagonals) {
        const to = { file: pos.file + df, rank: pos.rank + dr };
        addIfReachable(to, () => isInPalace(to, piece.side));
      }
      break;
    }
    case "king": {
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0]
      ];
      for (const [df, dr] of dirs) {
        const to = { file: pos.file + df, rank: pos.rank + dr };
        addIfReachable(to, () => isInPalace(to, piece.side));
      }
      break;
    }
    case "pawn": {
      const forward = piece.side === "red" ? 1 : -1;
      const crossedRiver = piece.side === "red" ? pos.rank >= 5 : pos.rank <= 4;
      addIfReachable({ file: pos.file, rank: pos.rank + forward });
      if (crossedRiver) {
        addIfReachable({ file: pos.file + 1, rank: pos.rank });
        addIfReachable({ file: pos.file - 1, rank: pos.rank });
      }
      break;
    }
  }
  return dests;
}
function generateLegalMoves(board, side) {
  const legal = [];
  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (!piece || piece.side !== side) continue;
      const from = { file, rank };
      const dests = generatePseudoDestinations(board, from);
      for (const to of dests) {
        const move = { from, to };
        applyMove(board, move);
        const stillSafe = !isInCheck(board, side);
        undoMove(board, move);
        if (stillSafe) {
          legal.push(move);
        }
      }
    }
  }
  return legal;
}
function isLegalMove(board, side, from, to) {
  const piece = getPiece(board, from);
  if (!piece || piece.side !== side) return false;
  const dests = generatePseudoDestinations(board, from);
  if (!dests.some((d) => d.file === to.file && d.rank === to.rank)) return false;
  const move = { from, to };
  applyMove(board, move);
  const safe = !isInCheck(board, side);
  undoMove(board, move);
  return safe;
}

// src/ai/evaluate.ts
var MATERIAL = {
  king: 1e4,
  rook: 900,
  cannon: 450,
  horse: 400,
  elephant: 200,
  advisor: 200,
  pawn: 100
};
var PST = {
  // Pawns: encourage advancing and crossing the river.
  pawn: [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // rank 0
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    // rank 1
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    10,
    // rank 2
    15,
    15,
    15,
    20,
    20,
    15,
    15,
    15,
    15,
    // rank 3
    25,
    25,
    25,
    30,
    30,
    25,
    25,
    25,
    25,
    // rank 4 (river edge)
    35,
    35,
    40,
    45,
    45,
    40,
    35,
    35,
    35,
    // rank 5 (crossed)
    45,
    45,
    50,
    55,
    55,
    50,
    45,
    45,
    45,
    55,
    55,
    60,
    65,
    65,
    60,
    55,
    55,
    55,
    70,
    70,
    75,
    80,
    80,
    75,
    70,
    70,
    70,
    90,
    90,
    95,
    100,
    100,
    95,
    90,
    90,
    90
    // rank 9 (deep in enemy territory)
  ],
  // Horses: centralize and avoid river corners.
  horse: [
    -10,
    -5,
    0,
    5,
    5,
    5,
    0,
    -5,
    -10,
    -5,
    0,
    10,
    15,
    15,
    15,
    10,
    0,
    -5,
    0,
    10,
    20,
    25,
    25,
    25,
    20,
    10,
    0,
    5,
    15,
    25,
    35,
    35,
    35,
    25,
    15,
    5,
    5,
    15,
    30,
    40,
    40,
    40,
    30,
    15,
    5,
    5,
    15,
    30,
    40,
    40,
    40,
    30,
    15,
    5,
    5,
    15,
    25,
    35,
    35,
    35,
    25,
    15,
    5,
    0,
    10,
    20,
    25,
    25,
    25,
    20,
    10,
    0,
    -5,
    0,
    10,
    15,
    15,
    15,
    10,
    0,
    -5,
    -10,
    -5,
    0,
    5,
    5,
    5,
    0,
    -5,
    -10
  ],
  // Rooks: encourage open files and 7th-rank activity.
  rook: [
    0,
    0,
    0,
    5,
    5,
    5,
    0,
    0,
    0,
    0,
    5,
    5,
    10,
    10,
    10,
    5,
    5,
    0,
    0,
    5,
    10,
    15,
    15,
    15,
    10,
    5,
    0,
    5,
    10,
    15,
    20,
    20,
    20,
    15,
    10,
    5,
    5,
    10,
    15,
    20,
    20,
    20,
    15,
    10,
    5,
    5,
    10,
    15,
    20,
    20,
    20,
    15,
    10,
    5,
    5,
    10,
    15,
    20,
    20,
    20,
    15,
    10,
    5,
    10,
    15,
    20,
    25,
    25,
    25,
    20,
    15,
    10,
    15,
    20,
    25,
    30,
    30,
    30,
    25,
    20,
    15,
    20,
    25,
    30,
    35,
    35,
    35,
    30,
    25,
    20
  ],
  // Cannons: central files and advanced positions.
  cannon: [
    0,
    5,
    5,
    10,
    10,
    10,
    5,
    5,
    0,
    0,
    5,
    10,
    15,
    15,
    15,
    10,
    5,
    0,
    5,
    10,
    15,
    20,
    20,
    20,
    15,
    10,
    5,
    5,
    10,
    20,
    25,
    25,
    25,
    20,
    10,
    5,
    5,
    10,
    20,
    30,
    30,
    30,
    20,
    10,
    5,
    5,
    10,
    20,
    30,
    30,
    30,
    20,
    10,
    5,
    5,
    10,
    20,
    25,
    25,
    25,
    20,
    10,
    5,
    5,
    10,
    15,
    20,
    20,
    20,
    15,
    10,
    5,
    0,
    5,
    10,
    15,
    15,
    15,
    10,
    5,
    0,
    0,
    5,
    5,
    10,
    10,
    10,
    5,
    5,
    0
  ],
  // Elephant: keep home-side defensive shape.
  elephant: [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    10,
    0,
    0,
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    5,
    0,
    5,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    5,
    0,
    5,
    0,
    0,
    0,
    0,
    0,
    10,
    0,
    0,
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  // Advisor: palace centre is best.
  advisor: [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    10,
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    20,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    20,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    10,
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ],
  // King: central file preferred, safety by staying back.
  king: [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ]
};
function pstIndex(piece, rank, file) {
  const r = piece.side === "red" ? rank : RANKS - 1 - rank;
  return r * FILES + file;
}
function evaluate(board, sideToMove2) {
  let redScore = 0;
  let blackScore = 0;
  for (let rank = 0; rank < RANKS; rank++) {
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank][file];
      if (!piece) continue;
      const value = MATERIAL[piece.type] + PST[piece.type][pstIndex(piece, rank, file)];
      if (piece.side === "red") redScore += value;
      else blackScore += value;
    }
  }
  const myScore = sideToMove2 === "red" ? redScore : blackScore;
  const oppScore = sideToMove2 === "red" ? blackScore : redScore;
  return myScore - oppScore + 15;
}

// src/ai/search.ts
var CHECKMATE_SCORE = 1e5;
var STALEMATE_SCORE = 5e4;
function isCapture(board, move) {
  return board[move.to.rank][move.to.file] !== null;
}
function orderMoves(board, moves) {
  return moves.slice().sort((a, b) => {
    const aCap = isCapture(board, a) ? 1 : 0;
    const bCap = isCapture(board, b) ? 1 : 0;
    if (aCap !== bCap) return bCap - aCap;
    const centerA = Math.abs(4 - a.to.file) + Math.abs(4.5 - a.to.rank);
    const centerB = Math.abs(4 - b.to.file) + Math.abs(4.5 - b.to.rank);
    return centerA - centerB;
  });
}
function negamax(board, side, depth, alpha, beta, ply, stats) {
  stats.nodes++;
  const moves = generateLegalMoves(board, side);
  if (moves.length === 0) {
    if (isInCheck(board, side)) {
      return { score: -CHECKMATE_SCORE + ply, bestMove: null };
    }
    return { score: -STALEMATE_SCORE + ply, bestMove: null };
  }
  if (depth <= 0) {
    return { score: evaluate(board, side), bestMove: null };
  }
  const ordered = orderMoves(board, moves);
  let bestMove = null;
  for (const move of ordered) {
    const moving = board[move.from.rank][move.from.file];
    const captured = board[move.to.rank][move.to.file];
    board[move.to.rank][move.to.file] = moving;
    board[move.from.rank][move.from.file] = null;
    const child = negamax(
      board,
      opponent(side),
      depth - 1,
      -beta,
      -alpha,
      ply + 1,
      stats
    );
    const score = -child.score;
    board[move.from.rank][move.from.file] = moving;
    board[move.to.rank][move.to.file] = captured;
    if (score > alpha) {
      alpha = score;
      bestMove = move;
      if (alpha >= beta) break;
    }
  }
  return { score: alpha, bestMove };
}
function searchDepth(board, sideToMove2, depth) {
  const stats = { nodes: 0 };
  const { score, bestMove } = negamax(
    board,
    sideToMove2,
    depth,
    -Infinity,
    Infinity,
    0,
    stats
  );
  return { bestMove, score, depth, nodes: stats.nodes };
}
function searchIterative(board, sideToMove2, options = {}) {
  const maxDepth = options.maxDepth ?? 4;
  const timeLimit = options.timeLimitMs ?? 3e3;
  const start = Date.now();
  const stats = { nodes: 0 };
  let best = {
    bestMove: null,
    score: evaluate(board, sideToMove2),
    depth: 0,
    nodes: 0
  };
  for (let depth = 1; depth <= maxDepth; depth++) {
    if (Date.now() - start >= timeLimit) break;
    const result = negamax(
      board,
      sideToMove2,
      depth,
      -Infinity,
      Infinity,
      0,
      stats
    );
    if (result.bestMove) {
      best = {
        bestMove: result.bestMove,
        score: result.score,
        depth,
        nodes: stats.nodes
      };
    }
    if (result.score >= CHECKMATE_SCORE - 100) break;
  }
  return best;
}

// src/ai/engine.ts
function randomInt(max) {
  return Math.floor(Math.random() * max);
}
function pickWithPerturbation(board, sideToMove2, topK) {
  const moves = generateLegalMoves(board, sideToMove2);
  if (moves.length === 0) {
    return { bestMove: null, score: 0, depth: 0, nodes: 0 };
  }
  const scored = moves.map((move) => {
    const moving = board[move.from.rank][move.from.file];
    const captured = board[move.to.rank][move.to.file];
    board[move.to.rank][move.to.file] = moving;
    board[move.from.rank][move.from.file] = null;
    const score = -evaluate(board, opponent(sideToMove2));
    board[move.from.rank][move.from.file] = moving;
    board[move.to.rank][move.to.file] = captured;
    return { move, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const k = Math.min(topK, scored.length);
  const chosen = scored[randomInt(k)];
  return {
    bestMove: chosen.move,
    score: chosen.score,
    depth: 1,
    nodes: scored.length
  };
}
function toEngineResult(result, difficulty) {
  return {
    move: result.bestMove,
    score: result.score,
    depth: result.depth,
    nodes: result.nodes,
    difficulty
  };
}
function getBestMove(fen, difficulty) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const { board, sideToMove: sideToMove2 } = fenToBoard(fen);
        let result;
        switch (difficulty) {
          case "easy":
            result = pickWithPerturbation(board, sideToMove2, 3);
            break;
          case "medium":
            result = searchDepth(board, sideToMove2, 2);
            break;
          case "hard":
            result = searchIterative(board, sideToMove2, {
              maxDepth: 4,
              timeLimitMs: 5e3
            });
            break;
          default:
            result = searchDepth(board, sideToMove2, 2);
        }
        resolve(toEngineResult(result, difficulty));
      } catch (err) {
        reject(err);
      }
    }, 0);
  });
}

// src/client/store.ts
var import_client = require("@deepseek-ai/dsh-client-runtime/client");

// src/core/rules.ts
function checkTerminalByImmobility(board, sideToMove2) {
  const moves = generateLegalMoves(board, sideToMove2);
  if (moves.length > 0) return null;
  if (isInCheck(board, sideToMove2)) {
    return {
      winner: opponent(sideToMove2),
      reason: "\u5C06\u6740 checkmate"
    };
  }
  return {
    winner: opponent(sideToMove2),
    reason: "\u56F0\u6BD9 stalemate"
  };
}
function detectRepetition(positionHistory, sideToMove2) {
  if (positionHistory.length < 3) return null;
  const last = positionHistory[positionHistory.length - 1];
  let count = 0;
  for (const pos of positionHistory) {
    if (pos === last) count++;
  }
  if (count >= 3) {
    return {
      // The repeated position is produced by the opponent of `sideToMove`
      // (they just moved into it); the perpetual checker / repetition-maker
      // is the one at fault. Winner = sideToMove (the non-repeating side).
      winner: sideToMove2,
      reason: "\u957F\u5C06/\u91CD\u590D\u5C40\u9762 repetition"
    };
  }
  return null;
}
function checkGameEnd(board, sideToMove2, positionHistory) {
  return checkTerminalByImmobility(board, sideToMove2) ?? detectRepetition(positionHistory, sideToMove2);
}

// src/core/openings.ts
function matchPattern(moves, pattern) {
  if (pattern.length > moves.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    const m = moves[i];
    const p = pattern[i];
    if (m.from.file !== p.from.file || m.from.rank !== p.from.rank) return false;
    if (m.to.file !== p.to.file || m.to.rank !== p.to.rank) return false;
    if (p.pieceType) {
    }
  }
  return true;
}
var OPENINGS = [
  // Red first moves
  {
    name: "\u5F53\u5934\u70AE",
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u5F53\u5934\u70AE",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u4ED9\u4EBA\u6307\u8DEF",
    moves: [
      { from: { file: 4, rank: 3 }, to: { file: 4, rank: 4 }, side: "red" }
    ]
  },
  {
    name: "\u98DE\u76F8\u5C40",
    moves: [
      { from: { file: 2, rank: 0 }, to: { file: 4, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u98DE\u76F8\u5C40",
    moves: [
      { from: { file: 6, rank: 0 }, to: { file: 4, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u8D77\u9A6C\u5C40",
    moves: [
      { from: { file: 1, rank: 0 }, to: { file: 2, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u8D77\u9A6C\u5C40",
    moves: [
      { from: { file: 7, rank: 0 }, to: { file: 6, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u8FC7\u5BAB\u70AE",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 1, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u4ED5\u89D2\u70AE",
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 0, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u4ED5\u89D2\u70AE",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 8, rank: 2 }, side: "red" }
    ]
  },
  // Black responses to 当头炮
  {
    name: "\u987A\u624B\u70AE",
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 1, rank: 7 }, to: { file: 4, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u987A\u624B\u70AE",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 7, rank: 7 }, to: { file: 4, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u5217\u624B\u70AE",
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 7, rank: 7 }, to: { file: 4, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u5217\u624B\u70AE",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 1, rank: 7 }, to: { file: 4, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u5C4F\u98CE\u9A6C",
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u5C4F\u98CE\u9A6C",
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u5C4F\u98CE\u9A6C",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u5C4F\u98CE\u9A6C",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: "black" }
    ]
  },
  // Black first move independent openings
  {
    name: "\u4ED9\u4EBA\u6307\u8DEF",
    moves: [
      { from: { file: 4, rank: 6 }, to: { file: 4, rank: 5 }, side: "black" }
    ]
  },
  {
    name: "\u98DE\u8C61\u5C40",
    moves: [
      { from: { file: 2, rank: 9 }, to: { file: 4, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u98DE\u8C61\u5C40",
    moves: [
      { from: { file: 6, rank: 9 }, to: { file: 4, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u5C4F\u98CE\u9A6C",
    moves: [
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: "black" }
    ]
  },
  {
    name: "\u5C4F\u98CE\u9A6C",
    moves: [
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: "black" }
    ]
  },
  // Longer named combos
  {
    name: "\u4E2D\u70AE\u5BF9\u5C4F\u98CE\u9A6C",
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: "black" },
      { from: { file: 7, rank: 0 }, to: { file: 6, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u4E2D\u70AE\u5BF9\u5C4F\u98CE\u9A6C",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: "black" },
      { from: { file: 1, rank: 0 }, to: { file: 2, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u4E94\u4E03\u70AE",
    moves: [
      { from: { file: 1, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 1, rank: 9 }, to: { file: 2, rank: 7 }, side: "black" },
      { from: { file: 7, rank: 2 }, to: { file: 6, rank: 2 }, side: "red" }
    ]
  },
  {
    name: "\u4E94\u4E03\u70AE",
    moves: [
      { from: { file: 7, rank: 2 }, to: { file: 4, rank: 2 }, side: "red" },
      { from: { file: 7, rank: 9 }, to: { file: 6, rank: 7 }, side: "black" },
      { from: { file: 1, rank: 2 }, to: { file: 2, rank: 2 }, side: "red" }
    ]
  }
];
function identifyOpening(moves) {
  let best = null;
  for (const opening of OPENINGS) {
    if (matchPattern(moves, opening.moves)) {
      if (!best || opening.moves.length > best.length) {
        best = { name: opening.name, length: opening.moves.length };
      }
    }
  }
  return best?.name ?? null;
}

// src/core/flavor.ts
var CAPTURE_TABLE = {
  king: [
    "\u4E00\u7834\uFF0C\u5367\u9F99\u51FA\u5C71\uFF01",
    "\u4E3B\u516C\uFF0C\u5FEB\u8D70\uFF01",
    "\u738B\u4FAF\u5C06\u76F8\uFF0C\u5B81\u6709\u79CD\u4E4E\uFF1F",
    "\u5929\u4E0B\u5927\u52BF\uFF0C\u5C3D\u5165\u6211\u624B\u3002"
  ],
  rook: [
    "\u4F60\u7684\u5927\u5C06\uFF0C\u6211\u6536\u4E0B\u4E86\uFF01",
    "\u8F66\u5982\u6D41\u6C34\u9A6C\u5982\u9F99\uFF0C\u4ECA\u4E3A\u6211\u7528\u3002",
    "\u65AD\u5176\u8F66\u9635\uFF0C\u7834\u5176\u950B\u8292\uFF01",
    "\u6B64\u8F66\uFF0C\u6211\u7B11\u7EB3\u4E86\u3002"
  ],
  horse: [
    "\u597D\u9A6C\u914D\u597D\u978D\uFF0C\u53EF\u60DC\u5F52\u6211\u4E86\u3002",
    "\u9A6C\u5931\u524D\u8E44\uFF0C\u5C40\u52BF\u5DF2\u53BB\u3002",
    "\u91D1\u6208\u94C1\u9A6C\uFF0C\u6C14\u541E\u4E07\u91CC\u5982\u864E\u3002"
  ],
  cannon: [
    "\u96F7\u516C\u52A9\u6211\uFF01",
    "\u70AE\u58F0\u4E00\u54CD\uFF0C\u9EC4\u91D1\u4E07\u4E24\u3002",
    "\u9694\u5C71\u6253\u725B\uFF0C\u6B63\u4E2D\u8981\u5BB3\uFF01"
  ],
  elephant: [
    "\u585E\u7FC1\u5931\u9A6C\uFF0C\u7109\u77E5\u975E\u798F\u3002",
    "\u8C61\u8D70\u7530\uFF0C\u773C\u88AB\u585E\uFF0C\u5C40\u52BF\u5D29\u3002",
    "\u62D4\u5176\u8C61\u773C\uFF0C\u65AD\u5176\u6839\u57FA\u3002"
  ],
  advisor: [
    "\u65AD\u5176\u5DE6\u8180\u53F3\u81C2\uFF01",
    "\u58EB\u4E3A\u77E5\u5DF1\u8005\u6B7B\uFF0C\u53EF\u60DC\u4E0D\u662F\u4E3A\u6211\u3002",
    "\u8C0B\u58EB\u53BB\uFF0C\u9738\u4E1A\u53EF\u56FE\u3002"
  ],
  pawn: [
    "\u4E00\u9F13\u4F5C\u6C14\uFF0C\u518D\u800C\u8870\uFF0C\u4E09\u800C\u7AED\u3002",
    "\u5C0F\u5352\u8FC7\u6CB3\u9876\u5927\u8F66\uFF01",
    "\u5175\u65E0\u5E38\u52BF\uFF0C\u6C34\u65E0\u5E38\u5F62\u3002"
  ]
};
var CHECK_LINES = [
  "\u5C06\u519B\uFF01",
  "\u4E3B\u516C\uFF0C\u5371\u77E3\uFF01",
  "\u6B64\u5730\u4E0D\u5B9C\u4E45\u7559\u3002",
  "\u770B\u8FD9\u4E00\u62DB\uFF01"
];
var CHECKMATE_LINES = [
  "\u4E00\u7834\uFF0C\u5367\u9F99\u51FA\u5C71\uFF01",
  "\u5929\u4E0B\u5927\u52BF\uFF0C\u4E3A\u6211\u6240\u63A7\u3002",
  "\u89C2\u4ECA\u591C\u5929\u8C61\uFF0C\u77E5\u5929\u4E0B\u5927\u4E8B\u3002",
  "\u6EDA\u6EDA\u957F\u6C5F\u4E1C\u901D\u6C34\uFF0C\u6D6A\u82B1\u6DD8\u5C3D\u82F1\u96C4\u3002"
];
var STALEMATE_LINES = [
  "\u56F0\u6BD9\uFF01\u8FDB\u9000\u7EF4\u8C37\uFF0C\u63D2\u7FC5\u96BE\u98DE\u3002",
  "\u6B64\u5C40\uFF0C\u5DF2\u65E0\u6D3B\u8DEF\u3002"
];
function hashPair(a, b) {
  let h = 0;
  for (const ch of a + b) {
    h = h * 31 + ch.charCodeAt(0) >>> 0;
  }
  return h;
}
function pickLine(lines, seed) {
  return lines[seed % lines.length];
}
function captionForCapture(capturedPiece, attackerPiece) {
  const pool = CAPTURE_TABLE[capturedPiece.type];
  if (!pool || pool.length === 0) return null;
  const seed = attackerPiece ? hashPair(capturedPiece.type, attackerPiece.type) : hashPair(capturedPiece.type, capturedPiece.side);
  return pickLine(pool, seed);
}
function captionForCheck() {
  return pickLine(CHECK_LINES, Date.now() % CHECK_LINES.length);
}
function captionForCheckmate() {
  return pickLine(CHECKMATE_LINES, Date.now() % CHECKMATE_LINES.length);
}
function captionForStalemate() {
  return pickLine(STALEMATE_LINES, Date.now() % STALEMATE_LINES.length);
}
function pieceName(piece) {
  const names = {
    red: {
      king: "\u5E05",
      advisor: "\u4ED5",
      elephant: "\u76F8",
      horse: "\u508C",
      rook: "\u4FE5",
      cannon: "\u70AE",
      pawn: "\u5175"
    },
    black: {
      king: "\u5C07",
      advisor: "\u58EB",
      elephant: "\u8C61",
      horse: "\u99AC",
      rook: "\u8ECA",
      cannon: "\u7832",
      pawn: "\u5352"
    }
  };
  return names[piece.side][piece.type];
}

// src/client/game.ts
var HUMAN_SIDE = "red";
function initialFen() {
  return "rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r";
}
function parseFen(fen) {
  return fenToBoard(fen);
}
function sideToMove(fen) {
  return fenToBoard(fen).sideToMove;
}
function legalDestinations(fen, from) {
  const { board, sideToMove: stm } = fenToBoard(fen);
  const piece = getPiece(board, from);
  if (!piece || piece.side !== stm) return [];
  return generateLegalMoves(board, stm).filter((m) => m.from.file === from.file && m.from.rank === from.rank).map((m) => m.to);
}
function canMove(fen, side, from, to) {
  return isLegalMove(fenToBoard(fen).board, side, from, to);
}
function moveAndFen(fen, side, from, to) {
  const board = cloneBoard(fenToBoard(fen).board);
  const captured = getPiece(board, to);
  const move = { from, to, captured: captured ?? void 0 };
  applyMove(board, move);
  return { move, nextFen: boardToFen(board, opponent(side)), captured };
}
function detectEvent(_fenBefore, side, move, history, nextFen) {
  const board = fenToBoard(nextFen).board;
  const oppSide = opponent(side);
  const opening = identifyOpening(history);
  if (opening && history.length <= 5) {
    return { type: "opening", line: opening };
  }
  const end = checkGameEnd(board, oppSide, []);
  if (end) {
    const line = end.reason === "\u5C06\u6740 checkmate" ? captionForCheckmate() : captionForStalemate();
    return { type: "mate", line };
  }
  if (move.captured) {
    const line = captionForCapture(move.captured, getPiece(board, move.to) ?? void 0);
    if (line) return { type: "capture", line };
  }
  if (isInCheck(board, oppSide)) {
    return { type: "check", line: captionForCheck() };
  }
  return null;
}
function terminalResult(fen, historyPositions) {
  const { board, sideToMove: stm } = fenToBoard(fen);
  return checkGameEnd(board, stm, historyPositions);
}
function recentMoveNotation(history) {
  return history.slice(-6).map((m) => `${m.from.file}${m.from.rank}-${m.to.file}${m.to.rank}`);
}

// src/client/store.ts
var INITIAL_FEN = "rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r";
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function defaultState() {
  return {
    fen: INITIAL_FEN,
    history: [],
    positions: [INITIAL_FEN],
    difficulty: "medium",
    gameOver: null,
    panel: "closed",
    mascot: { x: 24, y: 24 },
    settings: {
      autoComment: true,
      commentStyle: "fun",
      llmOverride: null
    },
    lastEvent: null,
    aiThinking: false,
    comment: null
  };
}
function createStore() {
  return (0, import_client.defineStore)({
    init: defaultState,
    persist: "xiangqi",
    actions: {
      setDifficulty(draft, difficulty) {
        draft.difficulty = difficulty;
      },
      setPanel(draft, panel) {
        draft.panel = panel;
      },
      togglePanel(draft) {
        draft.panel = draft.panel === "panel" ? "closed" : "panel";
      },
      openFullscreen(draft) {
        draft.panel = "fullscreen";
      },
      moveMascot(draft, x, y) {
        draft.mascot = { x: clamp(x, 0, 4e3), y: clamp(y, 0, 4e3) };
      },
      setAutoComment(draft, autoComment) {
        draft.settings.autoComment = autoComment;
      },
      setCommentStyle(draft, commentStyle) {
        draft.settings.commentStyle = commentStyle;
      },
      setLlmOverride(draft, llmOverride) {
        draft.settings.llmOverride = llmOverride;
      },
      newGame(draft) {
        draft.fen = INITIAL_FEN;
        draft.history = [];
        draft.positions = [INITIAL_FEN];
        draft.gameOver = null;
        draft.lastEvent = null;
        draft.aiThinking = false;
        draft.comment = null;
      },
      undo(draft) {
        if (draft.gameOver || draft.aiThinking) return;
        const cut = Math.min(draft.history.length, 2);
        if (cut === 0) return;
        draft.history = draft.history.slice(0, draft.history.length - cut);
        draft.positions = draft.positions.slice(0, draft.positions.length - cut);
        draft.fen = draft.positions[draft.positions.length - 1] ?? INITIAL_FEN;
        draft.lastEvent = null;
        draft.aiThinking = false;
        draft.comment = null;
      },
      /** Commit a human move; the caller has already validated legality. */
      applyHumanMove(draft, move, nextFen, event) {
        draft.history = [...draft.history, move];
        draft.positions = [...draft.positions, nextFen];
        draft.fen = nextFen;
        if (event) draft.lastEvent = event;
      },
      /** Commit an AI reply (already validated by the engine). */
      applyAiMove(draft, move, nextFen, event) {
        draft.history = [...draft.history, move];
        draft.positions = [...draft.positions, nextFen];
        draft.fen = nextFen;
        draft.aiThinking = false;
        if (event) draft.lastEvent = event;
      },
      setGameOver(draft, gameOver) {
        draft.gameOver = gameOver;
        draft.aiThinking = false;
      },
      setLastEvent(draft, event) {
        draft.lastEvent = event;
      },
      setAiThinking(draft, thinking) {
        draft.aiThinking = thinking;
      },
      setComment(draft, comment) {
        draft.comment = comment;
      }
    }
  });
}

// src/client/comment.ts
var PRO_SYSTEM = "\u4F60\u662F\u4E00\u4F4D\u4E2D\u56FD\u8C61\u68CB\u804C\u4E1A\u68CB\u8BC4\u3002\u8BF7\u7528 1\u20133 \u53E5\u8BDD\u70B9\u8BC4\u5F53\u524D\u5C40\u9762\uFF1A\u4F18\u52A3\u3001\u5173\u952E\u5B50\u529B\u3001\u4E0B\u4E00\u6B65\u601D\u8DEF\u3002\u53EA\u8F93\u51FA\u70B9\u8BC4\u672C\u8EAB\uFF0C\u4E0D\u8981\u5BA2\u5957\u8BDD\u3002";
var FUN_SYSTEM = "\u4F60\u662F\u4E00\u4F4D\u98CE\u8DA3\u7684\u8C61\u68CB\u5A31\u4E50\u89E3\u8BF4\uFF0C\u8BED\u6C14\u50CF\u7F51\u7EDC\u4E3B\u64AD\uFF0C\u7231\u7528\u4E09\u56FD\u6740\u5F0F\u7684\u70ED\u8840\u53F0\u8BCD\u3002\u8BF7\u7528 1\u20133 \u53E5\u8BDD\u70B9\u8BC4\u5F53\u524D\u5C40\u9762\uFF0C\u5E7D\u9ED8\u3001\u6709\u6897\u3001\u4E0D\u8BF4\u5E9F\u8BDD\u3002\u53EA\u8F93\u51FA\u70B9\u8BC4\u672C\u8EAB\u3002";
function buildUserPrompt(input) {
  const moveLine = input.recentMoves.length > 0 ? `\u6700\u8FD1\u8D70\u6CD5\uFF1A${input.recentMoves.join(" ")}` : "\uFF08\u5F00\u5C40\uFF0C\u5C1A\u65E0\u8D70\u6CD5\uFF09";
  const eventLine = input.event ? `\u4E8B\u4EF6\uFF1A${input.event.type} - ${input.event.line}` : "\u4E8B\u4EF6\uFF1A\u65E0";
  const styleLine = input.style === "pro" ? "\u98CE\u683C\uFF1A\u4E13\u4E1A\u68CB\u8BC4" : "\u98CE\u683C\uFF1A\u5A31\u4E50\u89E3\u8BF4";
  const diffLine = `\u96BE\u5EA6\uFF1A${input.difficulty}`;
  return [
    `\u5F53\u524D\u5C40\u9762 FEN\uFF1A${input.fen}`,
    moveLine,
    eventLine,
    styleLine,
    diffLine,
    "\u8BF7\u70B9\u8BC4\u3002"
  ].join("\n");
}
function tryCoerce(text) {
  return text.trim();
}
async function generateCommentary(llm, input, override, signal) {
  const user = buildUserPrompt(input);
  const system = input.style === "pro" ? PRO_SYSTEM : FUN_SYSTEM;
  try {
    if (override?.base && override.model) {
      const text2 = await completeViaFetch(override, system, user, signal);
      const coerced2 = tryCoerce(text2);
      return coerced2 ? { text: coerced2 } : null;
    }
    if (!llm) return null;
    const model = llm.defaultModel();
    if (!model) return null;
    const text = await llm.complete({ model, system, user, signal });
    const coerced = tryCoerce(text);
    return coerced ? { text: coerced } : null;
  } catch {
    return null;
  }
}
async function completeViaFetch(override, system, user, signal) {
  const base = override.base.replace(/\/+$/, "");
  const url = `${base}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...override.key ? { Authorization: `Bearer ${override.key}` } : {}
    },
    body: JSON.stringify({
      model: override.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.7,
      max_tokens: 160
    }),
    signal
  });
  if (!res.ok) throw new Error(`LLM override failed: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// src/client/Mascot.tsx
var import_react = require("react");

// src/client/pieces.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function pieceLabel(piece) {
  return pieceName(piece);
}
function inkColor(side) {
  return side === "red" ? "#c1272d" : "#1a1a1a";
}
function PieceView({
  piece,
  size = 32,
  selected = false,
  hint = false,
  isLastMove = false
}) {
  const char = pieceLabel(piece);
  const ink = inkColor(piece.side);
  const r = size / 2;
  const innerR = r * 0.72;
  const stroke = selected ? "#2f80ed" : hint ? "#27ae60" : "#7a4b26";
  const strokeWidth = selected || hint ? Math.max(1.5, size * 0.08) : Math.max(1, size * 0.05);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: `-${r} -${r} ${size} ${size}`,
      style: { display: "block", overflow: "visible" },
      "aria-hidden": "true",
      children: [
        isLastMove ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { r: r - 1, fill: "none", stroke: "#e6b800", strokeWidth: size * 0.06, opacity: 0.9 }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { r: r - strokeWidth / 2, fill: "#f3e3be", stroke, strokeWidth }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { r: innerR, fill: "none", stroke: ink, strokeWidth: Math.max(0.8, size * 0.035), opacity: 0.55 }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "text",
          {
            x: 0,
            y: 0,
            textAnchor: "middle",
            dominantBaseline: "central",
            fontSize: size * 0.58,
            fontWeight: 700,
            fill: ink,
            fontFamily: "'Noto Serif SC', 'Songti SC', 'SimSun', 'KaiTi', serif",
            children: char
          }
        )
      ]
    }
  );
}

// src/client/Mascot.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var INVITES = [
  "\u6765\u4E0B\u4E00\u76D8\uFF1F",
  "\u7B49\u4F60\u5462\uFF0C\u7EA2\u65B9\u5148\u8D70\uFF01",
  "AI \u8FD8\u5728\u601D\u8003\uFF0C\u6765\u6740\u4E00\u5C40\uFF1F",
  "\u95F2\u7740\u4E5F\u662F\u95F2\u7740\uFF0C\u4E0B\u68CB\uFF01",
  "\u6562\u4E0D\u6562\uFF1F\u80DC\u6211\u8005\u5F97\u5929\u4E0B\u3002"
];
function randomInvite() {
  return INVITES[Math.floor(Math.random() * INVITES.length)];
}
var HELD_PIECE = { side: "red", type: "elephant" };
function Mascot({ useStore, actions }) {
  const mascot = useStore((s) => s.mascot);
  const panel = useStore((s) => s.panel);
  const [hovered, setHovered] = (0, import_react.useState)(false);
  const [invite, setInvite] = (0, import_react.useState)(randomInvite());
  const movedRef = (0, import_react.useRef)(false);
  const draggingRef = (0, import_react.useRef)(false);
  (0, import_react.useEffect)(() => {
    if (hovered) setInvite(randomInvite());
  }, [hovered]);
  const onPointerDown = (0, import_react.useCallback)(
    (e) => {
      if (e.button !== 0) return;
      movedRef.current = false;
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    []
  );
  const onPointerMove = (0, import_react.useCallback)(
    (e) => {
      if (!draggingRef.current) return;
      const dx = Math.abs(e.movementX);
      const dy = Math.abs(e.movementY);
      if (dx > 1 || dy > 1) movedRef.current = true;
      actions.moveMascot(e.clientX, e.clientY);
    },
    [actions]
  );
  const endDrag = (0, import_react.useCallback)((e) => {
    draggingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
    }
  }, []);
  const onClick = (0, import_react.useCallback)(() => {
    if (movedRef.current) return;
    if (panel === "closed") actions.setPanel("panel");
    else actions.togglePanel();
  }, [actions, panel]);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      className: "dsh-xiangqi-mascot",
      style: {
        position: "fixed",
        left: mascot.x,
        top: mascot.y,
        pointerEvents: "auto",
        cursor: "grab",
        userSelect: "none",
        zIndex: 2147483e3,
        transform: "translate(-50%, -50%)",
        touchAction: "none"
      },
      role: "button",
      "aria-label": "\u4E2D\u56FD\u8C61\u68CB\u5C0F\u5BA0\u7269",
      tabIndex: 0,
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (panel === "closed") actions.setPanel("panel");
          else actions.togglePanel();
        }
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "div",
          {
            className: "dsh-xiangqi-bubble",
            style: {
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: `translateX(-50%) translateY(${hovered ? "-4px" : "8px"})`,
              opacity: hovered ? 1 : 0,
              transition: "opacity 160ms ease, transform 160ms ease",
              background: "#fff",
              border: "1px solid #e5e0d5",
              borderRadius: 12,
              padding: "6px 12px",
              fontSize: 13,
              whiteSpace: "nowrap",
              boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
              pointerEvents: "none",
              fontFamily: "inherit",
              color: "#3a342c"
            },
            children: [
              invite,
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "span",
                {
                  style: {
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "6px solid #fff"
                  }
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("svg", { width: 64, height: 72, viewBox: "0 0 64 72", style: { display: "block" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M20 40 Q14 30 22 18", stroke: "#c98f3b", strokeWidth: 5, fill: "none", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M44 40 Q50 30 42 18", stroke: "#c98f3b", strokeWidth: 5, fill: "none", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ellipse", { cx: 32, cy: 52, rx: 24, ry: 19, fill: "#f6c66b", stroke: "#c98f3b", strokeWidth: 2 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ellipse", { cx: 32, cy: 56, rx: 15, ry: 11, fill: "#fbe1b2" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 14, cy: 30, r: 7, fill: "#f6c66b", stroke: "#c98f3b", strokeWidth: 2 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 50, cy: 30, r: 7, fill: "#f6c66b", stroke: "#c98f3b", strokeWidth: 2 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 14, cy: 30, r: 3.5, fill: "#8a5a2b" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 50, cy: 30, r: 3.5, fill: "#8a5a2b" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 24, cy: 44, r: 2.5, fill: "#4a2f1a" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 40, cy: 44, r: 2.5, fill: "#4a2f1a" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M27 52 Q32 56 37 52", stroke: "#4a2f1a", strokeWidth: 2, fill: "none", strokeLinecap: "round" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 20, cy: 50, r: 3, fill: "#f4a0a0", opacity: 0.7 }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: 44, cy: 50, r: 3, fill: "#f4a0a0", opacity: 0.7 })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "span",
          {
            style: {
              position: "absolute",
              top: 0,
              left: "50%",
              transform: `translate(-50%, ${hovered ? "-6px" : "0px"})`,
              transition: "transform 160ms ease"
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PieceView, { piece: HELD_PIECE, size: 32 })
          }
        )
      ]
    }
  );
}

// src/client/BoardPanel.tsx
var import_react2 = require("react");

// src/client/board.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function BoardRenderer({
  fen,
  selected,
  onSquareClick,
  interactive,
  lastMove = null,
  cellSize = 40
}) {
  const { board } = parseFen(fen);
  const hints = selected ? legalDestinations(fen, selected) : [];
  const hintSet = new Set(hints.map((p) => `${p.file},${p.rank}`));
  const width = 9 * cellSize;
  const height = 10 * cellSize;
  const sx = (file) => (8 - file) * cellSize + cellSize / 2;
  const sy = (rank) => (9 - rank) * cellSize + cellSize / 2;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      className: "dsh-xiangqi-board",
      style: { position: "relative", width, height, background: "#e8c98a", borderRadius: 8, overflow: "hidden" },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("svg", { width, height, style: { position: "absolute", inset: 0 }, children: [
          Array.from({ length: 9 }, (_, f) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "line",
              {
                x1: (8 - f) * cellSize + cellSize / 2,
                y1: cellSize / 2,
                x2: (8 - f) * cellSize + cellSize / 2,
                y2: 4.5 * cellSize,
                stroke: "#7a4b26",
                strokeWidth: 1
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "line",
              {
                x1: (8 - f) * cellSize + cellSize / 2,
                y1: 5.5 * cellSize,
                x2: (8 - f) * cellSize + cellSize / 2,
                y2: height - cellSize / 2,
                stroke: "#7a4b26",
                strokeWidth: 1
              }
            )
          ] }, `v${f}`)),
          Array.from({ length: 10 }, (_, r) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "line",
            {
              x1: cellSize / 2,
              y1: (9 - r) * cellSize + cellSize / 2,
              x2: width - cellSize / 2,
              y2: (9 - r) * cellSize + cellSize / 2,
              stroke: "#7a4b26",
              strokeWidth: 1
            },
            `h${r}`
          )),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "path",
            {
              d: `M ${sx(3)} ${sy(0)} L ${sx(5)} ${sy(2)} M ${sx(5)} ${sy(0)} L ${sx(3)} ${sy(2)}`,
              stroke: "#7a4b26",
              strokeWidth: 1,
              fill: "none"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
            "path",
            {
              d: `M ${sx(3)} ${sy(7)} L ${sx(5)} ${sy(9)} M ${sx(5)} ${sy(7)} L ${sx(3)} ${sy(9)}`,
              stroke: "#7a4b26",
              strokeWidth: 1,
              fill: "none"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("text", { x: width * 0.25, y: 5 * cellSize, textAnchor: "middle", dominantBaseline: "middle", fontSize: cellSize * 0.42, fill: "#9c6b32", fontFamily: "inherit", children: "\u695A \u6CB3" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("text", { x: width * 0.75, y: 5 * cellSize, textAnchor: "middle", dominantBaseline: "middle", fontSize: cellSize * 0.42, fill: "#9c6b32", fontFamily: "inherit", children: "\u6F22 \u754C" }),
          starPoints().map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("g", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: sx(p.file) - 4, y1: sy(p.rank), x2: sx(p.file) + 4, y2: sy(p.rank), stroke: "#7a4b26", strokeWidth: 1 }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("line", { x1: sx(p.file), y1: sy(p.rank) - 4, x2: sx(p.file), y2: sy(p.rank) + 4, stroke: "#7a4b26", strokeWidth: 1 })
          ] }, `sp${i}`))
        ] }),
        interactive && Array.from(
          { length: 10 },
          (_, rank) => Array.from({ length: 9 }, (_2, file) => {
            const pos = { file, rank };
            const key = `${file},${rank}`;
            const isHint = hintSet.has(key);
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "div",
              {
                onClick: () => onSquareClick(pos),
                style: {
                  position: "absolute",
                  left: sx(file) - cellSize / 2,
                  top: sy(rank) - cellSize / 2,
                  width: cellSize,
                  height: cellSize,
                  cursor: isHint ? "pointer" : "default",
                  ...isHint ? { background: "rgba(39,174,96,0.28)", borderRadius: "50%" } : {}
                }
              },
              key
            );
          })
        ),
        selected ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "div",
          {
            style: {
              position: "absolute",
              left: sx(selected.file) - cellSize / 2,
              top: sy(selected.rank) - cellSize / 2,
              width: cellSize,
              height: cellSize,
              background: "rgba(47,128,237,0.35)",
              borderRadius: 8,
              pointerEvents: "none"
            }
          }
        ) : null,
        lastMove ? [lastMove.from, lastMove.to].map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "div",
          {
            style: {
              position: "absolute",
              left: sx(p.file) - cellSize / 2 + cellSize * 0.15,
              top: sy(p.rank) - cellSize / 2 + cellSize * 0.15,
              width: cellSize * 0.7,
              height: cellSize * 0.7,
              borderRadius: 4,
              outline: "2px solid rgba(230,184,0,0.85)",
              pointerEvents: "none"
            }
          },
          `lm${i}`
        )) : null,
        board.map(
          (row, rank) => row.map((piece, file) => {
            if (!piece) return null;
            return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
              "div",
              {
                style: {
                  position: "absolute",
                  left: sx(file) - cellSize / 2,
                  top: sy(rank) - cellSize / 2,
                  width: cellSize,
                  height: cellSize,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none"
                },
                children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PieceView, { piece, size: cellSize * 0.82 })
              },
              `${file},${rank}`
            );
          })
        )
      ]
    }
  );
}
function starPoints() {
  const points = [];
  for (const file of [1, 7]) {
    points.push({ file, rank: 2 }, { file, rank: 7 });
  }
  for (const file of [0, 2, 4, 6, 8]) {
    points.push({ file, rank: 3 }, { file, rank: 6 });
  }
  return points;
}

// src/core/notation.ts
var NOTATION_PIECE_NAMES = {
  red: { king: "\u5E05", advisor: "\u4ED5", elephant: "\u76F8", horse: "\u9A6C", rook: "\u8F66", cannon: "\u70AE", pawn: "\u5175" },
  black: { king: "\u5C06", advisor: "\u58EB", elephant: "\u8C61", horse: "\u9A6C", rook: "\u8F66", cannon: "\u70AE", pawn: "\u5352" }
};
var RED_DIGITS = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4E03", "\u516B", "\u4E5D"];
function fileNotation(file, side) {
  if (side === "red") return RED_DIGITS[file] ?? String(file + 1);
  return String(9 - file);
}
function sameFilePeers(board, piece, from) {
  let ahead = 0;
  let behind = 0;
  for (let rank = 0; rank < RANKS; rank++) {
    if (rank === from.rank) continue;
    const other = board[rank][from.file];
    if (!other || other.side !== piece.side || other.type !== piece.type) continue;
    const isAheadForRed = rank > from.rank;
    const aheadNow = piece.side === "red" ? isAheadForRed : !isAheadForRed;
    if (aheadNow) ahead++;
    else behind++;
  }
  return { ahead, behind };
}
function frontBackPrefix(board, piece, from) {
  const { ahead, behind } = sameFilePeers(board, piece, from);
  if (ahead + behind === 0) return "";
  if (ahead > 0 && behind > 0) return "\u4E2D";
  return behind > 0 ? "\u524D" : "\u540E";
}
function chineseNotation(board, move) {
  const piece = board[move.from.rank]?.[move.from.file];
  if (!piece) return `${move.from.file}${move.from.rank}-${move.to.file}${move.to.rank}`;
  const name = NOTATION_PIECE_NAMES[piece.side][piece.type];
  const prefix = frontBackPrefix(board, piece, move.from);
  const fromFile = fileNotation(move.from.file, piece.side);
  const toFile = fileNotation(move.to.file, piece.side);
  const dy = move.to.rank - move.from.rank;
  const forward = piece.side === "red" ? 1 : -1;
  const fromPart = prefix ? "" : fromFile;
  if (move.to.rank === move.from.rank) {
    return `${prefix}${name}${fromPart}\u5E73${toFile}`;
  }
  const advancing = dy * forward > 0;
  const action = advancing ? "\u8FDB" : "\u9000";
  if (piece.type === "rook" || piece.type === "cannon" || piece.type === "pawn") {
    const steps = Math.abs(dy);
    return `${prefix}${name}${fromPart}${action}${RED_DIGITS[steps - 1] ?? steps}`;
  }
  return `${prefix}${name}${fromPart}${action}${toFile}`;
}

// src/client/record.ts
function buildRecord(initialFen2, history) {
  let board = cloneBoard(fenToBoard(initialFen2).board);
  const entries = [];
  let result = null;
  for (let i = 0; i < history.length; i += 2) {
    const round = Math.floor(i / 2) + 1;
    const redMove = history[i];
    const redNotation = redMove ? chineseNotation(board, redMove) : "--";
    if (redMove) applyMove(board, redMove);
    let blackNotation = "";
    if (i + 1 < history.length) {
      const blackMove = history[i + 1];
      blackNotation = chineseNotation(board, blackMove);
      applyMove(board, blackMove);
    }
    entries.push({ round, red: redNotation, black: blackNotation });
    const stm = i + 1 < history.length ? "red" : "black";
    if (i + 1 >= history.length || i + 1 === history.length - 1) {
      const end = checkGameEnd(board, stm, []);
      if (end) {
        result = end;
        break;
      }
    }
  }
  const lines = entries.map((e) => `${e.round}. ${e.red}${e.black ? " " + e.black : ""}`);
  return { lines, entries, result };
}
function recordText(initialFen2, history, opts = {}) {
  const { lines, result } = buildRecord(initialFen2, history);
  const body = lines.join("\n");
  const suffix = result ? `

${result.winner === "draw" ? "\u548C\u68CB" : `${result.winner === "red" ? "\u7EA2" : "\u9ED1"}\u65B9\u80DC`}\uFF08${result.reason}\uFF09` : "";
  if (opts.title) return `${opts.title}
${"\u2500".repeat(opts.title.length)}
${body}${suffix}`;
  return `${body}${suffix}`;
}

// src/client/BoardPanel.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
var DIFFICULTIES = [
  { id: "easy", label: "\u521D\u7EA7" },
  { id: "medium", label: "\u4E2D\u7EA7" },
  { id: "hard", label: "\u9AD8\u7EA7" }
];
function BoardPanel({ useStore, actions, xiangqi }) {
  const fen = useStore((s) => s.fen);
  const difficulty = useStore((s) => s.difficulty);
  const gameOver = useStore((s) => s.gameOver);
  const lastEvent = useStore((s) => s.lastEvent);
  const aiThinking = useStore((s) => s.aiThinking);
  const comment = useStore((s) => s.comment);
  const history = useStore((s) => s.history);
  const [selected, setSelected] = (0, import_react2.useState)(null);
  const [showRecord, setShowRecord] = (0, import_react2.useState)(false);
  const record = (0, import_react2.useMemo)(() => recordText(initialFen(), history), [history]);
  const hasMoves = history.length > 0;
  const onCopyRecord = (0, import_react2.useCallback)(async () => {
    try {
      await navigator.clipboard.writeText(record);
    } catch {
    }
  }, [record]);
  const onDownloadRecord = (0, import_react2.useCallback)(() => {
    const blob = new Blob([record], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace(/[:T]/g, "-");
    a.download = `xiangqi-${stamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [record]);
  const interactive = xiangqi.isHumanTurn() && !gameOver && !aiThinking;
  const onSquareClick = (0, import_react2.useCallback)(
    (pos) => {
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
          setSelected(pos);
        }
      } else {
        setSelected(pos);
      }
    },
    [selected, xiangqi]
  );
  const onCommentClick = (0, import_react2.useCallback)(() => {
    xiangqi.requestCommentary();
  }, [xiangqi]);
  const bubbleLine = lastEvent?.line ?? (aiThinking ? "AI \u601D\u8003\u4E2D\u2026" : null);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "div",
    {
      className: "dsh-xiangqi-panel",
      style: {
        position: "fixed",
        top: 80,
        right: 24,
        zIndex: 2147483e3,
        pointerEvents: "auto",
        background: "#fbf6ea",
        border: "1px solid #e5dcc8",
        borderRadius: 16,
        boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
        padding: 14,
        width: 380,
        fontFamily: "inherit",
        color: "#3a342c"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { style: { fontSize: 14 }, children: "\u4E2D\u56FD\u8C61\u68CB" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              "aria-label": "\u5173\u95ED",
              onClick: () => actions.setPanel("closed"),
              style: { border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#8a7f6a", padding: "2px 8px" },
              children: "\xD7"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { fontSize: 12, color: "#7a6f5a", marginBottom: 6 }, children: gameOver ? `\u5BF9\u5C40\u7ED3\u675F\uFF1A${gameOver.winner === HUMAN_SIDE ? "\u4F60\u8D62\u4E86" : gameOver.winner === "draw" ? "\u548C\u68CB" : "AI \u8D62\u4E86"}\uFF08${gameOver.reason}\uFF09` : aiThinking ? "AI \u601D\u8003\u4E2D\u2026" : `\u8F6E\u5230\u4F60\u8D70\uFF08${sideToMove(fen) === HUMAN_SIDE ? "\u7EA2\u65B9" : "\u9ED1\u65B9"}\uFF09` }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          BoardRenderer,
          {
            fen,
            selected,
            onSquareClick,
            interactive,
            lastMove: xiangqi.lastMove(),
            cellSize: 38
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "select",
            {
              value: difficulty,
              onChange: (e) => actions.setDifficulty(e.target.value),
              style: { padding: "4px 8px", borderRadius: 8, border: "1px solid #d8cfba", background: "#fff", fontSize: 13 },
              "aria-label": "\u96BE\u5EA6",
              children: DIFFICULTIES.map((d) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: d.id, children: d.label }, d.id))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              onClick: () => actions.newGame(),
              style: btnStyle,
              children: "\u65B0\u5C40"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              onClick: () => actions.undo(),
              disabled: aiThinking,
              style: btnStyle,
              children: "\u6094\u68CB"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              onClick: onCommentClick,
              style: btnStyle,
              children: "\u70B9\u8BC4"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              onClick: () => actions.openFullscreen(),
              style: btnStyle,
              children: "\u5168\u5C4F"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "button",
            {
              type: "button",
              onClick: () => setShowRecord((v) => !v),
              disabled: !hasMoves,
              style: btnStyle,
              children: "\u68CB\u8C31"
            }
          )
        ] }),
        showRecord && hasMoves ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { marginTop: 10, background: "#fffdf7", border: "1px solid #e5dcc8", borderRadius: 10, padding: 10 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { style: { fontSize: 13 }, children: "\u68CB\u8C31" }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: { display: "flex", gap: 6 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", onClick: onCopyRecord, style: btnStyle, children: "\u590D\u5236" }),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", onClick: onDownloadRecord, style: btnStyle, children: "\u4E0B\u8F7D" })
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("pre", { style: { margin: 0, maxHeight: 180, overflow: "auto", fontSize: 12.5, lineHeight: 1.6, fontFamily: "inherit", whiteSpace: "pre-wrap", color: "#3a342c" }, children: record })
        ] }) : null,
        bubbleLine || comment ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { marginTop: 10, background: "#fff7e6", border: "1px solid #eadfbe", borderRadius: 10, padding: "8px 12px", fontSize: 13, lineHeight: 1.5, minHeight: 20 }, children: [
          bubbleLine ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { children: bubbleLine }) : null,
          comment ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { color: "#6b5d42", marginTop: bubbleLine ? 4 : 0 }, children: comment }) : null
        ] }) : null
      ]
    }
  );
}
var btnStyle = {
  padding: "5px 12px",
  borderRadius: 8,
  border: "1px solid #d8cfba",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  color: "#3a342c"
};

// src/client/FullscreenBoard.tsx
var import_react3 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
function FullscreenBoard({ useStore, actions, xiangqi }) {
  const fen = useStore((s) => s.fen);
  const gameOver = useStore((s) => s.gameOver);
  const aiThinking = useStore((s) => s.aiThinking);
  const lastEvent = useStore((s) => s.lastEvent);
  const comment = useStore((s) => s.comment);
  const [selected, setSelected] = (0, import_react3.useState)(null);
  const interactive = xiangqi.isHumanTurn() && !gameOver && !aiThinking;
  const onSquareClick = (0, import_react3.useCallback)(
    (pos) => {
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
    [selected, xiangqi]
  );
  (0, import_react3.useEffect)(() => {
    const onKey = (e) => {
      if (e.key === "Escape") actions.setPanel("closed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions]);
  const cell = Math.max(44, Math.min(72, Math.floor(window.innerHeight / 11)));
  const status = gameOver ? `\u5BF9\u5C40\u7ED3\u675F\uFF1A${gameOver.winner === HUMAN_SIDE ? "\u4F60\u8D62\u4E86" : gameOver.winner === "draw" ? "\u548C\u68CB" : "AI \u8D62\u4E86"}\uFF08${gameOver.reason}\uFF09` : aiThinking ? "AI \u601D\u8003\u4E2D\u2026" : `\u8F6E\u5230\u4F60\u8D70\uFF08${sideToMove(fen) === HUMAN_SIDE ? "\u7EA2\u65B9" : "\u9ED1\u65B9"}\uFF09`;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "div",
    {
      className: "dsh-xiangqi-fullscreen",
      style: {
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(20,16,10,0.45)",
        zIndex: 2147483001,
        pointerEvents: "auto"
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        "div",
        {
          style: {
            background: "#fbf6ea",
            border: "1px solid #e5dcc8",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            padding: 20,
            fontFamily: "inherit",
            color: "#3a342c"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { style: { fontSize: 16 }, children: status }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "button",
                {
                  type: "button",
                  "aria-label": "\u6536\u8D77",
                  onClick: () => actions.setPanel("panel"),
                  style: { border: "none", background: "transparent", cursor: "pointer", fontSize: 22, color: "#8a7f6a", padding: "0 6px" },
                  children: "\xD7"
                }
              )
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              BoardRenderer,
              {
                fen,
                selected,
                onSquareClick,
                interactive,
                lastMove: xiangqi.lastMove(),
                cellSize: cell
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 14, alignItems: "center" }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => actions.newGame(),
                  style: btnStyle2,
                  children: "\u65B0\u5C40"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => actions.undo(),
                  disabled: aiThinking,
                  style: btnStyle2,
                  children: "\u6094\u68CB"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => xiangqi.requestCommentary(),
                  style: btnStyle2,
                  children: "\u70B9\u8BC4"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 12, color: "#8a7f6a" }, children: "Esc \u6536\u8D77" })
            ] }),
            lastEvent || comment ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { marginTop: 14, background: "#fff7e6", border: "1px solid #eadfbe", borderRadius: 10, padding: "8px 14px", fontSize: 14, lineHeight: 1.5, minWidth: 260, maxWidth: 520 }, children: [
              lastEvent ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { children: lastEvent.line }) : null,
              comment ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { color: "#6b5d42", marginTop: lastEvent ? 4 : 0 }, children: comment }) : null
            ] }) : null
          ]
        }
      )
    }
  );
}
var btnStyle2 = {
  padding: "6px 14px",
  borderRadius: 8,
  border: "1px solid #d8cfba",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
  color: "#3a342c"
};

// src/client/index.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function XiangqiOverlay(props) {
  const panel = props.useStore((s) => s.panel);
  const fen = props.useStore((s) => s.fen);
  const history = props.useStore((s) => s.history);
  const positions = props.useStore((s) => s.positions);
  const difficulty = props.useStore((s) => s.difficulty);
  const settings = props.useStore((s) => s.settings);
  const gameOver = props.useStore((s) => s.gameOver);
  const lastEvent = props.useStore((s) => s.lastEvent);
  props.xiangqi.bindSnapshot({ fen, history, positions, difficulty, settings, gameOver, lastEvent });
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Mascot, { ...props }),
    panel === "panel" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(BoardPanel, { ...props }) : null,
    panel === "fullscreen" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(FullscreenBoard, { ...props }) : null
  ] });
}

// src/plugin.ts
var inject = ["slots"];
function adaptLlm(ctx) {
  const llm = ctx.get("llm");
  if (!llm || typeof llm.stream !== "function") return null;
  let provider = "opencode-go";
  try {
    provider = llm.listProviders?.()[0]?.id ?? "opencode-go";
  } catch {
    provider = "opencode-go";
  }
  return {
    provider,
    // The DSH llm runtime has no synchronous "default model" query — the
    // agent-default-model setting belongs to the agent layer, not ctx.llm.
    // Fall back to a known catalog model (deepseek-v4-pro is configured in
    // this deployment's opencode-go route), so commentary works out of the box
    // until the user sets an explicit llmOverride.
    defaultModel: () => "deepseek-v4-pro",
    complete: async (req) => {
      const chunks = llm.stream?.({
        provider,
        model: req.model,
        system: req.system,
        messages: [{ role: "user", content: req.user }],
        signal: req.signal
      });
      if (!chunks) throw new Error("llm.stream unavailable");
      let out = "";
      for await (const c of chunks) {
        if (c.type === "text-delta" && typeof c.text === "string") out += c.text;
        else if (c.type === "block-end" && c.block?.type === "text" && typeof c.block.text === "string") {
          out += c.block.text;
        }
      }
      return out;
    }
  };
}
var XiangqiController = class {
  constructor(llm) {
    __publicField(this, "llm", llm);
    __publicField(this, "actions", null);
    __publicField(this, "snapshot", null);
    __publicField(this, "aiToken", 0);
  }
  attachActions(actions) {
    this.actions = actions;
  }
  bind(snapshot) {
    this.snapshot = snapshot;
  }
  get store() {
    if (!this.actions) throw new Error("xiangqi actions not attached");
    return this.actions;
  }
  isHumanTurn() {
    const s = this.snapshot;
    return !!s && !s.gameOver && sideToMove(s.fen) === HUMAN_SIDE;
  }
  lastMove() {
    const h = this.snapshot?.history;
    return h && h.length > 0 ? h[h.length - 1] : null;
  }
  /** Human attempts a move. Returns true if accepted and dispatched. */
  playMove(from, to) {
    const s = this.snapshot;
    if (!s || !this.actions) return false;
    if (s.gameOver || sideToMove(s.fen) !== HUMAN_SIDE) return false;
    if (!canMove(s.fen, HUMAN_SIDE, from, to)) return false;
    const moved = moveAndFen(s.fen, HUMAN_SIDE, from, to);
    if (!moved) return false;
    const history = [...s.history, moved.move];
    const event = detectEvent(s.fen, HUMAN_SIDE, moved.move, history, moved.nextFen);
    this.store.applyHumanMove(moved.move, moved.nextFen, event);
    const end = terminalResult(moved.nextFen, [...s.positions, moved.nextFen]);
    if (end) {
      this.store.setGameOver(end);
      return true;
    }
    const token = ++this.aiToken;
    this.store.setAiThinking(true);
    void this.scheduleAiReply(moved.nextFen, history, token);
    this.maybeAutoComment(moved.nextFen, history, event);
    return true;
  }
  requestAiMove() {
    const s = this.snapshot;
    if (!s || s.gameOver || sideToMove(s.fen) === HUMAN_SIDE) return;
    const token = ++this.aiToken;
    this.store.setAiThinking(true);
    void this.scheduleAiReply(s.fen, s.history, token);
  }
  requestCommentary() {
    const s = this.snapshot;
    if (!s || !this.actions) return;
    this.store.setComment("\u70B9\u8BC4\u751F\u6210\u4E2D\u2026");
    void this.resolveCommentary(s.fen, s.history, s.lastEvent).then((text) => {
      if (this.snapshot?.fen === s.fen) this.store.setComment(text);
    });
  }
  async scheduleAiReply(fen, history, token) {
    const snap = this.snapshot;
    if (!snap) return;
    let move;
    try {
      const result = await getBestMove(fen, snap.difficulty);
      move = result.move;
    } catch {
      if (token === this.aiToken) this.store.setAiThinking(false);
      return;
    }
    if (token !== this.aiToken || !move) {
      this.store.setAiThinking(false);
      return;
    }
    this.commitAiMove(fen, history, move);
  }
  commitAiMove(fen, history, aiMove) {
    const aiSide = HUMAN_SIDE === "red" ? "black" : "red";
    const moved = moveAndFen(fen, aiSide, aiMove.from, aiMove.to);
    if (!moved) {
      this.store.setAiThinking(false);
      return;
    }
    const nextHistory = [...history, moved.move];
    const event = detectEvent(fen, aiSide, moved.move, nextHistory, moved.nextFen);
    this.store.applyAiMove(moved.move, moved.nextFen, event);
    const end = terminalResult(moved.nextFen, [...this.snapshot?.positions ?? [], moved.nextFen]);
    if (end) {
      this.store.setGameOver(end);
      return;
    }
    this.maybeAutoComment(moved.nextFen, nextHistory, event);
  }
  maybeAutoComment(fen, history, event) {
    const s = this.snapshot;
    if (!s?.settings.autoComment || !this.actions) return;
    this.store.setComment(null);
    void this.resolveCommentary(fen, history, event).then((text) => {
      if (text && this.snapshot?.fen === fen) this.store.setComment(text);
    });
  }
  async resolveCommentary(fen, history, event) {
    const s = this.snapshot;
    if (!s) return null;
    const result = await generateCommentary(
      this.llm,
      {
        fen,
        recentMoves: recentMoveNotation(history),
        event,
        style: s.settings.commentStyle,
        difficulty: s.difficulty
      },
      s.settings.llmOverride
    );
    return result?.text ?? null;
  }
};
function apply(ctx) {
  const controller = new XiangqiController(adaptLlm(ctx));
  ctx.slots.inject(
    "shell.overlay",
    () => ctx.slots.register(
      {
        name: "shell.overlay",
        id: "xiangqi-mascot",
        order: 90,
        store: createStore,
        inject: (actions) => {
          controller.attachActions(actions);
          return {
            xiangqi: {
              humanSide: HUMAN_SIDE,
              isHumanTurn: () => controller.isHumanTurn(),
              playMove: (from, to) => controller.playMove(from, to),
              requestAiMove: () => controller.requestAiMove(),
              requestCommentary: () => controller.requestCommentary(),
              lastMove: () => controller.lastMove(),
              bindSnapshot: (snapshot) => controller.bind(snapshot)
            }
          };
        }
      },
      XiangqiOverlay
    )
  );
}
return module.exports; } });
