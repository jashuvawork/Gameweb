'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { RootState } from '@/store';
import { api } from '@/lib/api';

function usePremium() {
  const user = useSelector((s: RootState) => s.auth.user);
  return (
    user?.subscription === 'PREMIUM_MONTHLY' ||
    user?.subscription === 'PREMIUM_YEARLY' ||
    user?.subscription === 'FAMILY'
  );
}

function useAdsFlags() {
  return useQuery({
    queryKey: ['public-ads-flags'],
    queryFn: () => api<{ adsEnabled: boolean; slots: Record<string, string> | null }>('/public/ads-flags'),
    staleTime: 60_000,
    retry: false,
  });
}

type AdFormat = 'banner' | 'infeed' | 'multipurpose';

/** Responsive AdSense unit — free users only; Premium + owner kill-switch hide ads */
export function AdSenseBanner({ format = 'banner' }: { format?: AdFormat }) {
  const premium = usePremium();
  const { data: flags } = useAdsFlags();
  const envClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const client = envClient;
  const slotFromEnv =
    format === 'infeed'
      ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED
      : format === 'multipurpose'
        ? process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTI
        : process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER;
  const slot = flags?.slots?.[format] || slotFromEnv || '0000000000';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!client || premium || flags?.adsEnabled === false) return;
    const t = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(t);
  }, [client, premium, flags?.adsEnabled]);

  useEffect(() => {
    if (!visible || !client) return;
    try {
      // @ts-expect-error adsbygoogle
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* ignore */
    }
  }, [visible, client, slot, format]);

  if (!client || premium || flags?.adsEnabled === false || !visible) return null;

  return (
    <div
      className={`mx-auto my-6 max-w-7xl px-4 ${format === 'infeed' ? 'my-4' : ''}`}
      aria-label="Advertisement"
    >
      <Script
        async
        src={`https://pagead2.googlesyndication.com/adsbygoogle.js?client=${client}`}
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: format === 'infeed' ? 120 : 90 }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format === 'infeed' ? 'fluid' : 'auto'}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/** In-feed style unit for library / hub pages */
export function AdSenseInFeed() {
  return <AdSenseBanner format="infeed" />;
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
  const premium = usePremium();
  const { data: flags } = useAdsFlags();

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

  if (premium || !token || flags?.adsEnabled === false) return null;

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
