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

const SIGNATURE_SLUGS = [
  'rise-of-the-forgotten-king',
  'neon-velocity',
  'shadow-assassin',
  'galaxy-hunters',
  'dragon-legacy',
  'survival-island',
  'cyber-detective',
  'wild-frontier',
  'kingdom-builders',
  'ocean-explorer',
  'zombie-frontier',
  'monster-arena',
  'ninja-legends',
  'speed-legends',
  'pirate-seas',
  'robot-wars',
  'temple-of-legends',
  'battle-command',
  'sky-kingdom',
  'infinity-arena',
];

export function HomeClient({ initialGames }: { initialGames: Game[] }) {
  const search = useSelector((s: RootState) => s.ui.search);
  const { data } = useQuery({
    queryKey: ['games'],
    queryFn: () => api<{ items: Game[] }>('/games?take=250'),
    retry: false,
  });
  const { data: living } = useQuery({
    queryKey: ['living-world'],
    queryFn: () =>
      api<{ event: { title: string; description: string; region?: string }; philosophy: string }>('/living-world'),
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

  const story = filtered.find((g) => g.slug === 'rise-of-the-forgotten-king');
  const featured = filtered.filter((g) => g.featured && g.slug !== 'rise-of-the-forgotten-king').slice(0, 8);
  const trending = filtered.filter((g) => g.trending).slice(0, 10);
  const free = filtered.filter((g) => g.access === 'FREE');
  const premium = filtered.filter((g) => g.access === 'PREMIUM' || g.access === 'CREDITS');
  const originals = premium.filter((g) => SIGNATURE_SLUGS.includes(g.slug));
  const recent = [...filtered].slice(-8).reverse();
  const endless = filtered.filter((g) => g.endlessStory).slice(0, 10);

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
            Easy to start. Difficult to master. Always rewarding.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-lg text-base text-white/60 md:text-lg"
          >
            20 polished free games that feel complete — missions, seasons, leaderboards, and soft Premium conversion. Never
            pay-to-win.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href="/free"
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

      {living?.event && (
        <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="rounded-3xl border border-neon-lime/20 bg-gradient-to-r from-[#0a1a12] to-[#101828] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-neon-lime/80">The Living World · This Week</p>
            <h2 className="mt-2 font-display text-2xl text-white">{living.event.title}</h2>
            <p className="mt-2 max-w-2xl text-white/60">{living.event.description}</p>
            {living.event.region && <p className="mt-3 text-sm text-neon-cyan">Region: {living.event.region}</p>}
            <Link href="/living-world" className="mt-4 inline-block text-sm text-neon-lime hover:underline">
              Explore the Living World
            </Link>
          </div>
        </section>
      )}

      {story && (
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1628] via-[#12102a] to-[#1a0a18] p-8 ring-1 ring-neon-cyan/25 md:p-10"
          >
            <p className="relative text-xs uppercase tracking-[0.35em] text-neon-gold/80">Premium Story Mode</p>
            <h2 className="relative mt-3 font-display text-3xl text-white md:text-4xl">{story.title}</h2>
            <p className="relative mt-3 max-w-2xl text-white/65">
              Every choice builds your legend. Losses teach the next move — 70% skill, 20% exploration, 10% surprise.
            </p>
            <div className="relative mt-6 flex flex-wrap gap-3">
              <Link
                href={`/play/${story.slug}`}
                className="rounded-full bg-neon-magenta px-5 py-2.5 text-sm font-semibold text-white"
              >
                Enter Ashvale (Premium)
              </Link>
              <Link href="/store" className="rounded-full border border-white/20 px-5 py-2.5 text-sm text-white/70">
                Subscribe
              </Link>
            </div>
          </motion.div>
        </section>
      )}

      <GameRail title="Free Forever — Polished" subtitle="20 complete games · Arcade · Racing · Puzzle · Action · Adventure" games={free} />
      <GameRail title="Premium Signature Originals" subtitle="Story Mode + 20 premium titles" games={originals.length ? originals : premium.slice(0, 20)} />
      <GameRail title="Featured Premium" subtitle="Handpicked signal worlds" games={featured.length ? featured : premium.slice(0, 5)} />
      <GameRail title="Endless Stories" subtitle="Chapters that never truly end" games={endless.length ? endless : premium.slice(0, 5)} />
      <GameRail title="Trending" subtitle="What players are diving into" games={trending.length ? trending : free.slice(0, 5)} />
      <GameRail title="Recently Added" games={recent} />

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
          { title: 'Avatar + Companion', body: 'Customize classes, trails, pets — cosmetics only.', href: '/profile' },
          { title: 'Season Pass', body: 'Cosmetic tracks only — never power advantages.', href: '/season-pass' },
          { title: 'Living World', body: 'Weekly world changes for everyone.', href: '/living-world' },
        ].map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-neon-cyan/30"
          >
            <h3 className="font-display text-lg text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-white/50">{card.body}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
