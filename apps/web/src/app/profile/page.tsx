'use client';

import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RootState } from '@/store';

export default function ProfilePage() {
  const { user, accessToken } = useSelector((s: RootState) => s.auth);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    enabled: !!accessToken,
    queryFn: () => api('/users/me', { token: accessToken }),
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    enabled: !!accessToken,
    queryFn: () => api<{ plays: number; totalPlayTime: number; achievements: number }>('/users/me/stats', { token: accessToken }),
    retry: false,
  });

  const daily = useMutation({
    mutationFn: () => api('/users/me/daily-reward', { method: 'POST', token: accessToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Player Profile</h1>
        <p className="mt-2 text-white/50">Sign in to sync XP, cloud saves, and rewards.</p>
        <Link href="/login" className="mt-6 inline-block rounded-full bg-neon-cyan px-6 py-3 text-sm font-semibold text-void-950">
          Sign in
        </Link>
      </div>
    );
  }

  const p = (profile || user) as {
    displayName: string;
    username: string;
    level: number;
    xp: number;
    coins: number;
    credits: number;
    subscription: string;
    avatarUrl?: string;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="glass flex flex-col gap-6 rounded-3xl p-8 md:flex-row md:items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan/40 to-neon-magenta/30 font-display text-3xl text-white">
          {(p.displayName || p.username || 'J')[0]}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl">{p.displayName || p.username}</h1>
          <p className="text-white/50">@{p.username}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-neon-cyan/30 px-3 py-1 text-neon-cyan">Lv {p.level}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{p.xp} XP</span>
            <span className="rounded-full border border-neon-gold/30 px-3 py-1 text-neon-gold">{p.coins} coins</span>
            <span className="rounded-full border border-neon-lime/30 px-3 py-1 text-neon-lime">{p.credits} credits</span>
            <span className="rounded-full border border-neon-magenta/30 px-3 py-1 text-neon-magenta">{p.subscription}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => daily.mutate()}
          className="rounded-full bg-neon-magenta/90 px-5 py-3 text-sm font-semibold text-white"
        >
          Claim Daily Reward
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-white/40">Sessions</p>
          <p className="mt-2 font-display text-2xl">{stats?.plays ?? '—'}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-white/40">Play time (s)</p>
          <p className="mt-2 font-display text-2xl">{stats?.totalPlayTime ?? '—'}</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wider text-white/40">Achievements</p>
          <p className="mt-2 font-display text-2xl">{stats?.achievements ?? '—'}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/store" className="text-neon-cyan">
          Store
        </Link>
        <Link href="/season-pass" className="text-white/60">
          Season Pass
        </Link>
        <Link href="/games" className="text-white/60">
          Library
        </Link>
      </div>
    </div>
  );
}
