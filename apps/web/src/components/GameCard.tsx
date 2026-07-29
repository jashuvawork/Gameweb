'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Game } from '@/lib/api';
import { getGameArt } from '@games/art/free-game-art';

const gradients = [
  'from-cyan-500/40 to-fuchsia-600/20',
  'from-fuchsia-500/35 to-lime-400/15',
  'from-amber-400/30 to-cyan-500/20',
  'from-lime-400/25 to-violet-500/20',
];

export function GameCard({ game, index = 0 }: { game: Game; index?: number }) {
  const art = getGameArt(game.slug);
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
      className="group"
    >
      <Link href={`/play/${game.slug}`} className="block focus-visible:outline-none">
        <div
          className={`relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} ring-1 ring-white/10 transition group-hover:ring-neon-cyan/50`}
          style={art ? { boxShadow: `0 0 0 1px ${art.accent}33` } : undefined}
        >
          {art ? (
            <img src={art.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 bg-grid-neon bg-[size:24px_24px] opacity-40" />
          )}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-void-950/90 via-void-950/20 to-transparent p-4">
            <div>
              <p className="font-display text-sm tracking-wide text-white">{game.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-white/60">{game.description}</p>
            </div>
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neon-cyan">
            {game.access === 'FREE' ? 'Free' : game.access === 'CREDITS' ? `${game.creditCost} cr` : 'Premium'}
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
