'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AVATAR_CLASSES, COMPANION_TYPES } from '@jashuva/shared';
import { api } from '@/lib/api';
import type { RootState } from '@/store';

export default function ProfilePage() {
  const { user, accessToken } = useSelector((s: RootState) => s.auth);
  const qc = useQueryClient();
  const [avatarClass, setAvatarClass] = useState('Explorer');
  const [companionType, setCompanionType] = useState('Floating Crystal');
  const [companionName, setCompanionName] = useState('Aether');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    enabled: !!accessToken,
    queryFn: () =>
      api<{
        displayName: string;
        username: string;
        level: number;
        xp: number;
        coins: number;
        credits: number;
        subscription: string;
        avatarClass?: string;
        companionType?: string;
        companionName?: string;
        playerTitle?: string;
        inventory?: { id: string; itemKey: string; itemType: string; equipped: boolean }[];
      }>('/users/me', { token: accessToken }),
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    enabled: !!accessToken,
    queryFn: () => api<{ plays: number; totalPlayTime: number; achievements: number }>('/users/me/stats', { token: accessToken }),
    retry: false,
  });

  const { data: companion } = useQuery({
    queryKey: ['companion', profile?.companionName],
    enabled: !!accessToken,
    queryFn: () =>
      api<{ name: string; mood: string; line: string }>('/ai/companion', {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify({ companionName: profile?.companionName || companionName }),
      }),
    retry: false,
  });

  const daily = useMutation({
    mutationFn: () => api('/users/me/daily-reward', { method: 'POST', token: accessToken }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });

  const saveIdentity = useMutation({
    mutationFn: () =>
      api('/users/me', {
        method: 'PATCH',
        token: accessToken,
        body: JSON.stringify({ avatarClass, companionType, companionName }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-2xl">Player Profile</h1>
        <p className="mt-2 text-white/50">Sign in to sync XP, avatar, companion, and rewards.</p>
        <Link href="/login" className="mt-6 inline-block rounded-full bg-neon-cyan px-6 py-3 text-sm font-semibold text-void-950">
          Sign in
        </Link>
      </div>
    );
  }

  type ProfileView = {
    displayName?: string;
    username?: string;
    level?: number;
    xp?: number;
    coins?: number;
    credits?: number;
    subscription?: string;
    avatarClass?: string;
    companionType?: string;
    companionName?: string;
    playerTitle?: string;
    inventory?: { id: string; itemKey: string; itemType: string; equipped: boolean }[];
  };

  const p: ProfileView = profile || user || {};

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="glass flex flex-col gap-6 rounded-3xl p-8 md:flex-row md:items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan/40 to-neon-magenta/30 font-display text-3xl text-white">
          {(p?.displayName || p?.username || 'J')[0]}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-3xl">{p?.displayName || p?.username}</h1>
          <p className="text-white/50">
            @{p?.username} · {p?.avatarClass || 'Explorer'} · {p?.playerTitle || 'Newcomer'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-neon-cyan/30 px-3 py-1 text-neon-cyan">Lv {p?.level}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{p?.xp} XP</span>
            <span className="rounded-full border border-neon-gold/30 px-3 py-1 text-neon-gold">{p?.coins} coins</span>
            <span className="rounded-full border border-neon-lime/30 px-3 py-1 text-neon-lime">{p?.credits} credits</span>
            <span className="rounded-full border border-neon-magenta/30 px-3 py-1 text-neon-magenta">{p?.subscription}</span>
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

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl text-neon-cyan">Avatar</h2>
          <p className="mt-1 text-sm text-white/45">Classes & cosmetics never change power — only identity.</p>
          <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">Class</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm"
            value={avatarClass}
            onChange={(e) => setAvatarClass(e.target.value)}
          >
            {AVATAR_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => saveIdentity.mutate()}
            className="mt-4 rounded-full bg-neon-cyan/90 px-4 py-2 text-sm font-semibold text-void-950"
          >
            Save identity
          </button>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2 className="font-display text-xl text-neon-lime">AI Companion</h2>
          <p className="mt-1 text-sm text-white/45">Hints, cheers, danger reactions — never pay-to-win buffs.</p>
          <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">Type</label>
          <select
            className="mt-1 w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm"
            value={companionType}
            onChange={(e) => setCompanionType(e.target.value)}
          >
            {COMPANION_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-xs uppercase tracking-wider text-white/40">Name</label>
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm"
            value={companionName}
            onChange={(e) => setCompanionName(e.target.value)}
          />
          {companion && (
            <p className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-white/70">
              <span className="text-neon-lime">{companion.name}</span> ({companion.mood}): {companion.line}
            </p>
          )}
        </section>
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

      {!!profile?.inventory?.length && (
        <section className="mt-8">
          <h2 className="font-display text-xl">Cosmetic collection</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profile.inventory.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
                <span className="text-white">{item.itemKey}</span>
                <span className="ml-2 text-white/40">{item.itemType}</span>
                {item.equipped && <span className="ml-2 text-neon-cyan">equipped</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/store" className="text-neon-cyan">
          Store
        </Link>
        <Link href="/living-world" className="text-neon-lime">
          Living World
        </Link>
        <Link href="/season-pass" className="text-white/60">
          Season Pass
        </Link>
      </div>
    </div>
  );
}
