/**
 * Mascot: a cartoon pet cradling an "象" piece, floating in the shell.overlay.
 *
 * Interactions:
 *  - hover: the held piece rises and an invitation bubble appears (random line)
 *  - click: opens the board panel
 *  - drag (pointer events): repositions the mascot; position persists in store
 *
 * The overlay layer is click-through (pointer-events:none); this entry opts
 * back in with `pointer-events:auto` on its root.
 */

import { useRef, useState, useCallback, useEffect } from 'react';

import { type Piece } from '../core/board.js';
import { PieceView } from './pieces.js';
import type { XiangqiSlotProps } from './inject.js';

const INVITES = [
  '来下一盘？',
  '等你呢，红方先走！',
  'AI 还在思考，来杀一局？',
  '闲着也是闲着，下棋！',
  '敢不敢？胜我者得天下。',
];

function randomInvite(): string {
  return INVITES[Math.floor(Math.random() * INVITES.length)];
}

const HELD_PIECE: Piece = { side: 'red', type: 'elephant' };

export function Mascot({ useStore, actions }: XiangqiSlotProps) {
  const mascot = useStore((s) => s.mascot);
  const panel = useStore((s) => s.panel);
  const [hovered, setHovered] = useState(false);
  const [invite, setInvite] = useState(randomInvite());
  const movedRef = useRef(false);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (hovered) setInvite(randomInvite());
  }, [hovered]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      movedRef.current = false;
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const dx = Math.abs(e.movementX);
      const dy = Math.abs(e.movementY);
      if (dx > 1 || dy > 1) movedRef.current = true;
      actions.moveMascot(e.clientX, e.clientY);
    },
    [actions],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {
      /* pointer capture may already be released */
    }
  }, []);

  const onClick = useCallback(() => {
    if (movedRef.current) return;
    if (panel === 'closed') actions.setPanel('panel');
    else actions.togglePanel();
  }, [actions, panel]);

  return (
    <div
      className="dsh-xiangqi-mascot"
      style={{
        position: 'fixed',
        left: mascot.x,
        top: mascot.y,
        pointerEvents: 'auto',
        cursor: 'grab',
        userSelect: 'none',
        zIndex: 2147483000,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none',
      }}
      role="button"
      aria-label="中国象棋小宠物"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (panel === 'closed') actions.setPanel('panel');
          else actions.togglePanel();
        }
      }}
    >
      {/* invitation bubble */}
      <div
        className="dsh-xiangqi-bubble"
        style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: `translateX(-50%) translateY(${hovered ? '-4px' : '8px'})`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 160ms ease, transform 160ms ease',
          background: '#fff',
          border: '1px solid #e5e0d5',
          borderRadius: 12,
          padding: '6px 12px',
          fontSize: 13,
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
          fontFamily: 'inherit',
          color: '#3a342c',
        }}
      >
        {invite}
        <span
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #fff',
          }}
        />
      </div>

      {/* pet body */}
      <svg width={64} height={72} viewBox="0 0 64 72" style={{ display: 'block' }}>
        {/* arms reaching up to hold the piece */}
        <path d="M20 40 Q14 30 22 18" stroke="#c98f3b" strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M44 40 Q50 30 42 18" stroke="#c98f3b" strokeWidth={5} fill="none" strokeLinecap="round" />
        {/* body */}
        <ellipse cx={32} cy={52} rx={24} ry={19} fill="#f6c66b" stroke="#c98f3b" strokeWidth={2} />
        <ellipse cx={32} cy={56} rx={15} ry={11} fill="#fbe1b2" />
        {/* ears */}
        <circle cx={14} cy={30} r={7} fill="#f6c66b" stroke="#c98f3b" strokeWidth={2} />
        <circle cx={50} cy={30} r={7} fill="#f6c66b" stroke="#c98f3b" strokeWidth={2} />
        <circle cx={14} cy={30} r={3.5} fill="#8a5a2b" />
        <circle cx={50} cy={30} r={3.5} fill="#8a5a2b" />
        {/* face */}
        <circle cx={24} cy={44} r={2.5} fill="#4a2f1a" />
        <circle cx={40} cy={44} r={2.5} fill="#4a2f1a" />
        <path d="M27 52 Q32 56 37 52" stroke="#4a2f1a" strokeWidth={2} fill="none" strokeLinecap="round" />
        <circle cx={20} cy={50} r={3} fill="#f4a0a0" opacity={0.7} />
        <circle cx={44} cy={50} r={3} fill="#f4a0a0" opacity={0.7} />
      </svg>

      {/* held piece, raised on hover */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translate(-50%, ${hovered ? '-6px' : '0px'})`,
          transition: 'transform 160ms ease',
        }}
      >
        <PieceView piece={HELD_PIECE} size={32} />
      </span>
    </div>
  );
}
