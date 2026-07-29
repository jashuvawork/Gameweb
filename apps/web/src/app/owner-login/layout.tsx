import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Owner Login',
  robots: { index: false, follow: false, nocache: true, noarchive: true },
  other: { 'X-Robots-Tag': 'noindex, nofollow, noarchive' },
};

export default function OwnerLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
