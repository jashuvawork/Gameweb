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
  'pixel-runner',
  'galaxy-defender',
  'brick-blast',
  'snake-evolution',
  'neon-drift',
  'desert-rally',
  'mountain-racer',
  'street-sprint',
  'ancient-temple',
  'number-master',
  'logic-blocks',
  'memory-match',
  'zombie-escape',
  'shadow-ninja',
  'alien-attack',
  'robot-arena',
  'jungle-explorer',
  'treasure-hunter',
  'lost-kingdom',
  'crystal-quest',
] as const;

export type FreeGameSlug = (typeof FREE_GAME_SLUGS)[number];

/** Signature + expanded titles require Premium or credits — never power-paywalled. */
export const PREMIUM_SIGNATURE_SLUGS = [
  'rise-of-the-forgotten-king',
  'neon-velocity',
  'shadow-assassin',
  'galaxy-hunters',
  'dragon-legacy',
  'survival-island',
  'cyber-detective',
  'wild-frontier',
  'kingdom-builders',
  'ocean-explorer',
  'zombie-frontier',
  'monster-arena',
  'ninja-legends',
  'speed-legends',
  'pirate-seas',
  'robot-wars',
  'temple-of-legends',
  'battle-command',
  'sky-kingdom',
  'infinity-arena',
] as const;

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
    features: [
      '20 polished free games (complete — not demos)',
      'Daily missions, achievements, leaderboards',
      'Avatar + AI companion basics',
      'Seasonal events · optional rewarded ads',
      'Chapter/pause ads (upgrade for ad-free)',
      'Cloud save · friends list',
    ],
  },
  {
    tier: SubscriptionTier.PREMIUM_MONTHLY,
    name: 'Premium Monthly',
    priceMonthly: 9.99,
    priceYearly: 0,
    features: [
      'Everything in Free',
      '200+ premium originals + Story Mode',
      'No advertisements (no chapter/pause ads)',
      'Exclusive stories & Living World rewards',
      'Extra avatars, cosmetics, early access',
      'Premium-only events',
    ],
  },
  {
    tier: SubscriptionTier.PREMIUM_YEARLY,
    name: 'Premium Yearly',
    priceMonthly: 0,
    priceYearly: 79.99,
    features: ['Everything in Premium', '2 months free', 'Bonus 500 credits', 'Early access events'],
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

/** Core design philosophy — fair challenge, cosmetics-only monetization */
export const DESIGN_PHILOSOPHY = {
  motto: 'Easy to start. Difficult to master. Always rewarding.',
  blend: { skill: 0.7, exploration: 0.2, luck: 0.1 },
  rules: [
    'Teach the basics in under 30 seconds.',
    'Ramp challenge with new mechanics — not unfair enemy padding.',
    'Reward skill, exploration, and persistence.',
    'Losses must feel fair and actionable.',
    'Never sell power advantages (no pay-to-win).',
  ],
} as const;

export const AVATAR_CLASSES = [
  'Warrior',
  'Ninja',
  'Explorer',
  'Scientist',
  'Archer',
  'Engineer',
  'Mage',
  'Robot',
  'Space Pilot',
] as const;

export const COMPANION_TYPES = [
  'Mini Dragon',
  'Robot Assistant',
  'Fox',
  'Owl',
  'Spirit Wolf',
  'Floating Crystal',
] as const;

export const CHARACTER_FAMILIES = [
  { id: 'forest-guardians', name: 'Forest Guardians', blurb: 'Wardens of living canopies and glowing groves.' },
  { id: 'crystal-engineers', name: 'Crystal Engineers', blurb: 'Builders who forge tools from singing crystal.' },
  { id: 'sky-nomads', name: 'Sky Nomads', blurb: 'Migratory cities sailing cloud bridges.' },
  { id: 'shadow-hunters', name: 'Shadow Hunters', blurb: 'Silent protectors who strike only when justice fails.' },
  { id: 'ocean-keepers', name: 'Ocean Keepers', blurb: 'Caretakers of reefs, ruins, and tide lore.' },
  { id: 'desert-wanderers', name: 'Desert Wanderers', blurb: 'Caravans that read mirages like maps.' },
] as const;

export const COSMETIC_SLOTS = [
  'hairstyle',
  'clothing',
  'armor',
  'pet',
  'backpack',
  'trail',
  'victory',
  'frame',
  'emote',
  'mount',
  'theme',
  'music',
] as const;

export const LIVING_WORLD_ROTATION = [
  {
    key: 'volcano-reveal',
    title: 'The Ember Breach',
    description: 'A volcano erupts, revealing a new scorched region and rare crystal veins.',
    region: 'Ember Peak',
  },
  {
    key: 'thaw-kingdom',
    title: 'Thaw of the Frozen Crown',
    description: 'A frozen kingdom melts into lakes — new boat routes and drowned ruins open.',
    region: 'Frostreach',
  },
  {
    key: 'comet-quests',
    title: 'Comet of Whispered Quests',
    description: 'A mysterious comet unlocks limited-time story missions across all biomes.',
    region: 'Skyreef Isles',
  },
  {
    key: 'creature-tide',
    title: 'Tide of New Creatures',
    description: 'Rare creatures appear for a limited time — observe, befriend, never pay-to-win.',
    region: 'Tideglass',
  },
  {
    key: 'village-siege',
    title: 'Ashvale Under Siege',
    description: 'Villages are attacked or rebuilt. Cooperative defense events reward cosmetics.',
    region: 'Ashvale',
  },
  {
    key: 'hidden-dungeons',
    title: 'Doors of the Forgotten',
    description: 'Hidden dungeons open beneath ancient temples for the week.',
    region: 'Undercity',
  },
] as const;

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

/** ISO week index for Living World rotation */
export function livingWorldWeekIndex(date = new Date()): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const day = Math.floor((date.getTime() - start) / 86400000);
  return Math.floor(day / 7);
}

export function currentLivingWorldEvent(date = new Date()) {
  const idx = livingWorldWeekIndex(date) % LIVING_WORLD_ROTATION.length;
  return LIVING_WORLD_ROTATION[idx];
}
