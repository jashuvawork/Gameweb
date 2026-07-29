import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const NAMES = ['Kael', 'Nyra', 'Vex', 'Orin', 'Sable', 'Riven', 'Lux', 'Thorn', 'Echo', 'Zara'];
const BIOMES = ['crystal dunes', 'neon jungles', 'ashen peaks', 'tideglass shores', 'void orchards'];
const WEATHER = ['aurora rain', 'static fog', 'ember winds', 'mirror snow', 'plasma storms'];
const QUESTS = [
  'Recover the lost resonance core',
  'Negotiate with the drifting merchants',
  'Seal the rift before midnight pulse',
  'Guide refugees to the floating citadel',
  'Challenge the weather-bound warden',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seedRand(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  dungeonMaster(context: { worldSeed: string; decision?: string; chapter?: number }) {
    const rand = seedRand(context.worldSeed + (context.decision || '') + (context.chapter || 0));
    const biome = BIOMES[Math.floor(rand() * BIOMES.length)];
    const weather = WEATHER[Math.floor(rand() * WEATHER.length)];
    const quest = QUESTS[Math.floor(rand() * QUESTS.length)];
    const boss = `${pick(NAMES)} the ${pick(['Fractured', 'Eternal', 'Hollow', 'Radiant'])} ${pick(['Warden', 'Serpent', 'Colossus', 'Phantom'])}`;
    return {
      narration: `In the ${biome} under ${weather}, destinies shift. Your choice echoes forward — the story never ends.`,
      weather,
      biome,
      quest: { title: quest, reward: { xp: 40 + Math.floor(rand() * 80), loot: pick(['glowblade', 'aether cloak', 'pulse crystal', 'runestone']) } },
      boss: rand() > 0.55 ? { name: boss, hp: 200 + Math.floor(rand() * 400) } : null,
      town: rand() > 0.6 ? { name: `${pick(['New', 'Old', 'Upper', 'Lower'])} ${pick(NAMES)}haven` } : null,
      endless: true,
    };
  }

  companion(memory: string[] = []) {
    const mood = pick(['curious', 'protective', 'wry', 'hopeful']);
    return {
      name: 'Aether',
      mood,
      line: memory.length
        ? `I remember when you ${memory[memory.length - 1]}. Shall we press deeper?`
        : 'I am Aether — your companion across infinite worlds. Where to next?',
      memory,
    };
  }

  npcDialogue(npcName: string, playerMemory: string[] = []) {
    return {
      npc: npcName,
      lines: [
        `Traveler, the kingdoms rewrite themselves each dawn.`,
        playerMemory.length
          ? `Word reached me of your deed: ${playerMemory[0]}.`
          : `Few linger here — the story refuses endings.`,
        `Take this: a clue to a realm not yet born.`,
      ],
      disposition: pick(['friendly', 'cautious', 'grateful', 'mysterious']),
    };
  }

  questGenerator(seed: string) {
    const rand = seedRand(seed);
    return {
      id: `q_${Math.floor(rand() * 1e9)}`,
      title: pick(QUESTS),
      objectives: [
        `Explore the ${pick(BIOMES)}`,
        `Survive ${pick(WEATHER)}`,
        `Return before the next pulse`,
      ],
      dynamic: true,
    };
  }

  storyGenerator(seed: string, chapter: number) {
    return {
      chapter,
      title: `Echoes of Chapter ${chapter}`,
      prose: `Chapter ${chapter} unfolds without conclusion. Every path forks into another horizon. Seed:${seed.slice(0, 8)}`,
      branches: ['Advance into the unknown', 'Aid the new kingdom', 'Hunt the random boss', 'Rest and rewrite fate'],
      ends: false,
    };
  }

  musicPrompt(mood: string) {
    return {
      mood,
      prompt: `Original synthwave ambient loop, ${mood}, dark futuristic neon, no copyrighted melodies, 90 BPM`,
      stems: ['pad', 'bass', 'arpeggio', 'percussion'],
    };
  }

  levelGenerator(seed: string, width = 32, height = 18) {
    const rand = seedRand(seed);
    const map: number[][] = [];
    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) row.push(1);
        else row.push(rand() > 0.82 ? 1 : 0);
      }
      map.push(row);
    }
    return { width, height, map, spawn: { x: 2, y: 2 }, exit: { x: width - 3, y: height - 3 } };
  }

  characterGenerator(seed: string) {
    const rand = seedRand(seed);
    return {
      name: pick(NAMES) + (Math.floor(rand() * 90) + 10),
      class: pick(['Striker', 'Warden', 'Mystic', 'Scout', 'Artificer']),
      traits: [pick(['brave', 'cunning', 'kind', 'reckless']), pick(['lucky', 'focused', 'wild'])],
      palette: ['#00f0ff', '#ff2bd6', '#7cff6b'],
    };
  }

  enemyGenerator(seed: string) {
    const rand = seedRand(seed);
    return {
      name: `${pick(['Neon', 'Void', 'Chrome', 'Pulse'])} ${pick(['Drone', 'Stalker', 'Golem', 'Wisp'])}`,
      hp: 30 + Math.floor(rand() * 120),
      attack: 5 + Math.floor(rand() * 20),
      behavior: pick(['patrol', 'chase', 'ambush', 'swarm']),
    };
  }

  async persist(type: string, content: object, gameId?: string, createdBy?: string, prompt?: string) {
    return this.prisma.aiGeneratedContent.create({
      data: {
        type,
        content: content as never,
        gameId,
        createdBy,
        prompt,
        assets: [],
      },
    });
  }

  async studioGenerate(actorId: string, kind: string, seed: string) {
    const generators: Record<string, () => object> = {
      map: () => this.levelGenerator(seed),
      level: () => this.levelGenerator(seed + '-lvl'),
      character: () => this.characterGenerator(seed),
      enemy: () => this.enemyGenerator(seed),
      dialogue: () => this.npcDialogue(pick(NAMES), []),
      music: () => this.musicPrompt('epic neon'),
      story: () => this.storyGenerator(seed, 1),
      quest: () => this.questGenerator(seed),
      animation: () => ({ frames: 12, style: 'neon-trail', fps: 24 }),
      icon: () => ({ shape: pick(['hex', 'orb', 'blade']), colors: ['#00f0ff', '#0a0a12'] }),
    };
    const fn = generators[kind] || generators.story;
    const content = fn();
    const saved = await this.persist(kind, content, undefined, actorId, seed);
    return { saved, content, aiEnabled: this.config.get('AI_ENABLED') !== 'false' };
  }
}
