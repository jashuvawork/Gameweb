'use client';

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { RootState } from '@/store';
import { SUBSCRIPTION_PLANS, CREDIT_PACKS } from '@jashuva/shared';

export default function StorePage() {
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const { data } = useQuery({
    queryKey: ['catalog'],
    queryFn: () => api<{ cosmetics: { id: string; name: string; type: string; priceCredits: number }[]; note: string }>('/store/catalog'),
    retry: false,
  });

  async function buyCredits(packId: string) {
    if (!token) return alert('Sign in to purchase credits');
    const res = await api<{ url?: string; mode?: string; granted?: number }>('/store/credits/checkout', {
      method: 'POST',
      token,
      body: JSON.stringify({ packId }),
    });
    if (res.url) window.location.href = res.url;
    else alert(`Dev mode granted ${res.granted} credits`);
  }

  async function buySub(tier: string) {
    if (!token) return alert('Sign in for Premium');
    const res = await api<{ url?: string; mode?: string }>('/store/subscriptions/checkout', {
      method: 'POST',
      token,
      body: JSON.stringify({ tier }),
    });
    if (res.url) window.location.href = res.url;
    else alert(`Dev mode activated ${tier}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="font-display text-3xl text-neon-cyan">Store</h1>
      <p className="mt-2 max-w-2xl text-white/55">
        NO PAY TO WIN. Unlock games with subscription or credits. Cosmetics, themes, skins, pets, and animations only. No gambling.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-xl">Subscriptions</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SUBSCRIPTION_PLANS.map((p) => (
            <div key={p.tier} className="glass rounded-2xl p-5">
              <h3 className="font-display text-lg text-white">{p.name}</h3>
              <p className="mt-2 text-2xl text-neon-cyan">
                {p.priceMonthly ? `$${p.priceMonthly}/mo` : p.priceYearly ? `$${p.priceYearly}/yr` : 'Free'}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/55">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {p.tier !== 'FREE' && (
                <button
                  type="button"
                  onClick={() => buySub(p.tier)}
                  className="mt-5 w-full rounded-full bg-neon-cyan/90 py-2 text-sm font-semibold text-void-950"
                >
                  Subscribe
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl">Credits</h2>
        <p className="mt-1 text-sm text-white/45">Purchased via Stripe. Unlock premium games & cosmetics.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => buyCredits(pack.id)}
              className="glass rounded-2xl p-5 text-left transition hover:border-neon-cyan/40"
            >
              <p className="font-display text-lg text-white">{pack.credits + pack.bonus} credits</p>
              <p className="mt-1 text-neon-cyan">${pack.price}</p>
              {pack.bonus > 0 && <p className="mt-1 text-xs text-neon-lime">+{pack.bonus} bonus</p>}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl">Cosmetics</h2>
        <p className="mt-1 text-sm text-white/45">{data?.note || 'Themes · skins · pets · animations'}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.cosmetics || []).map((c) => (
            <div key={c.id} className="glass rounded-2xl p-5">
              <p className="font-display text-white">{c.name}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/40">{c.type}</p>
              <p className="mt-3 text-neon-gold">{c.priceCredits} credits</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-white/40">
        <Link href="/games">Browse games</Link>
      </p>
    </div>
  );
}
