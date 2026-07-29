'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAuth } from '@/store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { email, password, deviceFingerprint: 'web-' + (navigator.userAgent || 'unknown').slice(0, 40) }
          : { email, password, username };
      const res = await api<{
        accessToken: string;
        user: never;
        requires2FA?: boolean;
      }>(path, { method: 'POST', body: JSON.stringify(body) });
      if (res.requires2FA) {
        setError('2FA required — enter authenticator code on next prompt (owner portal).');
        return;
      }
      localStorage.setItem('jg_access', res.accessToken);
      localStorage.setItem('jg_user', JSON.stringify(res.user));
      dispatch(setAuth({ accessToken: res.accessToken, user: res.user }));
      router.push('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auth failed');
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-3xl text-neon-cyan">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>
      <p className="mt-2 text-sm text-white/50">Email login · Google OAuth available when configured.</p>
      <form onSubmit={submit} className="glass mt-8 space-y-4 rounded-2xl p-6">
        {mode === 'register' && (
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-neon-cyan/50"
          />
        )}
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-neon-cyan/50"
        />
        <input
          required
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-neon-cyan/50"
        />
        {error && <p className="text-sm text-neon-magenta">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-neon-cyan py-3 text-sm font-semibold text-void-950">
          {mode === 'login' ? 'Enter' : 'Join Jgames'}
        </button>
        <button
          type="button"
          className="w-full text-sm text-white/50 hover:text-white"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Need an account?' : 'Already play here?'}
        </button>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/google`}
          className="block text-center text-sm text-neon-cyan/80"
        >
          Continue with Google
        </a>
      </form>
      <p className="mt-6 text-center text-xs text-white/30">
        <Link href="/">Back home</Link>
      </p>
    </div>
  );
}
