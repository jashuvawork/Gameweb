'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { api } from '@/lib/api';
import { setAuth } from '@/store';

export default function OwnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needs2fa, setNeeds2fa] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await api<{
        accessToken?: string;
        user?: never;
        requires2FA?: boolean;
      }>('/auth/owner-login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          totpCode: totpCode || undefined,
          deviceFingerprint: 'owner-web',
        }),
      });
      if (res.requires2FA) {
        setNeeds2fa(true);
        return;
      }
      if (!res.accessToken || !res.user) throw new Error('Login failed');
      localStorage.setItem('jg_access', res.accessToken);
      localStorage.setItem('jg_user', JSON.stringify(res.user));
      localStorage.setItem('jg_owner', '1');
      dispatch(setAuth({ accessToken: res.accessToken, user: res.user }));
      router.push('/owner');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access denied');
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
      <p className="text-xs uppercase tracking-[0.4em] text-white/30">Restricted</p>
      <h1 className="mt-2 font-display text-2xl text-white/80">Owner Access</h1>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Owner email"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm"
          autoComplete="username"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm"
          autoComplete="current-password"
        />
        {needs2fa && (
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            placeholder="Authenticator code"
            className="w-full rounded-xl border border-neon-magenta/40 bg-black/40 px-4 py-3 text-sm"
          />
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-full border border-white/20 py-3 text-sm text-white/80">
          Authenticate
        </button>
      </form>
    </div>
  );
}
