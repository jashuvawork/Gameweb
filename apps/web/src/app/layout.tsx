import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ParticleField } from '@/components/ParticleField';
import { AudioAmbience } from '@/components/AudioAmbience';
import { PwaRegister } from '@/components/PwaRegister';
import { AdSenseBanner, GoogleAnalytics } from '@/components/AdsAnalytics';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: {
    default: 'JASHUVA GAMES — Play Forever.',
    template: '%s · JASHUVA GAMES',
  },
  description:
    'JASHUVA GAMES is a premium progressive web gaming platform. Play forever with free arcade classics, endless AI adventures, and a no pay-to-win store.',
  applicationName: 'JASHUVA GAMES',
  authors: [{ name: 'Jashuva' }],
  keywords: ['JASHUVA GAMES', 'Play Forever', 'PWA games', 'arcade', 'premium gaming'],
  openGraph: {
    type: 'website',
    siteName: 'JASHUVA GAMES',
    title: 'JASHUVA GAMES — Play Forever.',
    description: 'Premium progressive gaming. Free forever games. Endless stories.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'JASHUVA GAMES' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JASHUVA GAMES — Play Forever.',
    description: 'Premium progressive gaming platform.',
    images: ['/og.png'],
  },
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#00f0ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'JASHUVA GAMES',
              slogan: 'Play Forever.',
              url: process.env.APP_URL || 'http://localhost:3000',
              potentialAction: {
                '@type': 'SearchAction',
                target: `${process.env.APP_URL || 'http://localhost:3000'}/games?search={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="bg-atmosphere antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <PwaRegister />
          <GoogleAnalytics />
          <ParticleField />
          <AudioAmbience />
          <div className="relative z-10 flex min-h-screen flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <AdSenseBanner />
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
