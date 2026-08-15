/**
 * dsh-xiangqi commentary orchestration.
 *
 * Builds a short commentary request from (FEN + recent moves + event) and
 * dispatches it either through DSH's `ctx.llm` service (default) or through a
 * raw OpenAI-compatible endpoint when the user configured a `llmOverride`
 * { base, key, model }. Failures always degrade silently to null — a broken
 * LLM must never interrupt the game.
 *
 * This module is dependency-light on purpose: it imports only the core types
 * and the LLM runtime type, so it can also be unit-tested with a mock stream.
 */

import type { Difficulty } from '../ai/engine.js';
import type { LastEvent } from './store.js';
import type { CommentStyle, LlmOverride } from './store.js';

/** Minimal streaming surface we need from ctx.llm (kept narrow for test mocks). */
export interface CommentaryLlm {
  /** Provider route id when using the DSH adapter (e.g. 'opencode-go'). */
  provider: string;
  /** Default model id when no per-call override is set. */
  defaultModel(): string | null;
  /** Stream a completion; resolves with the concatenated visible text. */
  complete(req: {
    model: string;
    system: string;
    user: string;
    signal?: AbortSignal;
  }): Promise<string>;
}

export type CommentaryInput = {
  fen: string;
  /** Most recent moves in notation order (oldest first). */
  recentMoves: string[];
  event: LastEvent | null;
  style: CommentStyle;
  difficulty: Difficulty;
};

export type CommentaryResult = {
  text: string;
};

const PRO_SYSTEM =
  '你是一位中国象棋职业棋评。请用 1–3 句话点评当前局面：优劣、关键子力、下一步思路。只输出点评本身，不要客套话。';

const FUN_SYSTEM =
  '你是一位风趣的象棋娱乐解说，语气像网络主播，爱用三国杀式的热血台词。请用 1–3 句话点评当前局面，幽默、有梗、不说废话。只输出点评本身。';

function buildUserPrompt(input: CommentaryInput): string {
  const moveLine =
    input.recentMoves.length > 0 ? `最近走法：${input.recentMoves.join(' ')}` : '（开局，尚无走法）';
  const eventLine = input.event ? `事件：${input.event.type} - ${input.event.line}` : '事件：无';
  const styleLine = input.style === 'pro' ? '风格：专业棋评' : '风格：娱乐解说';
  const diffLine = `难度：${input.difficulty}`;
  return [
    `当前局面 FEN：${input.fen}`,
    moveLine,
    eventLine,
    styleLine,
    diffLine,
    '请点评。',
  ].join('\n');
}

function tryCoerce(text: string): string {
  return text.trim();
}

/**
 * Produce a commentary. Returns null on any failure (no adapter, no model,
 * network error, or a rejected promise) — callers render nothing in that case.
 */
export async function generateCommentary(
  llm: CommentaryLlm | null,
  input: CommentaryInput,
  override: LlmOverride | null,
  signal?: AbortSignal,
): Promise<CommentaryResult | null> {
  const user = buildUserPrompt(input);
  const system = input.style === 'pro' ? PRO_SYSTEM : FUN_SYSTEM;

  try {
    if (override?.base && override.model) {
      // Raw OpenAI-compatible endpoint path.
      const text = await completeViaFetch(override, system, user, signal);
      const coerced = tryCoerce(text);
      return coerced ? { text: coerced } : null;
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

async function completeViaFetch(
  override: LlmOverride,
  system: string,
  user: string,
  signal?: AbortSignal,
): Promise<string> {
  const base = override.base.replace(/\/+$/, '');
  const url = `${base}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(override.key ? { Authorization: `Bearer ${override.key}` } : {}),
    },
    body: JSON.stringify({
      model: override.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      max_tokens: 160,
    }),
    signal,
  });
  if (!res.ok) throw new Error(`LLM override failed: ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? '';
}
