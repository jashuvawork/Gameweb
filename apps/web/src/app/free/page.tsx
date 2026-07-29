'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { FREE_TIER_GAMES } from '@games/catalog/free-tier';
import { api } from '@/lib/api';
import { RewardedAdButton, AdSenseInFeed } from '@/components/AdsAnalytics';
import type { RootState } from '@/store';

const CATEGORIES = ['Arcade', 'Racing', 'Puzzle', 'Action', 'Adventure'] as const;

export default function FreeHubPage() {
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['free-tier'],
    queryFn: () =>
      api<{
        missions: { key: string; title: string; description: string; completed: boolean; reward: { coins: number } }[];
        weekly: { title: string; description: string };
        season: { title: string; description: string };
        wallet: { coins: number; gems: number; crystals: number; relics: number; heroCards: number; avatarClass?: string } | null;
        benefits: string[];
      }>('/free-tier/overview', { token }),
    retry: false,
  });

  const { data: board } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api<{ items: { rank: number; displayName: string; score: number; game: string; avatarClass?: string }[] }>('/free-tier/leaderboard'),
    retry: false,
  });

  const complete = useMutation({
    mutationFn: (key: string) => api(`/free-tier/missions/${key}/complete`, { method: 'POST', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['free-tier'] }),
    onError: (e: Error) => alert(e.message),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <p className="text-xs uppercase tracking-[0.35em] text-neon-cyan/80">Free Tier · Growth Engine</p>
      <h1 className="mt-3 font-display text-4xl text-white">20 polished free games</h1>
      <p className="mt-3 max-w-2xl text-white/60">
        Complete experiences — not demos. Each free game has its own interface, chapter art, and character models.
        Free tier shows ads between chapters and on pause — <Link href="/store" className="text-neon-gold">Premium is ad-free</Link>.
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Phones', body: 'iPhone & Android browsers · tap & swipe · Add to Home Screen' },
          { title: 'Tablets', body: 'iPad & Android tablets · landscape or portrait' },
          { title: 'Laptops & Desktops', body: 'Chrome, Edge, Safari, Firefox · keyboard + mouse' },
          { title: 'Installable PWA', body: 'Install from the browser for an app-like fullscreen play' },
        ].map((d) => (
          <div key={d.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-display text-neon-cyan">{d.title}</p>
            <p className="mt-1 text-sm text-white/50">{d.body}</p>
          </div>
        ))}
      </section>

      <AdSenseInFeed />

      {data?.season && (
        <div className="mt-8 rounded-3xl border border-neon-lime/25 bg-gradient-to-r from-[#0a1a12] to-[#101828] p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-neon-lime">Seasonal Event</p>
          <h2 className="mt-2 font-display text-2xl">{data.season.title}</h2>
          <p className="mt-2 text-white/60">{data.season.description}</p>
        </div>
      )}

      {data?.wallet && (
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-neon-gold/30 px-3 py-1 text-neon-gold">{data.wallet.coins} coins</span>
          <span className="rounded-full border border-neon-cyan/30 px-3 py-1 text-neon-cyan">{data.wallet.gems} gems</span>
          <span className="rounded-full border border-white/15 px-3 py-1">{data.wallet.crystals} crystals</span>
          <span className="rounded-full border border-white/15 px-3 py-1">{data.wallet.relics} relics</span>
          <span className="rounded-full border border-neon-magenta/30 px-3 py-1 text-neon-magenta">{data.wallet.heroCards} hero cards</span>
          {data.wallet.avatarClass && (
            <span className="rounded-full border border-white/15 px-3 py-1">{data.wallet.avatarClass}</span>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <RewardedAdButton reward="chest" label="Optional ad → treasure chest" />
        <RewardedAdButton reward="spin" label="Optional ad → daily spin" />
        <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70">
          Create account to save progress
        </Link>
      </div>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl text-neon-cyan">Daily Missions</h2>
          <ul className="mt-4 space-y-3">
            {(data?.missions || []).map((m) => (
              <li key={m.key} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="text-white">{m.title}</p>
                  <p className="text-white/45">{m.description}</p>
                </div>
                {m.completed ? (
                  <span className="text-neon-lime">Done</span>
                ) : (
                  <button
                    type="button"
                    disabled={!token}
                    onClick={() => complete.mutate(m.key)}
                    className="shrink-0 rounded-full border border-neon-cyan/40 px-3 py-1 text-xs text-neon-cyan disabled:opacity-40"
                  >
                    Claim
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl text-neon-gold">Weekly Challenge</h2>
          {data?.weekly && (
            <>
              <p className="mt-3 text-white">{data.weekly.title}</p>
              <p className="mt-1 text-sm text-white/50">{data.weekly.description}</p>
            </>
          )}
          <h3 className="mt-8 font-display text-lg">Free benefits</h3>
          <ul className="mt-3 space-y-1 text-sm text-white/55">
            {(data?.benefits || []).map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
        </div>
      </section>

      {CATEGORIES.map((cat) => (
        <section key={cat} className="mt-12">
          <h2 className="font-display text-2xl">{cat}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FREE_TIER_GAMES.filter((g) => g.category === cat).map((g) => (
              <Link
                key={g.slug}
                href={`/play/${g.slug}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-neon-cyan/40"
              >
                <p className="font-display text-lg text-white">{g.title}</p>
                <p className="mt-2 text-sm text-white/50">{g.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-14">
        <h2 className="font-display text-2xl">Leaderboards</h2>
        <p className="mt-1 text-sm text-white/45">Your avatar shows here — same account across every free game.</p>
        <div className="mt-5 space-y-2">
          {(board?.items || []).slice(0, 10).map((row) => (
            <div key={`${row.rank}-${row.displayName}`} className="glass flex items-center gap-4 rounded-xl px-4 py-3 text-sm">
              <span className="font-display text-neon-cyan">#{row.rank}</span>
              <span className="flex-1 text-white">
                {row.displayName} {row.avatarClass ? `· ${row.avatarClass}` : ''}
              </span>
              <span className="text-white/40">{row.game}</span>
              <span className="text-neon-gold">{row.score}</span>
            </div>
          ))}
          {!board?.items?.length && <p className="text-sm text-white/40">Play free games to climb the board.</p>}
        </div>
      </section>

      <section className="mt-14 rounded-3xl border border-neon-magenta/25 p-8">
        <h2 className="font-display text-2xl text-neon-magenta">Ready for more?</h2>
        <p className="mt-2 max-w-xl text-white/60">
          Premium unlocks 200+ worlds, Story Mode, no ads, exclusive cosmetics, and early access — because you already love
          the free experience.
        </p>
        <Link href="/store" className="mt-6 inline-block rounded-full bg-neon-magenta px-6 py-3 text-sm font-semibold text-white">
          See Premium value
        </Link>
      </section>
    </div>
  );
}
