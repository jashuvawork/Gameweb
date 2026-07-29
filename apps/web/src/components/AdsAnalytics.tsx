'use client';

import Script from 'next/script';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

/** Banner slot — never rendered during active gameplay routes by parent layout choices */
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
