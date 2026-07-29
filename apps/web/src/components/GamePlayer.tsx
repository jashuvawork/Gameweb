'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { createEngine } from '../../../../games/engine/core';
import { GAME_REGISTRY } from '../../../../games/registry';
import { FREE_GAME_CATALOG } from '@/lib/catalog';
import { api } from '@/lib/api';
import { RewardedAdButton } from '@/components/AdsAnalytics';
import { DeepGameShell } from '@/components/game-ui/DeepGameShell';
import { getGameArt } from '@games/art/free-game-art';
import type { RootState } from '@/store';

export function GamePlayer({ slug }: { slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(!getGameArt(slug));
  const entry = GAME_REGISTRY[slug];
  const meta = FREE_GAME_CATALOG.find((g) => g.slug === slug);
  const art = getGameArt(slug);
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
    if (!canvasRef.current || !entry || blocked || !playing) return;
    const engine = createEngine(canvasRef.current, entry.create, {
      onScore: setScore,
      onGameOver: () => setEnded(true),
    });
    return () => engine.stop();
  }, [entry, slug, blocked, playing]);

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-neon-magenta">Game not found</h1>
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
        <p className="mt-3 text-white/60">Sign in and subscribe for Story Mode & premium worlds — free games stay free.</p>
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
        <h1 className="mt-3 font-display text-3xl text-white">{entry.title}</h1>
        <p className="mt-3 text-white/60">{isLoading ? 'Checking access…' : 'Premium or credits required.'}</p>
        <Link href="/store" className="mt-8 inline-block rounded-full bg-neon-magenta px-6 py-3 text-sm font-semibold text-white">
          Open Store
        </Link>
      </div>
    );
  }

  const canvasBlock = (
    <>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 px-1">
        <div className="text-sm text-white/60">
          Score <span className="text-neon-cyan">{score}</span>
          {ended && <span className="ml-3 text-neon-magenta">Ended — press R</span>}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10" style={art ? { boxShadow: `0 0 40px ${art.accent}22` } : undefined}>
        <canvas ref={canvasRef} className="block w-full touch-none bg-void-950" role="img" aria-label={`${entry.title} game canvas`} />
      </div>
      {!isPremiumGame && ended && (
        <div className="mt-3">
          <RewardedAdButton reward="double_coins" label="Optional ad → double coins bonus" />
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      {!art && (
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-neon-cyan/70">
            {isPremiumGame ? 'Premium · Fair Challenge' : 'Now Playing'}
          </p>
          <h1 className="font-display text-2xl text-white md:text-3xl">{entry.title}</h1>
        </div>
      )}

      {art && !isPremiumGame ? (
        <DeepGameShell slug={slug} title={entry.title} isPremiumGame={!!isPremiumGame} onPlayingChange={setPlaying}>
          {canvasBlock}
        </DeepGameShell>
      ) : (
        canvasBlock
      )}

      <p className="mt-4 text-sm text-white/45">
        {art
          ? 'Deep unique interface · chapter art · character models · free tier ads between chapters/pause (Premium removes ads)'
          : 'Easy to start · Difficult to master · Always rewarding'}
      </p>
      <div className="mt-4 flex gap-3">
        <Link href="/games" className="text-sm text-neon-cyan hover:underline">
          Library
        </Link>
        <Link href="/free" className="text-sm text-white/50 hover:text-white">
          Free Hub
        </Link>
        {!isPremiumGame && (
          <Link href="/store" className="text-sm text-neon-gold hover:text-neon-gold/80">
            Premium = ad-free
          </Link>
        )}
      </div>
    </div>
  );
}
