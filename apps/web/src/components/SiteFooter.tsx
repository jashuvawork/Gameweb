import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-10 text-sm text-white/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="font-display tracking-[0.12em] text-neon-cyan/80">Jgames</p>
          <p className="mt-1">Play Forever. No pay-to-win. Original games only.</p>
          <p className="mt-2 text-xs text-white/35">
            Play on phone, tablet, laptop & desktop — install as a PWA anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/free" className="hover:text-white">
            Free Games
          </Link>
          <Link href="/games" className="hover:text-white">
            Library
          </Link>
          <Link href="/store" className="hover:text-white">
            Store
          </Link>
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
