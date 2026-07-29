'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CHARACTER_FAMILIES, DESIGN_PHILOSOPHY, LIVING_WORLD_ROTATION } from '@jashuva/shared';

export default function LivingWorldPage() {
  const { data } = useQuery({
    queryKey: ['living-world'],
    queryFn: () =>
      api<{ event: { title: string; description: string; region?: string; endsAt?: string }; philosophy: string }>(
        '/living-world',
      ),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <p className="text-xs uppercase tracking-[0.35em] text-neon-lime/80">Signature JGames Feature</p>
      <h1 className="mt-3 font-display text-4xl text-white">The Living World</h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Every week the world changes for everyone — volcanoes, thaws, comets, creatures, sieges, and hidden dungeons.
        Players return because the universe keeps evolving.
      </p>

      {data?.event && (
        <div className="mt-10 rounded-3xl border border-neon-lime/25 bg-gradient-to-br from-[#0a1a12] to-[#101828] p-8">
          <p className="text-sm text-neon-lime">Active this week</p>
          <h2 className="mt-2 font-display text-3xl">{data.event.title}</h2>
          <p className="mt-3 text-white/65">{data.event.description}</p>
          {data.event.region && <p className="mt-4 text-neon-cyan">Region · {data.event.region}</p>}
        </div>
      )}

      <h2 className="mt-14 font-display text-2xl">Weekly rotation</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {LIVING_WORLD_ROTATION.map((e) => (
          <div key={e.key} className="glass rounded-2xl p-5">
            <h3 className="font-display text-lg text-white">{e.title}</h3>
            <p className="mt-2 text-sm text-white/55">{e.description}</p>
            <p className="mt-3 text-xs text-neon-cyan">{e.region}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl">Character families</h2>
      <p className="mt-2 text-sm text-white/50">Original casts — never borrowed archetypes.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHARACTER_FAMILIES.map((f) => (
          <div key={f.id} className="rounded-2xl border border-white/10 p-5">
            <h3 className="font-display text-white">{f.name}</h3>
            <p className="mt-2 text-sm text-white/55">{f.blurb}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-white/10 p-6">
        <h2 className="font-display text-xl text-neon-cyan">{DESIGN_PHILOSOPHY.motto}</h2>
        <ul className="mt-4 space-y-2 text-sm text-white/60">
          {DESIGN_PHILOSOPHY.rules.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-white/45">
          Challenge blend: {Math.round(DESIGN_PHILOSOPHY.blend.skill * 100)}% skill ·{' '}
          {Math.round(DESIGN_PHILOSOPHY.blend.exploration * 100)}% exploration ·{' '}
          {Math.round(DESIGN_PHILOSOPHY.blend.luck * 100)}% surprise
        </p>
      </div>

      <p className="mt-8 text-sm">
        <Link href="/store" className="text-neon-gold">
          Premium unlocks Living World rewards (cosmetics only)
        </Link>
      </p>
    </div>
  );
}
