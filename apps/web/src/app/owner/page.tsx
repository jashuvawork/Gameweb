'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { api } from '@/lib/api';
import { OwnerPublisher } from '@/components/owner/OwnerPublisher';
import type { RootState } from '@/store';

const NAV = [
  'Publisher',
  'Dashboard',
  'Revenue',
  'Users',
  'Games',
  'Subscriptions',
  'Credits',
  'Analytics',
  'Reports',
  'Content',
  'AI Studio',
  'Notifications',
  'Moderation',
  'Advertisements',
  'Server Status',
  'Logs',
  'Database',
  'Backups',
  'Settings',
];

function slugify(label: string) {
  return label.toLowerCase().replace(/\s+/g, '-');
}

export default function OwnerDashboard() {
  const { user, accessToken } = useSelector((s: RootState) => s.auth);
  const router = useRouter();
  const pathname = usePathname();
  const [section, setSection] = useState('publisher');
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [idle, setIdle] = useState(Date.now());

  useEffect(() => {
    if (!accessToken) {
      router.replace('/owner-login');
      return;
    }
    if (user && user.role !== 'SUPER_OWNER' && user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [accessToken, user, router]);

  useEffect(() => {
    const onMove = () => setIdle(Date.now());
    window.addEventListener('mousemove', onMove);
    window.addEventListener('keydown', onMove);
    const t = setInterval(() => {
      if (Date.now() - idle > 30 * 60 * 1000) {
        localStorage.removeItem('jg_access');
        router.replace('/owner-login');
      }
    }, 15000);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('keydown', onMove);
      clearInterval(t);
    };
  }, [idle, router]);

  useEffect(() => {
    if (!accessToken || section === 'publisher') return;
    const map: Record<string, string> = {
      dashboard: '/owner/dashboard',
      users: '/owner/users',
      games: '/owner/games',
      analytics: '/owner/analytics',
      advertisements: '/owner/publisher/ads-config',
      'server-status': '/owner/server-status',
      logs: '/owner/logs',
      settings: '/owner/settings',
      reports: '/owner/reports',
      backups: '/owner/backups',
    };
    const path = map[section];
    if (!path) {
      setData({
        info: `${section} panel ready — use Publisher for game releases, assets, and external review queues.`,
      });
      return;
    }
    setError('');
    api(path, { token: accessToken })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [section, accessToken]);

  async function runAiStudio() {
    if (!accessToken) return;
    const res = await api('/ai/studio', {
      method: 'POST',
      token: accessToken,
      body: JSON.stringify({ kind: 'story', seed: String(Date.now()) }),
    });
    setData(res);
    setSection('ai-studio');
  }

  async function createBackup() {
    if (!accessToken) return;
    const res = await api('/owner/backups', { method: 'POST', token: accessToken });
    setData(res);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1400px]">
      <aside className="hidden w-64 shrink-0 border-r border-white/5 p-4 md:block">
        <p className="font-display text-sm tracking-[0.2em] text-neon-cyan">SUPER OWNER</p>
        <p className="mt-1 text-xs text-white/40">{user?.displayName || 'Jashuva'}</p>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Owner">
          {NAV.map((label) => {
            const id = slugify(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSection(id)}
                className={`rounded-lg px-3 py-2 text-left text-sm ${
                  section === id ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-white/55 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
        <Link href="/" className="mt-8 block text-xs text-white/30 hover:text-white">
          Exit to site
        </Link>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 md:hidden">
          <select
            className="rounded-xl border border-white/10 bg-void-950 px-3 py-2 text-sm text-white"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          >
            {NAV.map((label) => (
              <option key={label} value={slugify(label)}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl capitalize text-white">{section.replace(/-/g, ' ')}</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSection('publisher')}
              className="rounded-full border border-neon-gold/40 px-4 py-2 text-xs text-neon-gold"
            >
              Open Publisher
            </button>
            <button
              type="button"
              onClick={runAiStudio}
              className="rounded-full border border-neon-magenta/40 px-4 py-2 text-xs text-neon-magenta"
            >
              AI Studio Generate
            </button>
            <button
              type="button"
              onClick={createBackup}
              className="rounded-full border border-neon-cyan/40 px-4 py-2 text-xs text-neon-cyan"
            >
              Backup Now
            </button>
          </div>
        </div>

        {section === 'publisher' && accessToken ? (
          <div className="mt-6">
            <OwnerPublisher token={accessToken} />
          </div>
        ) : (
          <>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
            <pre className="glass mt-6 max-h-[70vh] overflow-auto rounded-2xl p-4 text-xs text-neon-lime/90">
              {JSON.stringify(data, null, 2)}
            </pre>
          </>
        )}
        <p className="mt-4 text-[10px] text-white/25">
          Path {pathname} · noindex · JWT + RBAC · publisher review gates · session timeout 30m
        </p>
      </main>
    </div>
  );
}
