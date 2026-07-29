'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { EngineHandle } from '@games/engine/core';

export type TouchScheme = 'full' | 'jump' | 'steer' | 'paddle' | 'fire';

const JUMP_SLUGS = new Set(['pixel-runner', 'sky-glider', 'vault-hopper']);
const STEER_SLUGS = new Set([
  'neon-drift',
  'desert-rally',
  'mountain-racer',
  'street-sprint',
  'neon-circuit',
  'dust-rally',
]);
const PADDLE_SLUGS = new Set(['brick-blast', 'paddle-pulse', 'mirror-pong']);
const FIRE_SLUGS = new Set([
  'galaxy-defender',
  'alien-attack',
  'zombie-escape',
  'robot-arena',
  'shadow-ninja',
]);

export function touchSchemeFor(slug: string): TouchScheme {
  if (JUMP_SLUGS.has(slug)) return 'jump';
  if (STEER_SLUGS.has(slug)) return 'steer';
  if (PADDLE_SLUGS.has(slug)) return 'paddle';
  if (FIRE_SLUGS.has(slug)) return 'fire';
  return 'full';
}

type Props = {
  engine: EngineHandle | null;
  scheme: TouchScheme;
  accent?: string;
  accent2?: string;
  ended?: boolean;
  onRestart?: () => void;
};

/** On-screen D-pad + action buttons for phones & tablets */
export function TouchControls({
  engine,
  scheme,
  accent = '#00f0ff',
  accent2 = '#ff2bd6',
  ended,
  onRestart,
}: Props) {
  const active = useRef(new Set<string>());

  const pressKeys = useCallback(
    (keys: string[]) => {
      if (!engine) return;
      for (const k of keys) {
        active.current.add(k);
        engine.press(k);
      }
    },
    [engine],
  );

  const releaseKeys = useCallback(
    (keys: string[]) => {
      if (!engine) return;
      for (const k of keys) {
        active.current.delete(k);
        engine.release(k);
      }
    },
    [engine],
  );

  const releaseAll = useCallback(() => {
    if (!engine) return;
    engine.releaseAll();
    active.current.clear();
  }, [engine]);

  useEffect(() => {
    const blur = () => releaseAll();
    window.addEventListener('blur', blur);
    window.addEventListener('visibilitychange', blur);
    return () => {
      window.removeEventListener('blur', blur);
      window.removeEventListener('visibilitychange', blur);
      releaseAll();
    };
  }, [releaseAll]);

  const bind = (keys: string[]) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      pressKeys(keys);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      releaseKeys(keys);
    },
    onPointerCancel: (e: React.PointerEvent) => {
      e.preventDefault();
      releaseKeys(keys);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const btn =
    'select-none touch-none flex items-center justify-center rounded-2xl border text-white/90 font-display font-bold active:scale-95 transition-transform user-select-none';
  const pad = 'h-14 w-14 sm:h-16 sm:w-16 text-lg sm:text-xl';
  const action = 'h-[4.5rem] w-[4.5rem] sm:h-20 sm:w-20 text-sm sm:text-base rounded-full';

  return (
    <div
      className="relative mt-3 overflow-hidden rounded-3xl border border-white/10 px-3 py-4 sm:px-5"
      style={{
        background: `linear-gradient(145deg, ${accent}18, #05050acc 40%, ${accent2}14)`,
        boxShadow: `inset 0 1px 0 ${accent}33, 0 12px 40px #0008`,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">Touch controls</p>
        <p className="text-[10px] text-white/35">Drag on game · or use pads</p>
      </div>

      <div className="flex items-end justify-between gap-3">
        {/* Left: movement */}
        <div className="flex flex-col items-center gap-1.5">
          {(scheme === 'full' || scheme === 'fire' || scheme === 'jump') && (
            <button
              type="button"
              aria-label="Up"
              className={`${btn} ${pad}`}
              style={{ background: `${accent}22`, borderColor: `${accent}55` }}
              {...bind(['arrowup', 'w'])}
            >
              ▲
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Left"
              className={`${btn} ${pad}`}
              style={{ background: `${accent}22`, borderColor: `${accent}55` }}
              {...bind(['arrowleft', 'a'])}
            >
              ◀
            </button>

            {(scheme === 'full' || scheme === 'fire') && (
              <button
                type="button"
                aria-label="Down"
                className={`${btn} ${pad}`}
                style={{ background: `${accent}18`, borderColor: `${accent}40` }}
                {...bind(['arrowdown', 's'])}
              >
                ▼
              </button>
            )}

            {(scheme === 'steer' || scheme === 'paddle' || scheme === 'jump') && (
              <div className={`${pad} opacity-0`} aria-hidden />
            )}

            <button
              type="button"
              aria-label="Right"
              className={`${btn} ${pad}`}
              style={{ background: `${accent}22`, borderColor: `${accent}55` }}
              {...bind(['arrowright', 'd'])}
            >
              ▶
            </button>
          </div>

          {(scheme === 'full' || scheme === 'fire') && (
            <div className="h-0 w-0 overflow-hidden" aria-hidden />
          )}
        </div>

        {/* Right: actions */}
        <div className="flex flex-col items-end gap-2">
          {ended ? (
            <button
              type="button"
              aria-label="Restart"
              className={`${btn} ${action}`}
              style={{ background: accent2, borderColor: accent2, color: '#0a0a12' }}
              onPointerDown={(e) => {
                e.preventDefault();
                onRestart?.();
                pressKeys(['r']);
                window.setTimeout(() => releaseKeys(['r']), 120);
              }}
            >
              RESTART
            </button>
          ) : (
            <>
              {(scheme === 'jump' || scheme === 'full' || scheme === 'fire' || scheme === 'steer') && (
                <button
                  type="button"
                  aria-label={scheme === 'steer' ? 'Nitro' : scheme === 'fire' ? 'Fire' : 'Action'}
                  className={`${btn} ${action}`}
                  style={{
                    background: `radial-gradient(circle at 35% 30%, ${accent2}, ${accent}cc)`,
                    borderColor: `${accent2}99`,
                    boxShadow: `0 0 24px ${accent2}55`,
                  }}
                  {...bind(scheme === 'steer' ? [' '] : [' ', 'arrowup'])}
                >
                  {scheme === 'steer' ? 'NITRO' : scheme === 'fire' ? 'FIRE' : 'JUMP'}
                </button>
              )}
              {scheme === 'paddle' && (
                <p className="max-w-[7rem] text-right text-[10px] leading-snug text-white/40">
                  Hold ◀ ▶ to move the paddle
                </p>
              )}
              {scheme === 'full' && (
                <button
                  type="button"
                  aria-label="Interact"
                  className={`${btn} h-12 w-12 rounded-full text-xs`}
                  style={{ background: `${accent}33`, borderColor: `${accent}66` }}
                  {...bind(['e', 'q', 'shift'])}
                >
                  USE
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
