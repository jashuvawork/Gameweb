'use client';

import { GameCard } from './GameCard';
import type { Game } from '@/lib/api';

export function GameRail({ title, subtitle, games }: { title: string; subtitle?: string; games: Game[] }) {
  if (!games.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-5">
        <h2 className="font-display text-xl tracking-wide text-white md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {games.map((g, i) => (
          <GameCard key={g.id || g.slug} game={g} index={i} />
        ))}
      </div>
    </section>
  );
}
