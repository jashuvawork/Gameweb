'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { hydrate, setSearch, clearAuth } from '@/store';
import type { RootState } from '@/store';

export function SiteHeader() {
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const search = useSelector((s: RootState) => s.ui.search);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dispatch(hydrate());
  }, [dispatch]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-void-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group flex shrink-0 items-center leading-none" aria-label="Jgames home">
          <span className="font-display text-lg font-800 tracking-[0.08em] text-neon-cyan neon-text md:text-xl">
            Jgames
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-white/70 md:flex" aria-label="Primary">
          <Link href="/games" className="hover:text-neon-cyan">
            Games
          </Link>
          <Link href="/free" className="hover:text-neon-cyan">
            Free
          </Link>
          <Link href="/living-world" className="hover:text-neon-cyan">
            Living World
          </Link>
          <Link href="/store" className="hover:text-neon-cyan">
            Store
          </Link>
          <Link href="/season-pass" className="hover:text-neon-cyan">
            Season Pass
          </Link>
          <Link href="/profile" className="hover:text-neon-cyan">
            Profile
          </Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2 md:max-w-md md:flex-none">
          <label className="sr-only" htmlFor="global-search">
            Search games
          </label>
          <input
            id="global-search"
            value={search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            placeholder="Search worlds…"
            className="glass w-full max-w-[12rem] rounded-full px-4 py-2 text-sm outline-none ring-neon-cyan/40 placeholder:text-white/30 focus:ring-2 sm:max-w-xs"
          />
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden rounded-full border border-neon-cyan/30 px-3 py-1.5 text-xs text-neon-cyan sm:inline"
              >
                Lv {user.level} · {user.credits} cr
              </Link>
              <button
                type="button"
                className="text-xs text-white/50 hover:text-white"
                onClick={() => {
                  localStorage.removeItem('jg_access');
                  localStorage.removeItem('jg_user');
                  dispatch(clearAuth());
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-neon-cyan/90 px-4 py-2 text-xs font-semibold text-void-950 shadow-neon"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            className="rounded-md border border-white/10 px-2 py-1 text-white/70 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </div>
      {open && (
        <motion.nav
          id="mobile-nav"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-white/5 px-4 py-3 md:hidden"
        >
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/games" onClick={() => setOpen(false)}>
              Games
            </Link>
            <Link href="/store" onClick={() => setOpen(false)}>
              Store
            </Link>
            <Link href="/season-pass" onClick={() => setOpen(false)}>
              Season Pass
            </Link>
            <Link href="/profile" onClick={() => setOpen(false)}>
              Profile
            </Link>
          </div>
        </motion.nav>
      )}
    </header>
  );
}
