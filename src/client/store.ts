/**
 * dsh-xiangqi client store.
 *
 * Declares the single source of truth for the game state, mascot position,
 * panel mode, and settings, built with `defineStore` from the DSH client
 * runtime. Every action is a synchronous immer-draft mutator; components read
 * through `useStore(selector)` and write exclusively through the baked
 * `actions` callbacks.
 *
 * Async orchestration (the AI reply and LLM commentary) lives OUTSIDE this
 * module — in src/client/game.ts (pure) and src/plugin.ts (the controller) —
 * because store actions must stay synchronous.
 */

import { defineStore } from '@deepseek-ai/dsh-client-runtime/client';

import type { Move, Side } from '../core/board.js';
import type { Difficulty } from '../ai/engine.js';

export { HUMAN_SIDE } from './game.js';
export {
  initialFen,
  parseFen,
  sideToMove,
  legalDestinations,
  canMove,
  moveAndFen,
  detectEvent,
  terminalResult,
  keyOf,
  recentMoveNotation,
} from './game.js';
export type { LastEvent, LastEventType } from './game.js';

export type PanelMode = 'closed' | 'panel' | 'fullscreen';
export type CommentStyle = 'pro' | 'fun';

export type LlmOverride = {
  base: string;
  key: string;
  model: string;
};

export type { GameResult as GameOver } from '../core/rules.js';

/** Opening FEN (repeated here to keep defaultState/newGame allocation-free paths simple). */
const INITIAL_FEN = 'rheakaehr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RHEAKAEHR r';

export type Settings = {
  autoComment: boolean;
  commentStyle: CommentStyle;
  llmOverride: LlmOverride | null;
};

export type XiangqiState = {
  fen: string;
  history: Move[];
  /** FEN keys in chronological order, used by the repetition rule. */
  positions: string[];
  difficulty: Difficulty;
  gameOver: import('../core/rules.js').GameResult | null;
  panel: PanelMode;
  mascot: { x: number; y: number };
  settings: Settings;
  lastEvent: import('./game.js').LastEvent | null;
  /** True while the AI is thinking; the UI shows a spinner and blocks input. */
  aiThinking: boolean;
  /** Latest resolved commentary text (or the pending placeholder), if any. */
  comment: string | null;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function defaultState(): XiangqiState {
  return {
    fen: INITIAL_FEN,
    history: [],
    positions: [INITIAL_FEN],
    difficulty: 'medium',
    gameOver: null,
    panel: 'closed',
    mascot: { x: 24, y: 24 },
    settings: {
      autoComment: true,
      commentStyle: 'fun',
      llmOverride: null,
    },
    lastEvent: null,
    aiThinking: false,
    comment: null,
  };
}

export function createStore() {
  return defineStore<XiangqiState>({
    init: defaultState,
    persist: 'xiangqi',

    actions: {
      setDifficulty(draft, difficulty: Difficulty) {
        draft.difficulty = difficulty;
      },

      setPanel(draft, panel: PanelMode) {
        draft.panel = panel;
      },

      togglePanel(draft) {
        draft.panel = draft.panel === 'panel' ? 'closed' : 'panel';
      },

      openFullscreen(draft) {
        draft.panel = 'fullscreen';
      },

      moveMascot(draft, x: number, y: number) {
        draft.mascot = { x: clamp(x, 0, 4000), y: clamp(y, 0, 4000) };
      },

      setAutoComment(draft, autoComment: boolean) {
        draft.settings.autoComment = autoComment;
      },

      setCommentStyle(draft, commentStyle: CommentStyle) {
        draft.settings.commentStyle = commentStyle;
      },

      setLlmOverride(draft, llmOverride: LlmOverride | null) {
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
        draft.fen =
          draft.positions[draft.positions.length - 1] ?? INITIAL_FEN;
        draft.lastEvent = null;
        draft.aiThinking = false;
        draft.comment = null;
      },

      /** Commit a human move; the caller has already validated legality. */
      applyHumanMove(draft, move: Move, nextFen: string, event: import('./game.js').LastEvent | null) {
        draft.history = [...draft.history, move];
        draft.positions = [...draft.positions, nextFen];
        draft.fen = nextFen;
        if (event) draft.lastEvent = event;
      },

      /** Commit an AI reply (already validated by the engine). */
      applyAiMove(draft, move: Move, nextFen: string, event: import('./game.js').LastEvent | null) {
        draft.history = [...draft.history, move];
        draft.positions = [...draft.positions, nextFen];
        draft.fen = nextFen;
        draft.aiThinking = false;
        if (event) draft.lastEvent = event;
      },

      setGameOver(draft, gameOver: import('../core/rules.js').GameResult | null) {
        draft.gameOver = gameOver;
        draft.aiThinking = false;
      },

      setLastEvent(draft, event: import('./game.js').LastEvent | null) {
        draft.lastEvent = event;
      },

      setAiThinking(draft, thinking: boolean) {
        draft.aiThinking = thinking;
      },

      setComment(draft, comment: string | null) {
        draft.comment = comment;
      },
    },
  });
}

export type XiangqiStore = ReturnType<typeof createStore>;
export type XiangqiInstance = ReturnType<XiangqiStore['create']>;
/** Draft-stripped write set the framework bakes and hands to components. */
export type XiangqiActions = XiangqiInstance['actions'];

export type { Move, Side };
