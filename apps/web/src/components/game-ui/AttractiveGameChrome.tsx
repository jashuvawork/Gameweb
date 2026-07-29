'use client';

import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  accent?: string;
  accent2?: string;
  score: number;
  ended?: boolean;
  isPremium?: boolean;
  cover?: string;
  compact?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

/** Attractive chrome around every game — gradient frame, live score, atmosphere */
export function AttractiveGameChrome({
  title,
  subtitle,
  accent = '#00f0ff',
  accent2 = '#ff2bd6',
  score,
  ended,
  isPremium,
  cover,
  compact,
  children,
  footer,
}: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] ring-1"
      style={{
        borderColor: `${accent}40`,
        boxShadow: `0 0 0 1px ${accent}22, 0 24px 80px #000a, 0 0 60px ${accent}18`,
        background: `radial-gradient(120% 80% at 10% -10%, ${accent}22, transparent 50%), radial-gradient(90% 70% at 100% 0%, ${accent2}18, transparent 45%), #07070f`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, ${accent2}, transparent)`,
        }}
      />
      <div
        className="game-chrome-pulse pointer-events-none absolute -left-20 top-1/3 h-40 w-40 rounded-full blur-3xl"
        style={{ background: accent, opacity: 0.12 }}
      />
      <div
        className="game-chrome-pulse-delay pointer-events-none absolute -right-16 bottom-1/4 h-36 w-36 rounded-full blur-3xl"
        style={{ background: accent2, opacity: 0.1 }}
      />

      <div
        className={`relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-5 ${
          compact ? 'py-2.5' : 'py-3'
        }`}
      >
        {!compact ? (
          <div className="flex min-w-0 items-center gap-3">
            {cover && (
              <img
                src={cover}
                alt=""
                className="hidden h-12 w-12 rounded-xl object-cover ring-1 ring-white/15 sm:block"
              />
            )}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.32em]" style={{ color: accent }}>
                {isPremium ? 'Premium Arena' : 'Live Arena'}
              </p>
              <h1 className="truncate font-display text-xl text-white sm:text-2xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-white/45">{subtitle}</p>}
            </div>
          </div>
        ) : (
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">Touch-ready playfield</p>
        )}

        <div
          className="flex items-center gap-3 rounded-2xl border px-4 py-2"
          style={{ borderColor: `${accent}44`, background: `${accent}14` }}
        >
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.25em] text-white/40">Score</p>
            <p className="font-display text-xl tabular-nums text-white" style={{ color: accent }}>
              {score}
            </p>
          </div>
          {ended && (
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: accent2, color: '#0a0a12' }}
            >
              Ended
            </span>
          )}
        </div>
      </div>

      <div className="relative p-2 sm:p-3">{children}</div>

      {footer && <div className="relative border-t border-white/10 px-3 py-2 sm:px-4">{footer}</div>}
    </div>
  );
}
