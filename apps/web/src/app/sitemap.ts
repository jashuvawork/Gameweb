import type { MetadataRoute } from 'next';
import { FREE_GAME_CATALOG } from '@/lib/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || 'http://localhost:3000';
  const staticRoutes = ['', '/games', '/store', '/season-pass', '/login', '/privacy', '/terms'].map((path) => ({
    url: `${base}${path || '/'}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1 : 0.7,
  }));
  const games = FREE_GAME_CATALOG.map((g) => ({
    url: `${base}/play/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  return [...staticRoutes, ...games];
}
