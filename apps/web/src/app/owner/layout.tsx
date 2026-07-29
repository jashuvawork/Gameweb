import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Owner Portal',
  robots: { index: false, follow: false, nocache: true, noarchive: true },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-void-950">
      <meta name="robots" content="noindex, nofollow, noarchive" />
      {children}
    </div>
  );
}
