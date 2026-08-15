/**
 * The registrant's business face injected into every xiangqi slot component.
 *
 * Declared once so Mascot / BoardPanel / FullscreenBoard share one contract.
 * The plugin's `apply(ctx)` constructs this object; pure game logic (the AI
 * move loop and commentary scheduling) lives behind these callbacks so store
 * actions can stay synchronous draft mutators.
 */

import type { Move, Pos, Side } from '../core/board.js';
import type { XiangqiState, XiangqiActions } from './store.js';

export interface XiangqiInject {
  /** Human tries to move from -> to. Returns true if accepted (legal). */
  playMove(from: Pos, to: Pos): boolean;
  /** Whether it is currently the human's turn (and the game is live). */
  isHumanTurn(): boolean;
  /** Human side constant ('red'). */
  humanSide: Side;
  /** Ask the engine to reply now (e.g. resumed after a stale AI turn). */
  requestAiMove(): void;
  /** Manually request a commentary for the current position. */
  requestCommentary(): void;
  /** The most recent move (for last-move highlighting) or null. */
  lastMove(): Move | null;
  /**
   * Push the latest state snapshot from the store into the async controller.
   * Called by the overlay root on every state change so playMove/requestAiMove
   * validate and dispatch against fresh data.
   */
  bindSnapshot(snapshot: {
    fen: string;
    history: Move[];
    positions: string[];
    difficulty: XiangqiState['difficulty'];
    settings: XiangqiState['settings'];
    gameOver: XiangqiState['gameOver'];
    lastEvent: XiangqiState['lastEvent'];
  }): void;
}

/** Framework props shared by all xiangqi slot components. */
export interface XiangqiSlotProps {
  useStore: <S>(selector: (s: XiangqiState) => S, eq?: (a: S, b: S) => boolean) => S;
  actions: XiangqiActions;
  xiangqi: XiangqiInject;
}
