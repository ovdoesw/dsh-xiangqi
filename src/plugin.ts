/**
 * dsh-xiangqi plugin entry: registers the mascot overlay into `shell.overlay`
 * and wires the async AI move loop + LLM commentary.
 *
 * Store actions are synchronous immer mutators, so the asynchronous
 * orchestration (engine reply, commentary scheduling) lives here in the plugin
 * body inside a small `XiangqiController`. The overlay root refreshes the
 * controller's state snapshot on every render (via `bindSnapshot`), and the
 * components call `playMove` / `requestAiMove` / `requestCommentary` on the
 * controller's `XiangqiInject` face.
 */

import type { ClientContext } from './client-context.js';

import type { Move, Pos } from './core/board.js';
import { getBestMove } from './ai/engine.js';
import {
  createStore,
  type XiangqiActions,
  type XiangqiState,
  canMove,
  detectEvent,
  moveAndFen,
  sideToMove,
  terminalResult,
  recentMoveNotation,
  HUMAN_SIDE,
  type LastEvent,
} from './client/store.js';
import { generateCommentary, type CommentaryLlm } from './client/comment.js';
import { XiangqiOverlay } from './client/index.js';
import type { XiangqiInject } from './client/inject.js';

/**
 * Required cordis services for this plugin.
 *
 * `llm` is deliberately NOT in this list: the `llm` service (LlmRuntime) is
 * provided by the DSH host process, never by the web-boot context where this
 * client plugin runs. Declaring it here would make the web boot sweep report
 * `pending (waiting for service: llm)` and fail activation — cordis inject
 * waiting has no timeout. `adaptLlm` reads it via `ctx.get('llm')` instead,
 * which returns undefined (commentary degrades to null) when absent.
 */
export const inject = ['slots'];

/**
 * Adapt the DSH LlmRuntime to the narrow CommentaryLlm surface comment.ts expects.
 *
 * Reads the service through `ctx.get('llm')` rather than the `ctx.llm` property:
 * `llm` is not an inject key here (it is never provided in the web-boot context),
 * and direct property access on an undeclared, unprovided service throws
 * `cannot get property "llm" without inject` in cordis. `ctx.get` returns
 * `undefined` instead, so commentary silently degrades to null.
 */
function adaptLlm(ctx: ClientContext): CommentaryLlm | null {
  const llm = ctx.get('llm') as
    | {
        stream?: (opts: unknown) => AsyncIterable<unknown>;
        listProviders?: () => { id: string }[];
        listModels?: (provider: string) => Promise<{ id: string }[]>;
      }
    | undefined;
  if (!llm || typeof llm.stream !== 'function') return null;

  let provider = 'opencode-go';
  try {
    provider = llm.listProviders?.()[0]?.id ?? 'opencode-go';
  } catch {
    provider = 'opencode-go';
  }

  return {
    provider,
    // The DSH llm runtime has no synchronous "default model" query — the
    // agent-default-model setting belongs to the agent layer, not ctx.llm.
    // Fall back to a known catalog model (deepseek-v4-pro is configured in
    // this deployment's opencode-go route), so commentary works out of the box
    // until the user sets an explicit llmOverride.
    defaultModel: () => 'deepseek-v4-pro',
    complete: async (req) => {
      const chunks = llm.stream?.({
        provider,
        model: req.model,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
        signal: req.signal,
      }) as AsyncIterable<{ type?: string; text?: string; block?: { type?: string; text?: string } }> | undefined;
      if (!chunks) throw new Error('llm.stream unavailable');
      let out = '';
      for await (const c of chunks) {
        if (c.type === 'text-delta' && typeof c.text === 'string') out += c.text;
        else if (c.type === 'block-end' && c.block?.type === 'text' && typeof c.block.text === 'string') {
          out += c.block.text;
        }
      }
      return out;
    },
  };
}

type Snapshot = {
  fen: string;
  history: Move[];
  positions: string[];
  difficulty: XiangqiState['difficulty'];
  settings: XiangqiState['settings'];
  gameOver: XiangqiState['gameOver'];
  lastEvent: XiangqiState['lastEvent'];
};

/** Orchestrates the async human<->AI loop and commentary against the store. */
class XiangqiController {
  private actions: XiangqiActions | null = null;
  private snapshot: Snapshot | null = null;
  private aiToken = 0;

  constructor(private readonly llm: CommentaryLlm | null) {}

  attachActions(actions: XiangqiActions): void {
    this.actions = actions;
  }

  bind(snapshot: Snapshot): void {
    this.snapshot = snapshot;
  }

  private get store(): XiangqiActions {
    if (!this.actions) throw new Error('xiangqi actions not attached');
    return this.actions;
  }

  isHumanTurn(): boolean {
    const s = this.snapshot;
    return !!s && !s.gameOver && sideToMove(s.fen) === HUMAN_SIDE;
  }

  lastMove(): Move | null {
    const h = this.snapshot?.history;
    return h && h.length > 0 ? h[h.length - 1] : null;
  }

  /** Human attempts a move. Returns true if accepted and dispatched. */
  playMove(from: Pos, to: Pos): boolean {
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

  requestAiMove(): void {
    const s = this.snapshot;
    if (!s || s.gameOver || sideToMove(s.fen) === HUMAN_SIDE) return;
    const token = ++this.aiToken;
    this.store.setAiThinking(true);
    void this.scheduleAiReply(s.fen, s.history, token);
  }

  requestCommentary(): void {
    const s = this.snapshot;
    if (!s || !this.actions) return;
    this.store.setComment('点评生成中…');
    void this.resolveCommentary(s.fen, s.history, s.lastEvent).then((text) => {
      if (this.snapshot?.fen === s.fen) this.store.setComment(text);
    });
  }

  private async scheduleAiReply(fen: string, history: Move[], token: number): Promise<void> {
    const snap = this.snapshot;
    if (!snap) return;
    let move: Move | null;
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

  private commitAiMove(fen: string, history: Move[], aiMove: Move): void {
    const aiSide = HUMAN_SIDE === 'red' ? 'black' : 'red';
    const moved = moveAndFen(fen, aiSide, aiMove.from, aiMove.to);
    if (!moved) {
      this.store.setAiThinking(false);
      return;
    }
    const nextHistory = [...history, moved.move];
    const event = detectEvent(fen, aiSide, moved.move, nextHistory, moved.nextFen);
    this.store.applyAiMove(moved.move, moved.nextFen, event);

    const end = terminalResult(moved.nextFen, [...(this.snapshot?.positions ?? []), moved.nextFen]);
    if (end) {
      this.store.setGameOver(end);
      return;
    }
    this.maybeAutoComment(moved.nextFen, nextHistory, event);
  }

  private maybeAutoComment(fen: string, history: Move[], event: LastEvent | null): void {
    const s = this.snapshot;
    if (!s?.settings.autoComment || !this.actions) return;
    this.store.setComment(null);
    void this.resolveCommentary(fen, history, event).then((text) => {
      if (text && this.snapshot?.fen === fen) this.store.setComment(text);
    });
  }

  private async resolveCommentary(
    fen: string,
    history: Move[],
    event: LastEvent | null,
  ): Promise<string | null> {
    const s = this.snapshot;
    if (!s) return null;
    const result = await generateCommentary(
      this.llm,
      {
        fen,
        recentMoves: recentMoveNotation(history),
        event,
        style: s.settings.commentStyle,
        difficulty: s.difficulty,
      },
      s.settings.llmOverride,
    );
    return result?.text ?? null;
  }
}

export function apply(ctx: ClientContext): void {
  const controller = new XiangqiController(adaptLlm(ctx));

  // `shell.overlay` is declared by ui-layout's AppFrame (a sibling plugin), so
  // registering into it directly would throw "undeclared slot" whenever this
  // plugin activates before the layout. `slots.inject` defers the registration
  // until the slot is declared (and re-registers across declaration epochs).
  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'xiangqi-mascot',
        order: 90,
        store: createStore,
        inject: (actions: XiangqiActions): { xiangqi: XiangqiInject } => {
          controller.attachActions(actions);
          return {
            xiangqi: {
              humanSide: HUMAN_SIDE,
              isHumanTurn: () => controller.isHumanTurn(),
              playMove: (from, to) => controller.playMove(from, to),
              requestAiMove: () => controller.requestAiMove(),
              requestCommentary: () => controller.requestCommentary(),
              lastMove: () => controller.lastMove(),
              bindSnapshot: (snapshot) => controller.bind(snapshot),
            },
          };
        },
      },
      XiangqiOverlay,
    ),
  );
}
