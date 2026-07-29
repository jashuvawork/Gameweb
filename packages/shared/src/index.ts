export enum Role {
  SUPER_OWNER = 'SUPER_OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
  USER = 'USER',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM_MONTHLY = 'PREMIUM_MONTHLY',
  PREMIUM_YEARLY = 'PREMIUM_YEARLY',
  FAMILY = 'FAMILY',
}

export enum GameAccess {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  CREDITS = 'CREDITS',
}

export enum Genre {
  ADVENTURE = 'Adventure',
  RPG = 'RPG',
  STRATEGY = 'Strategy',
  SIMULATION = 'Simulation',
  PUZZLE = 'Puzzle',
  ARCADE = 'Arcade',
  SPORTS = 'Sports',
  HORROR = 'Horror',
  FANTASY = 'Fantasy',
  SCI_FI = 'Sci-Fi',
  RACING = 'Racing',
  SURVIVAL = 'Survival',
  ACTION = 'Action',
  PLATFORMER = 'Platformer',
  IDLE = 'Idle',
  MMORPG = 'MMORPG',
}

export const GENRES = Object.values(Genre);

export const FREE_GAME_SLUGS = [
  'space-defender',
  'pixel-runner',
  'galaxy-assault',
  'snake-evolution',
  'brick-destroyer',
  'maze-escape',
  'tank-arena',
  'alien-blaster',
  'sky-shooter',
  'fruit-slice',
  'tower-defender',
  'endless-racer',
  'zombie-survival',
  'word-puzzle',
  'sudoku',
  'chess',
  'checkers',
  'twenty-forty-eight',
  'bubble-pop',
  'memory-match',
] as const;

export type FreeGameSlug = (typeof FREE_GAME_SLUGS)[number];

export interface GameManifest {
  id: string;
  slug: string;
  title: string;
  description: string;
  tagline?: string;
  genres: Genre[];
  tags: string[];
  access: GameAccess;
  creditCost?: number;
  engine: 'canvas' | 'pixi' | 'phaser' | 'three';
  thumbnail?: string;
  cover?: string;
  featured?: boolean;
  trending?: boolean;
  endlessStory?: boolean;
  version: string;
  minPlayers?: number;
  maxPlayers?: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  coins: number;
  credits: number;
  role: Role;
  subscription: SubscriptionTier;
  achievements: string[];
  badges: string[];
  createdAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
}

export interface DailyReward {
  day: number;
  coins: number;
  credits: number;
  xp: number;
  cosmeticId?: string;
}

export const SUBSCRIPTION_PLANS = [
  {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    features: ['20+ free games', 'Daily rewards', 'Cloud saves (limited)', 'Banner ads'],
  },
  {
    tier: SubscriptionTier.PREMIUM_MONTHLY,
    name: 'Premium Monthly',
    priceMonthly: 9.99,
    priceYearly: 0,
    features: ['All free games', '200+ premium games', 'No ads', 'Unlimited cloud saves', 'Season Pass access', 'Exclusive themes'],
  },
  {
    tier: SubscriptionTier.PREMIUM_YEARLY,
    name: 'Premium Yearly',
    priceMonthly: 0,
    priceYearly: 79.99,
    features: ['Everything in Premium', '2 months free', 'Bonus 500 credits', 'Early access games'],
  },
  {
    tier: SubscriptionTier.FAMILY,
    name: 'Family Plan',
    priceMonthly: 14.99,
    priceYearly: 119.99,
    features: ['Up to 6 profiles', 'All Premium benefits', 'Parental controls', 'Shared library'],
  },
] as const;

export const CREDIT_PACKS = [
  { id: 'credits-100', credits: 100, price: 4.99, bonus: 0 },
  { id: 'credits-500', credits: 500, price: 19.99, bonus: 50 },
  { id: 'credits-1200', credits: 1200, price: 39.99, bonus: 200 },
  { id: 'credits-3000', credits: 3000, price: 79.99, bonus: 600 },
] as const;

export const BRAND = {
  name: 'JASHUVA GAMES',
  tagline: 'Play Forever.',
  owner: 'Jashuva',
  supportEmail: 'jashuvawork@gmail.com',
} as const;

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}
