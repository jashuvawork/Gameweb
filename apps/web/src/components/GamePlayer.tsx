'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { createEngine } from '../../../../games/engine/core';
import { GAME_REGISTRY } from '../../../../games/registry';
import { FREE_GAME_CATALOG } from '@/lib/catalog';
import { api } from '@/lib/api';
import type { RootState } from '@/store';

export function GamePlayer({ slug }: { slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const entry = GAME_REGISTRY[slug];
  const meta = FREE_GAME_CATALOG.find((g) => g.slug === slug);
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const isPremiumGame = meta?.access === 'PREMIUM' || meta?.access === 'CREDITS';

  const { data: access, isLoading, isError } = useQuery({
    queryKey: ['game-access', slug],
    enabled: isPremiumGame && !!token,
    queryFn: async () => {
      try {
        return await api<{ allowed: boolean; reason?: string }>(`/games/${slug}/access`, { token });
      } catch {
        return { allowed: false, reason: 'premium_or_credits_required' };
      }
    },
    retry: false,
  });

  const blocked = isPremiumGame && (!token || isError || (access && !access.allowed));

  useEffect(() => {
    if (!canvasRef.current || !entry || blocked) return;
    const engine = createEngine(canvasRef.current, entry.create, {
      onScore: setScore,
      onGameOver: () => setEnded(true),
    });
    return () => engine.stop();
  }, [entry, slug, blocked]);

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-neon-magenta">Game not found</h1>
        <p className="mt-2 text-white/60">Drop a new folder into /games to register a title.</p>
        <Link href="/games" className="mt-6 inline-block text-neon-cyan">
          Back to library
        </Link>
      </div>
    );
  }

  if (isPremiumGame && !token) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-neon-gold">Premium Original</p>
        <h1 className="mt-3 font-display text-3xl text-white">{entry.title}</h1>
        <p className="mt-3 text-white/60">
          Signature & story worlds are Premium — fair challenge, cosmetics-only monetization, no pay-to-win.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-full bg-neon-cyan px-6 py-3 text-sm font-semibold text-void-950">
            Sign in
          </Link>
          <Link href="/store" className="rounded-full border border-neon-gold/40 px-6 py-3 text-sm text-neon-gold">
            Go Premium
          </Link>
        </div>
      </div>
    );
  }

  if (isPremiumGame && (isLoading || blocked)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-neon-gold">Premium Original</p>
        <h1 className="mt-3 font-display text-3xl text-white">{entry.title}</h1>
        <p className="mt-3 text-white/60">
          {isLoading
            ? 'Checking access…'
            : 'Unlock with Premium or credits. Power is never for sale — only cosmetics and worlds.'}
        </p>
        <Link href="/store" className="mt-8 inline-block rounded-full bg-neon-magenta px-6 py-3 text-sm font-semibold text-white">
          Open Store
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neon-cyan/70">
            {isPremiumGame ? 'Premium · Fair Challenge' : 'Now Playing'}
          </p>
          <h1 className="font-display text-2xl text-white md:text-3xl">{entry.title}</h1>
        </div>
        <div className="text-sm text-white/60">
          Score <span className="text-neon-cyan">{score}</span>
          {ended && <span className="ml-3 text-neon-magenta">Ended — press R · learn & retry</span>}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-neon-cyan/20">
        <canvas ref={canvasRef} className="block w-full touch-none bg-void-950" role="img" aria-label={`${entry.title} game canvas`} />
      </div>
      <p className="mt-4 text-sm text-white/45">
        Easy to start · Difficult to master · Always rewarding · 70% skill / 20% exploration / 10% surprise
      </p>
      <div className="mt-4 flex gap-3">
        <Link href="/games" className="text-sm text-neon-cyan hover:underline">
          Library
        </Link>
        <Link href="/living-world" className="text-sm text-white/50 hover:text-white">
          Living World
        </Link>
      </div>
    </div>
  );
}
