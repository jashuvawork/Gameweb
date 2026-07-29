import { GameAccess } from '@prisma/client';
import { SIGNATURE_ORIGINALS, buildExpandedCatalog } from './catalog/jgames-200';
import { FREE_TIER_GAMES } from './catalog/free-tier';

export const FREE_GAMES = FREE_TIER_GAMES.map((g, i) => ({
  slug: g.slug,
  title: g.title,
  description: g.description,
  tagline: g.tagline,
  genres: g.genres,
  tags: g.tags,
  access: GameAccess.FREE,
  engine: 'canvas',
  featured: i < 8,
  trending: i < 12,
  endlessStory: g.tags.includes('secrets'),
  creditCost: 0,
  published: true,
  hidden: false,
  version: '1.0.0',
}));

const classicSlugs = FREE_GAMES.map((g) => g.slug);

const expanded = buildExpandedCatalog(classicSlugs);

/** Signature originals + expandable premium catalog */
export const PREMIUM_GAME_SEEDS = expanded
  .filter((g) => !classicSlugs.includes(g.slug))
  .map((g) => ({
    slug: g.slug,
    title: g.title,
    description: g.description,
    tagline: g.tagline,
    genres: g.genres,
    tags: g.tags,
    access: g.access === 'FREE' ? GameAccess.FREE : g.access === 'CREDITS' ? GameAccess.CREDITS : GameAccess.PREMIUM,
    creditCost: g.creditCost,
    engine: g.engine,
    featured: !!g.featured,
    trending: !!g.trending,
    endlessStory: !!g.endlessStory,
    published: true,
    hidden: false,
    version: '1.0.0',
  }));

export const SIGNATURE_PREMIUM_SEEDS = SIGNATURE_ORIGINALS.map((g) => ({
  slug: g.slug,
  title: g.title,
  description: g.description,
  tagline: g.tagline,
  genres: g.genres,
  tags: g.tags,
  access: GameAccess.PREMIUM,
  creditCost: 0,
  engine: g.engine,
  featured: !!g.featured,
  trending: !!g.trending,
  endlessStory: !!g.endlessStory,
  published: true,
  hidden: false,
  version: '1.0.0',
}));

export const ALL_SEED_GAMES = [
  ...FREE_GAMES,
  ...SIGNATURE_PREMIUM_SEEDS,
  ...PREMIUM_GAME_SEEDS.filter((g) => !SIGNATURE_ORIGINALS.some((s) => s.slug === g.slug)),
];

export const ACHIEVEMENTS = [
  { key: 'first_play', title: 'First Win', description: 'Play and finish your first free run', icon: 'spark', xpReward: 50, coinReward: 25 },
  { key: 'speed_master', title: 'Speed Master', description: 'Score 5,000+ in any racing free game', icon: 'bolt', xpReward: 150, coinReward: 60 },
  { key: 'treasure_hunter', title: 'Treasure Hunter', description: 'Collect 25 treasures across adventure games', icon: 'gem', xpReward: 160, coinReward: 70 },
  { key: 'zombie_slayer', title: 'Zombie Slayer', description: 'Survive 10 waves in Zombie Escape', icon: 'skull', xpReward: 140, coinReward: 55 },
  { key: 'streak_7', title: 'Week Walker', description: 'Claim 7 daily rewards', icon: 'flame', xpReward: 200, coinReward: 100 },
  { key: 'score_10k', title: 'Pulse Master', description: 'Reach 10,000 score in any game', icon: 'crown', xpReward: 150, coinReward: 75 },
  { key: 'premium_join', title: 'Forever Player', description: 'Join Premium', icon: 'diamond', xpReward: 300, coinReward: 0 },
  { key: 'friends_5', title: 'Squad Signal', description: 'Add 5 friends', icon: 'users', xpReward: 100, coinReward: 50 },
  { key: 'daily_missions_3', title: 'Mission Ready', description: 'Complete 3 daily missions', icon: 'flag', xpReward: 120, coinReward: 40 },
  { key: 'weekly_challenge', title: 'Week Champion', description: 'Finish a weekly challenge', icon: 'trophy', xpReward: 220, coinReward: 90 },
  { key: 'collector_gems', title: 'Gem Hoarder', description: 'Collect 100 gems', icon: 'crystal', xpReward: 180, coinReward: 50 },
  { key: 'ashvale_chief', title: 'Chief of Ashvale', description: 'Become Chief in Rise of the Forgotten King', icon: 'staff', xpReward: 250, coinReward: 100 },
  { key: 'endless_frontier', title: 'Endless Frontier', description: 'Reach Frontier 5 in Story Mode', icon: 'map', xpReward: 400, coinReward: 150 },
  { key: 'fair_comeback', title: 'Fair Comeback', description: 'Win after an Intelligent Difficulty assist', icon: 'shield', xpReward: 120, coinReward: 40 },
  { key: 'living_world_week', title: 'World Walker', description: 'Play during an active Living World event', icon: 'globe', xpReward: 180, coinReward: 60 },
  { key: 'avatar_custom', title: 'Identity Forge', description: 'Customize your avatar class and cosmetics', icon: 'mask', xpReward: 80, coinReward: 30 },
  { key: 'companion_bond', title: 'Companion Bond', description: 'Name your AI companion', icon: 'heart', xpReward: 80, coinReward: 30 },
  { key: 'secret_finder', title: 'Secret Finder', description: 'Discover a hidden room or shortcut', icon: 'key', xpReward: 100, coinReward: 35 },
];
