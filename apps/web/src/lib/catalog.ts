import type { Game } from '@/lib/api';
import { SIGNATURE_ORIGINALS, buildExpandedCatalog } from '@games/catalog/jgames-200';
import { FREE_TIER_GAMES } from '@games/catalog/free-tier';

const CLASSICS: Game[] = FREE_TIER_GAMES.map((g, i) => ({
  id: g.slug,
  slug: g.slug,
  title: g.title,
  description: g.description,
  genres: g.genres,
  tags: g.tags,
  access: 'FREE' as const,
  creditCost: 0,
  featured: i < 8,
  trending: i < 12,
  endlessStory: g.tags.includes('secrets'),
}));

function toGame(g: {
  slug: string;
  title: string;
  description: string;
  genres: string[];
  tags: string[];
  access: 'FREE' | 'PREMIUM' | 'CREDITS';
  creditCost: number;
  featured?: boolean;
  trending?: boolean;
  endlessStory?: boolean;
}): Game {
  return {
    id: g.slug,
    slug: g.slug,
    title: g.title,
    description: g.description,
    genres: g.genres,
    tags: g.tags,
    access: g.access,
    creditCost: g.creditCost,
    featured: !!g.featured,
    trending: !!g.trending,
    endlessStory: !!g.endlessStory,
  };
}

const classicSlugs = CLASSICS.map((g) => g.slug);
const expanded = buildExpandedCatalog(classicSlugs);

/** Full client catalog fallback (~200) */
export const FREE_GAME_CATALOG: Game[] = [
  ...CLASSICS,
  ...SIGNATURE_ORIGINALS.map(toGame),
  ...expanded.filter((g) => !SIGNATURE_ORIGINALS.some((s) => s.slug === g.slug)).map(toGame),
];

export const PLAYABLE_FREE_SLUGS = CLASSICS.map((g) => g.slug);

export const PLAYABLE_PREMIUM_SLUGS = SIGNATURE_ORIGINALS.map((g) => g.slug);

export const PLAYABLE_STATIC_SLUGS = [...PLAYABLE_FREE_SLUGS, ...PLAYABLE_PREMIUM_SLUGS];

export const STORY_MODE = SIGNATURE_ORIGINALS.find((g) => g.slug === 'rise-of-the-forgotten-king')!;

export const FREE_CATEGORIES = ['Arcade', 'Racing', 'Puzzle', 'Action', 'Adventure'] as const;

export const GENRES = [
  'Adventure',
  'RPG',
  'Strategy',
  'Simulation',
  'Puzzle',
  'Arcade',
  'Sports',
  'Horror',
  'Fantasy',
  'Sci-Fi',
  'Racing',
  'Survival',
  'Action',
  'Platformer',
  'Idle',
  'MMORPG',
];
