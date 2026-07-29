'use client';

import Script from 'next/script';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import type { RootState } from '@/store';
import { api } from '@/lib/api';

/** Banner slot — never during active gameplay canvas */
export function AdSenseBanner() {
  const user = useSelector((s: RootState) => s.auth.user);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const premium =
    user?.subscription === 'PREMIUM_MONTHLY' ||
    user?.subscription === 'PREMIUM_YEARLY' ||
    user?.subscription === 'FAMILY';

  if (!client || premium) return null;

  return (
    <div className="mx-auto my-8 max-w-7xl px-4" aria-label="Advertisement">
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 90 }}
        data-ad-client={client}
        data-ad-slot="0000000000"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/** Optional rewarded ads — player stays in control */
export function RewardedAdButton({
  reward = 'double_coins',
  label = 'Watch optional ad for bonus',
}: {
  reward?: 'double_coins' | 'extra_life' | 'chest' | 'spin';
  label?: string;
}) {
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const user = useSelector((s: RootState) => s.auth.user);
  const premium =
    user?.subscription === 'PREMIUM_MONTHLY' ||
    user?.subscription === 'PREMIUM_YEARLY' ||
    user?.subscription === 'FAMILY';

  const claim = useMutation({
    mutationFn: () =>
      api<{ reward: { note: string } }>('/free-tier/rewarded-ad', {
        method: 'POST',
        token,
        body: JSON.stringify({ reward }),
      }),
    onSuccess: (res) => alert(res.reward?.note || 'Reward granted'),
    onError: (e: Error) => alert(e.message),
  });

  if (premium || !token) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (confirm('Optional rewarded ad — continue for a coin/cosmetic bonus? You stay in control.')) {
          claim.mutate();
        }
      }}
      className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70 hover:border-neon-lime/40 hover:text-neon-lime"
    >
      {label}
    </button>
  );
}

export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}');
      `}</Script>
    </>
  );
}
