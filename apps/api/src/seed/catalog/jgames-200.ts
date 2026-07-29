/**
 * JGames expandable catalog (~200 titles).
 * First 20 Signature Originals are fully playable.
 * Expanded titles fill the premium/credits library toward 200.
 */

import { EXPANDED_TITLES } from './expanded-titles';

export type CatalogGame = {
  slug: string;
  title: string;
  description: string;
  tagline?: string;
  genres: string[];
  tags: string[];
  access: 'FREE' | 'PREMIUM' | 'CREDITS';
  creditCost: number;
  featured?: boolean;
  trending?: boolean;
  endlessStory?: boolean;
  engine: string;
};

export const SIGNATURE_ORIGINALS: CatalogGame[] = [
  {
    slug: 'rise-of-the-forgotten-king',
    title: 'Rise of the Forgotten King',
    description:
      'JGames Original Story Mode. From Ashvale villager to legendary protector — endless chapters, zombie nights, relics, and a kingdom that never ends.',
    tagline: 'Every choice builds your legend. Every battle creates a new future.',
    genres: ['Action', 'RPG', 'Survival', 'Adventure'],
    tags: ['story', 'open-world', 'endless', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    featured: true,
    trending: true,
    endlessStory: true,
    engine: 'canvas',
  },
  {
    slug: 'neon-velocity',
    title: 'Neon Velocity',
    description: 'Race neon cities, floating highways, and space stations with nitro, upgrades, and dynamic weather.',
    genres: ['Racing', 'Arcade', 'Sci-Fi'],
    tags: ['racing', 'neon', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    featured: true,
    trending: true,
    engine: 'canvas',
  },
  {
    slug: 'shadow-assassin',
    title: 'Shadow Assassin',
    description: 'Silent parkour takedowns against corrupt warlords. Stay unseen.',
    genres: ['Action', 'Adventure'],
    tags: ['stealth', 'ninja', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    featured: true,
    engine: 'canvas',
  },
  {
    slug: 'galaxy-hunters',
    title: 'Galaxy Hunters',
    description: 'Captain a crew across galaxies — trade, mine, and battle alien fleets.',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    tags: ['space', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    trending: true,
    engine: 'canvas',
  },
  {
    slug: 'dragon-legacy',
    title: 'Dragon Legacy',
    description: 'Ride dragons, forge alliances, and defend magical kingdoms.',
    genres: ['Fantasy', 'RPG', 'Adventure'],
    tags: ['dragons', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    featured: true,
    engine: 'canvas',
  },
  {
    slug: 'survival-island',
    title: 'Survival Island',
    description: 'Plane crash. Uncharted island. Farm, fish, hunt, and outlast the volcano.',
    genres: ['Survival', 'Simulation'],
    tags: ['survival', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'cyber-detective',
    title: 'Cyber Detective',
    description: 'Solve crimes in a futuristic city with drones, puzzles, and branching cases.',
    genres: ['Puzzle', 'Adventure'],
    tags: ['mystery', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'wild-frontier',
    title: 'Wild Frontier',
    description: 'Build a western town, ride hard, and duel bandits for gold.',
    genres: ['Adventure', 'Action', 'Simulation'],
    tags: ['western', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'kingdom-builders',
    title: 'Kingdom Builders',
    description: 'Grow a settlement into an empire with economy, diplomacy, and armies.',
    genres: ['Strategy', 'Simulation'],
    tags: ['empire', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    trending: true,
    engine: 'canvas',
  },
  {
    slug: 'ocean-explorer',
    title: 'Ocean Explorer',
    description: 'Dive for temples, treasures, and hidden civilizations beneath the waves.',
    genres: ['Adventure', 'Simulation'],
    tags: ['ocean', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'zombie-frontier',
    title: 'Zombie Frontier',
    description: 'Cross abandoned cities, rescue survivors, and rebuild civilization.',
    genres: ['Survival', 'Action', 'Horror'],
    tags: ['zombies', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    trending: true,
    engine: 'canvas',
  },
  {
    slug: 'monster-arena',
    title: 'Monster Arena',
    description: 'Train original creatures, evolve skills, and climb tournament ranks.',
    genres: ['RPG', 'Strategy', 'Sports'],
    tags: ['creatures', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'ninja-legends',
    title: 'Ninja Legends',
    description: 'Master fire, water, wind, earth, and lightning ninja styles.',
    genres: ['Action', 'RPG', 'Fantasy'],
    tags: ['ninja', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'speed-legends',
    title: 'Speed Legends',
    description: 'Global street-legal leagues with tuning, weather, and championships.',
    genres: ['Racing', 'Sports'],
    tags: ['cars', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'pirate-seas',
    title: 'Pirate Seas',
    description: 'Captain your ship, chart treasure maps, and clash with rival fleets.',
    genres: ['Adventure', 'Action', 'Strategy'],
    tags: ['pirates', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    featured: true,
    engine: 'canvas',
  },
  {
    slug: 'robot-wars',
    title: 'Robot Wars',
    description: 'Assemble modular combat mechs for PvE missions and arena bosses.',
    genres: ['Sci-Fi', 'Action'],
    tags: ['mechs', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'ancient-temple',
    title: 'Ancient Temple',
    description: 'Solve traps and physics puzzles to uncover legendary artifacts.',
    genres: ['Puzzle', 'Adventure'],
    tags: ['temple', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'battle-command',
    title: 'Battle Command',
    description: 'Command infantry, armor, air, and fleets across continents.',
    genres: ['Strategy', 'Action'],
    tags: ['tactics', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    engine: 'canvas',
  },
  {
    slug: 'sky-kingdom',
    title: 'Sky Kingdom',
    description: 'Build floating cities and defend them from sky pirates.',
    genres: ['Fantasy', 'Strategy', 'Adventure'],
    tags: ['sky', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    trending: true,
    engine: 'canvas',
  },
  {
    slug: 'infinity-arena',
    title: 'Infinity Arena',
    description: 'Every cleared room generates a new world — endless enemies, quests, and bosses.',
    genres: ['Action', 'RPG', 'Adventure'],
    tags: ['endless', 'procedural', 'original'],
    access: 'PREMIUM',
    creditCost: 0,
    featured: true,
    trending: true,
    endlessStory: true,
    engine: 'canvas',
  },
];

function toSlug(title: string, index: number) {
  const base = title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `jg-${base || `title-${index}`}`;
}

/** Build expandable premium/credits titles (target 160 → total catalog ~200 with classics + signatures). */
export function buildExpandedCatalog(existingFreeSlugs: string[]): CatalogGame[] {
  const out: CatalogGame[] = [];
  const used = new Set(existingFreeSlugs);

  for (const g of SIGNATURE_ORIGINALS) {
    used.add(g.slug);
    out.push(g);
  }

  let i = 0;
  for (const t of EXPANDED_TITLES) {
    if (out.length >= 180) break; // 20 signatures + 160 expanded
    i += 1;
    let slug = t.slug || toSlug(t.title, i);
    if (used.has(slug)) slug = `${slug}-${i}`;
    used.add(slug);
    const access = i % 5 === 0 ? 'CREDITS' : 'PREMIUM';
    out.push({
      slug,
      title: t.title,
      description: t.description,
      tagline: t.tagline || (t.endlessStory ? 'The story never finishes' : 'Play Forever.'),
      genres: t.genres,
      tags: [...t.tags, 'jgames', 'expandable'],
      access,
      creditCost: access === 'CREDITS' ? 25 + (i % 5) * 15 : 0,
      featured: i <= 8,
      trending: i <= 20,
      endlessStory: !!t.endlessStory,
      engine: 'canvas',
    });
  }

  return out;
}

export const JGAMES_TARGET_COUNT = 200;

export function expectedSeedTotal(classicCount: number) {
  return classicCount + buildExpandedCatalog([]).length;
}
