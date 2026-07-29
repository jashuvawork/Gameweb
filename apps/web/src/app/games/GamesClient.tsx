'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { GameRail } from '@/components/GameRail';
import { api, type Game } from '@/lib/api';
import { FREE_GAME_CATALOG, GENRES } from '@/lib/catalog';
import Link from 'next/link';

export default function GamesPage() {
  const params = useSearchParams();
  const genre = params.get('genre') || '';
  const access = params.get('access') || '';
  const search = params.get('search') || '';

  const { data } = useQuery({
    queryKey: ['games', genre, access, search],
    queryFn: () => {
      const q = new URLSearchParams();
      if (genre) q.set('genre', genre);
      if (access) q.set('access', access);
      if (search) q.set('search', search);
      q.set('take', '200');
      return api<{ items: Game[] }>(`/games?${q}`);
    },
    retry: false,
  });

  const games = useMemo(() => {
    let list = data?.items?.length ? data.items : FREE_GAME_CATALOG;
    if (genre) list = list.filter((g) => g.genres.includes(genre));
    if (access) list = list.filter((g) => g.access === access);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((g) => g.title.toLowerCase().includes(s));
    }
    return list;
  }, [data, genre, access, search]);

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-10 md:px-6">
        <h1 className="font-display text-3xl tracking-wide">Game Library</h1>
        <p className="mt-2 text-white/50">Filter by genre, access, or search. Built to scale past 10,000 titles.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/games" className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
            All
          </Link>
          <Link href="/games?access=FREE" className="rounded-full border border-neon-cyan/30 px-3 py-1 text-xs text-neon-cyan">
            Free
          </Link>
          <Link href="/games?access=PREMIUM" className="rounded-full border border-neon-magenta/30 px-3 py-1 text-xs text-neon-magenta">
            Premium
          </Link>
          {GENRES.map((g) => (
            <Link key={g} href={`/games?genre=${encodeURIComponent(g)}`} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50 hover:text-white">
              {g}
            </Link>
          ))}
        </div>
      </div>
      <GameRail title={`${games.length} titles`} games={games} />
    </div>
  );
}
