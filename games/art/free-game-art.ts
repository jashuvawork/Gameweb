/** Per-game art packs — unique chapter + character + UI skins for free tier */

export const FREE_GAME_CHARACTERS = ['warrior', 'explorer', 'ninja', 'pilot'] as const;
export type FreeGameCharacter = (typeof FREE_GAME_CHARACTERS)[number];

export type GameArtPack = {
  slug: string;
  title: string;
  accent: string;
  accent2: string;
  cover: string;
  chapters: { id: number; title: string; blurb: string; image: string }[];
  characters: { id: FreeGameCharacter; label: string; image: string }[];
  ui: {
    hud: string;
    pause: string;
    chapterSelect: string;
    victory: string;
    characterSelect: string;
  };
};

const CHAPTER_TITLES: Record<string, string[]> = {
  default: ['Awakening', 'Rising Heat', 'Hidden Path', 'Storm Gate', 'Final Pulse'],
  racing: ['Green Light', 'Mid City', 'Night Drift', 'Championship Heat', 'Legend Lap'],
  puzzle: ['First Glyph', 'Shifting Floor', 'Mirror Vault', 'Cipher Peak', 'Master Lock'],
  action: ['Contact', 'Breach', 'Ambush', 'Overdrive', 'Last Stand'],
  adventure: ['Trailhead', 'Deep Canopy', 'Lost Camp', 'Relic Hall', 'Crown Chamber'],
};

function titlesFor(slug: string): string[] {
  if (['neon-drift', 'desert-rally', 'mountain-racer', 'street-sprint'].includes(slug)) return CHAPTER_TITLES.racing;
  if (['ancient-temple', 'number-master', 'logic-blocks', 'memory-match', 'color-bus-trip', 'traffic-color-sort'].includes(slug))
    return CHAPTER_TITLES.puzzle;
  if (['zombie-escape', 'shadow-ninja', 'alien-attack', 'robot-arena'].includes(slug)) return CHAPTER_TITLES.action;
  if (['jungle-explorer', 'treasure-hunter', 'lost-kingdom', 'crystal-quest', 'frost-outpost'].includes(slug))
    return CHAPTER_TITLES.adventure;
  return CHAPTER_TITLES.default;
}

const META: { slug: string; title: string; accent: string; accent2: string; blurbs: string[] }[] = [
  { slug: 'pixel-runner', title: 'Pixel Runner', accent: '#00f0ff', accent2: '#ff2bd6', blurbs: ['Neon alleys open.', 'Rooftops ignite.', 'Secret lanes.', 'Storm dash.', 'Skyline finale.'] },
  { slug: 'galaxy-defender', title: 'Galaxy Defender', accent: '#7aa2ff', accent2: '#c084fc', blurbs: ['First contact.', 'Fleet breach.', 'Crystal cache.', 'Void siege.', 'Starfall.'] },
  { slug: 'brick-blast', title: 'Brick Blast', accent: '#ff2bd6', accent2: '#ffc857', blurbs: ['Soft walls.', 'Gold bricks.', 'Ricochet maze.', 'Prism storm.', 'Core shatter.'] },
  { slug: 'snake-evolution', title: 'Snake Evolution', accent: '#7cff6b', accent2: '#00f0ff', blurbs: ['Hatch.', 'Hunt.', 'Relic coil.', 'Mutate.', 'Apex form.'] },
  { slug: 'neon-drift', title: 'Neon Drift', accent: '#ff2bd6', accent2: '#00f0ff', blurbs: ['Warm tires.', 'Rain lines.', 'Shortcut.', 'Rival pack.', 'Crown drift.'] },
  { slug: 'desert-rally', title: 'Desert Rally', accent: '#ffc857', accent2: '#ff6b4a', blurbs: ['Dune start.', 'Mirage heat.', 'Oasis pit.', 'Sandstorm.', 'Finish ridge.'] },
  { slug: 'mountain-racer', title: 'Mountain Racer', accent: '#7aa2ff', accent2: '#e8f7ff', blurbs: ['Base camp.', 'Ice shelf.', 'Cliff pass.', 'Summit wind.', 'Peak crown.'] },
  { slug: 'street-sprint', title: 'Street Sprint', accent: '#a3ff12', accent2: '#00f0ff', blurbs: ['Block one.', 'Alley weave.', 'Night market.', 'Highway on.', 'City champ.'] },
  { slug: 'ancient-temple', title: 'Ancient Temple', accent: '#ffc857', accent2: '#ff2bd6', blurbs: ['Outer gate.', 'Trap hall.', 'Relic room.', 'Mirror crypt.', 'Heart stone.'] },
  { slug: 'number-master', title: 'Number Master', accent: '#00f0ff', accent2: '#a78bfa', blurbs: ['Twos.', 'Fours.', 'Surge.', '2048.', 'Beyond.'] },
  { slug: 'logic-blocks', title: 'Logic Blocks', accent: '#c084fc', accent2: '#ffc857', blurbs: ['First pattern.', 'False colors.', 'Cipher.', 'Echo match.', 'Perfect lock.'] },
  { slug: 'memory-match', title: 'Memory Match', accent: '#34d399', accent2: '#ff2bd6', blurbs: ['Soft recall.', 'Twin sigils.', 'Fog board.', 'Flash clear.', 'Master mind.'] },
  { slug: 'zombie-escape', title: 'Zombie Escape', accent: '#7cff6b', accent2: '#ff4d4d', blurbs: ['Outbreak.', 'Barricade.', 'Night wave.', 'Hero card.', 'Dawn hold.'] },
  { slug: 'shadow-ninja', title: 'Shadow Ninja', accent: '#ff2bd6', accent2: '#7aa2ff', blurbs: ['Silent yard.', 'Roof hunt.', 'Smoke veil.', 'Clan mark.', 'Shadow lord.'] },
  { slug: 'alien-attack', title: 'Alien Attack', accent: '#a78bfa', accent2: '#a3ff12', blurbs: ['Drop pods.', 'Hive line.', 'Acid rain.', 'Queen call.', 'Clear skies.'] },
  { slug: 'robot-arena', title: 'Robot Arena', accent: '#ffc857', accent2: '#00f0ff', blurbs: ['Boot up.', 'Sparks.', 'Boss frame.', 'Overclock.', 'Arena king.'] },
  { slug: 'jungle-explorer', title: 'Jungle Explorer', accent: '#a3ff12', accent2: '#ffc857', blurbs: ['Canopy edge.', 'River fork.', 'Idol hut.', 'Hidden chamber.', 'Green crown.'] },
  { slug: 'treasure-hunter', title: 'Treasure Hunter', accent: '#ffc857', accent2: '#00f0ff', blurbs: ['Map scrap.', 'Trap vault.', 'Gold tide.', 'Cursed chest.', 'Fortune.'] },
  { slug: 'lost-kingdom', title: 'Lost Kingdom', accent: '#c084fc', accent2: '#ffc857', blurbs: ['Ruined gate.', 'Throne dust.', 'Ghost court.', 'Crown shard.', 'Reclaimed.'] },
  { slug: 'crystal-quest', title: 'Crystal Quest', accent: '#00f0ff', accent2: '#c084fc', blurbs: ['Cave mouth.', 'Glow lake.', 'Resonance.', 'Crystal heart.', 'Song end.'] },
  { slug: 'color-bus-trip', title: 'Color Bus Trip', accent: '#ff4d6d', accent2: '#4cc9f0', blurbs: ['First bay.', 'Mixed queue.', 'Rush hour.', 'Rainbow depot.', 'Master lot.'] },
  { slug: 'frost-outpost', title: 'Frost Outpost', accent: '#6ec3ff', accent2: '#ff7a18', blurbs: ['Campfire.', 'Conveyor.', 'Blizzard.', 'Deep freeze.', 'Warm crown.'] },
  { slug: 'traffic-color-sort', title: 'Traffic Color Sort', accent: '#70e000', accent2: '#ffd60a', blurbs: ['Green light.', 'Jam ahead.', 'Merge maze.', 'Night exit.', 'Clear roads.'] },
  { slug: 'belt-kitchen', title: 'Belt Kitchen', accent: '#fb7185', accent2: '#fbbf24', blurbs: ['Prep line.', 'Heat up.', 'Rush ticket.', 'Double shift.', 'Head chef.'] },
];

export const GAME_ART_PACKS: Record<string, GameArtPack> = Object.fromEntries(
  META.map((g) => {
    const chTitles = titlesFor(g.slug);
    const pack: GameArtPack = {
      slug: g.slug,
      title: g.title,
      accent: g.accent,
      accent2: g.accent2,
      cover: `/game-art/${g.slug}/cover.svg`,
      chapters: [1, 2, 3, 4, 5].map((id) => ({
        id,
        title: chTitles[id - 1],
        blurb: g.blurbs[id - 1],
        image: `/game-art/${g.slug}/chapter-${id}.svg`,
      })),
      characters: FREE_GAME_CHARACTERS.map((id) => ({
        id,
        label: id[0].toUpperCase() + id.slice(1),
        image: `/game-art/${g.slug}/char-${id}.svg`,
      })),
      ui: {
        hud: `/game-art/${g.slug}/ui-hud.svg`,
        pause: `/game-art/${g.slug}/ui-pause.svg`,
        chapterSelect: `/game-art/${g.slug}/ui-chapter-select.svg`,
        victory: `/game-art/${g.slug}/ui-victory.svg`,
        characterSelect: `/game-art/${g.slug}/ui-character-select.svg`,
      },
    };
    return [g.slug, pack];
  }),
);

export function getGameArt(slug: string): GameArtPack | null {
  return GAME_ART_PACKS[slug] || null;
}
