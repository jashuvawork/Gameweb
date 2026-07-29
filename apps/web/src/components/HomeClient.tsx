'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { GameRail } from './GameRail';
import { api, type Game } from '@/lib/api';
import { GENRES } from '@/lib/catalog';
import type { RootState } from '@/store';

export function HomeClient({ initialGames }: { initialGames: Game[] }) {
  const search = useSelector((s: RootState) => s.ui.search);
  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: () => api<{ items: Game[] }>('/games?take=100'),
    retry: false,
  });

  const games = data?.items?.length ? data.items : initialGames;

  const filtered = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.genres.some((x) => x.toLowerCase().includes(q)),
    );
  }, [games, search]);

  const featured = filtered.filter((g) => g.featured).slice(0, 8);
  const trending = filtered.filter((g) => g.trending).slice(0, 10);
  const free = filtered.filter((g) => g.access === 'FREE');
  const recent = [...filtered].slice(-8).reverse();

  return (
    <>
      <section className="relative min-h-[88vh] overflow-hidden">
        <div
          className="absolute inset-0 animate-[drift_18s_ease-in-out_infinite] bg-[radial-gradient(circle_at_30%_40%,rgba(0,240,255,0.2),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(255,43,214,0.16),transparent_40%)]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-grid-neon bg-[size:48px_48px] opacity-30" aria-hidden />
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center px-4 py-20 md:px-6">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-extrabold tracking-[0.18em] text-neon-cyan neon-text sm:text-6xl md:text-7xl"
          >
            JASHUVA GAMES
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 max-w-2xl font-display text-2xl tracking-wide text-white sm:text-3xl md:text-4xl"
          >
            Play Forever.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-lg text-base text-white/60 md:text-lg"
          >
            A lighter, more premium gaming universe — free arcade forever, endless AI adventures, zero pay-to-win.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href="/games?access=FREE"
              className="rounded-full bg-neon-cyan px-6 py-3 text-sm font-semibold text-void-950 shadow-neon"
            >
              Play Free Games
            </Link>
            <Link
              href="/store"
              className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 hover:border-neon-magenta/50 hover:text-neon-magenta"
            >
              Explore Premium
            </Link>
          </motion.div>
        </div>
      </section>

      <GameRail title="Featured" subtitle="Handpicked signal worlds" games={featured.length ? featured : free.slice(0, 5)} />
      <GameRail title="Trending" subtitle="What players are diving into" games={trending.length ? trending : free.slice(5, 10)} />
      <GameRail title="Continue Playing" subtitle="Pick up where you left the pulse" games={free.slice(0, 4)} />
      <GameRail title="Recently Added" games={recent} />
      <GameRail title="Free Forever" subtitle="20 original games — no copyrighted assets" games={free} />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <h2 className="font-display text-xl tracking-wide md:text-2xl">Genres</h2>
        <p className="mt-1 text-sm text-white/50">One tap into a universe.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Link
              key={g}
              href={`/games?genre=${encodeURIComponent(g)}`}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-neon-cyan/40 hover:text-neon-cyan"
            >
              {g}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3 md:px-6">
        {[
          { title: 'Daily Rewards', body: 'Return each day for coins, XP, and rare credit drops.', href: '/profile' },
          { title: 'Season Pass', body: 'Cosmetic tracks only — never power advantages.', href: '/season-pass' },
          { title: 'Achievements', body: 'Badge your legend across every forever world.', href: '/profile' },
        ].map((card) => (
          <Link key={card.title} href={card.href} className="glass rounded-2xl p-6 transition hover:border-neon-cyan/40">
            <h3 className="font-display text-lg text-neon-cyan">{card.title}</h3>
            <p className="mt-2 text-sm text-white/55">{card.body}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
