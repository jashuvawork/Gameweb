const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/backend';

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json() as Promise<T>;
}

export type Game = {
  id: string;
  slug: string;
  title: string;
  description: string;
  genres: string[];
  tags: string[];
  access: 'FREE' | 'PREMIUM' | 'CREDITS';
  creditCost: number;
  featured: boolean;
  trending: boolean;
  endlessStory: boolean;
  thumbnail?: string;
  playCount?: number;
};
