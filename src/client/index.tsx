/**
 * dsh-xiangqi client root: composes Mascot + BoardPanel + FullscreenBoard into
 * a single overlay entry, and pushes each state snapshot into the async
 * controller (`bindSnapshot`) so the AI loop always validates against fresh
 * data.
 *
 * Because shell.overlay is `kind: 'list'`, a single entry means a single
 * register() call with one id. The root component switches among the three
 * panels based on the `panel` state so the overlay stays additive and never
 * collides with other plugins.
 */

import { Mascot } from './Mascot.js';
import { BoardPanel } from './BoardPanel.js';
import { FullscreenBoard } from './FullscreenBoard.js';
import type { XiangqiSlotProps } from './inject.js';
import type { XiangqiState } from './store.js';

/** Composed root rendered inside the single shell.overlay entry. */
export function XiangqiOverlay(props: XiangqiSlotProps) {
  const panel = props.useStore((s: XiangqiState) => s.panel);
  const fen = props.useStore((s: XiangqiState) => s.fen);
  const history = props.useStore((s: XiangqiState) => s.history);
  const positions = props.useStore((s: XiangqiState) => s.positions);
  const difficulty = props.useStore((s: XiangqiState) => s.difficulty);
  const settings = props.useStore((s: XiangqiState) => s.settings);
  const gameOver = props.useStore((s: XiangqiState) => s.gameOver);
  const lastEvent = props.useStore((s: XiangqiState) => s.lastEvent);

  // Synchronous bind: the controller's snapshot must match THIS render. Doing it
  // in useEffect is one commit too late — after the AI replies, the re-render
  // would still read the stale (AI-to-move) snapshot, isHumanTurn() returns
  // false, and updating the snapshot afterwards triggers no further render,
  // leaving the board unclickable.
  props.xiangqi.bindSnapshot({ fen, history, positions, difficulty, settings, gameOver, lastEvent });

  return (
    <>
      <Mascot {...props} />
      {panel === 'panel' ? <BoardPanel {...props} /> : null}
      {panel === 'fullscreen' ? <FullscreenBoard {...props} /> : null}
    </>
  );
}
