/**
 * JGames Original Story Mode
 * Rise of the Forgotten King — Endless Story
 * Original JASHUVA GAMES content. No copyrighted assets.
 */
import {
  type GameFactory,
  type EngineContext,
  clearNeon,
  bumpScore,
  clamp,
  rand,
} from '../engine/core';
import { createDifficulty, recordOutcome, mechanicTier, shouldOfferAssist, consumeAssist } from '../engine/fair-play';

type Vec = { x: number; y: number };
type Entity = Vec & { hp: number; kind: string; r?: number; spd?: number };

const CHAPTERS = [
  {
    id: 1,
    title: 'The Silent Village',
    line: 'Ashvale sleeps between mountains. Arin dreams of a better dawn.',
    goal: 'Gather 20 wood & talk to the Chief',
  },
  {
    id: 2,
    title: 'Building a Legend',
    line: 'Repair homes. Protect farms. Earn the villagers’ trust.',
    goal: 'Repair 5 houses & defeat 8 wolves',
  },
  {
    id: 3,
    title: 'Rise of the Chief',
    line: 'The Chief’s Staff is yours. Expand Ashvale into a town.',
    goal: 'Build 3 defenses & recruit 4 guards',
  },
  {
    id: 4,
    title: 'The Dark Night',
    line: 'Green mist rises. The first undead claw into the world.',
    goal: 'Survive the first night (kill 15 zombies)',
  },
  {
    id: 5,
    title: 'The Last Safe Village',
    line: 'Fortify Ashvale. Every sunrise is a victory.',
    goal: 'Raise walls to 100% & hold 3 waves',
  },
  {
    id: 6,
    title: 'Beyond Survival',
    line: 'Ancient relics awaken. Choose your fighting style.',
    goal: 'Collect 3 relics & unlock a skill',
  },
  {
    id: 7,
    title: 'Unite the Kingdom',
    line: 'Refugees arrive. Your village becomes a kingdom.',
    goal: 'Rescue 10 survivors & open a trade route',
  },
  {
    id: 8,
    title: 'The Endless World',
    line: 'Deserts, volcanoes, floating isles — the map never ends.',
    goal: 'Explore 4 biomes',
  },
  {
    id: 9,
    title: 'Endless Story',
    line: 'There is no final boss. Only the next frontier.',
    goal: 'Complete a procedural frontier run',
  },
];

const RELICS = ['Thunder Strike', 'Fire Blade', 'Ice Shield', 'Shadow Dash', 'Healing Aura', 'Earthquake Slam'];
const BIOMES = ['Ashvale', 'Crystal Dunes', 'Frostreach', 'Ember Peak', 'Skyreef Isles', 'Undercity', 'Tideglass', 'Void Orchard'];

function dist(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export const riseOfTheForgottenKing: GameFactory = () => {
  let chapter = 1;
  let frontier = 1;
  let hero: Entity & {
    stamina: number;
    hunger: number;
    wood: number;
    food: number;
    stone: number;
    xp: number;
    level: number;
    facing: number;
    invuln: number;
    skills: string[];
  };
  let enemies: Entity[] = [];
  let houses: (Vec & { repaired: boolean })[] = [];
  let walls = 0;
  let guards = 0;
  let defenses = 0;
  let wolvesKilled = 0;
  let zombiesKilled = 0;
  let survivors = 0;
  let relics = 0;
  let biomesSeen = new Set<string>(['Ashvale']);
  let wavesHeld = 0;
  let day = 0;
  let timeOfDay = 0.25; // 0 night → 1 day cycle
  let weather = 'clear';
  let message = '';
  let messageT = 0;
  let attackCd = 0;
  let particles: { x: number; y: number; life: number; c: string }[] = [];
  let questDone = false;
  let tradeRoutes = 0;
  let gender = Math.random() > 0.5 ? 'Arin' : 'Arya';
  let difficulty = createDifficulty();
  let assistActive = false;

  const resetHero = () => {
    hero = {
      x: 0.5,
      y: 0.55,
      hp: 100,
      kind: 'hero',
      stamina: 100,
      hunger: 100,
      wood: 0,
      food: 5,
      stone: 0,
      xp: 0,
      level: 1,
      facing: 0,
      invuln: 0,
      skills: [],
    };
  };

  const resetWorld = () => {
    resetHero();
    enemies = [];
    houses = Array.from({ length: 6 }, (_, i) => ({
      x: 0.18 + (i % 3) * 0.22,
      y: 0.32 + Math.floor(i / 3) * 0.18,
      repaired: false,
    }));
    walls = 0;
    guards = 0;
    defenses = 0;
    wolvesKilled = 0;
    zombiesKilled = 0;
    survivors = 0;
    relics = 0;
    biomesSeen = new Set(['Ashvale']);
    wavesHeld = 0;
    day = 1;
    timeOfDay = 0.35;
    weather = 'clear';
    message = `${gender} awakens in Ashvale. ${CHAPTERS[0].line}`;
    messageT = 5;
    attackCd = 0;
    particles = [];
    questDone = false;
    tradeRoutes = 0;
    chapter = 1;
    frontier = 1;
  };

  resetWorld();

  const toast = (t: string) => {
    message = t;
    messageT = 4;
  };

  const chapterMeta = () => CHAPTERS[Math.min(chapter, 9) - 1] || CHAPTERS[8];

  const spawnEnemy = (kind: string) => {
    const edge = Math.floor(rand(0, 4));
    const pos =
      edge === 0
        ? { x: rand(0.05, 0.95), y: 0.08 }
        : edge === 1
          ? { x: rand(0.05, 0.95), y: 0.92 }
          : edge === 2
            ? { x: 0.05, y: rand(0.1, 0.9) }
            : { x: 0.95, y: rand(0.1, 0.9) };
    const baseHp = kind === 'zombie' ? 28 + chapter * 4 + frontier * 2 : kind === 'mutant' ? 55 + frontier * 6 : 18 + chapter * 2;
    const tier = mechanicTier(difficulty.scale);
    const hpMul = difficulty.scale * (tier === 'intro' ? 0.85 : tier === 'legend' ? 1.1 : 1);
    enemies.push({
      ...pos,
      hp: Math.max(8, Math.floor(baseHp * hpMul)),
      kind,
      r: kind === 'mutant' ? 16 : 11,
      spd:
        (kind === 'wolf' ? 0.18 : kind === 'mutant' ? 0.12 : 0.1 + Math.min(0.08, frontier * 0.004)) *
        (tier === 'mastery' || tier === 'legend' ? 1.08 : 1) *
        (assistActive ? 0.85 : 1),
    });
  };

  const checkChapterAdvance = (ctx: EngineContext) => {
    if (questDone) return;
    let ok = false;
    switch (chapter) {
      case 1:
        ok = hero.wood >= 20;
        break;
      case 2:
        ok = houses.filter((h) => h.repaired).length >= 5 && wolvesKilled >= 8;
        break;
      case 3:
        ok = defenses >= 3 && guards >= 4;
        break;
      case 4:
        ok = zombiesKilled >= 15;
        break;
      case 5:
        ok = walls >= 100 && wavesHeld >= 3;
        break;
      case 6:
        ok = relics >= 3 && hero.skills.length >= 1;
        break;
      case 7:
        ok = survivors >= 10 && tradeRoutes >= 1;
        break;
      case 8:
        ok = biomesSeen.size >= 4;
        break;
      default:
        ok = zombiesKilled >= 12 + frontier * 3;
        break;
    }
    if (!ok) return;
    questDone = true;
    bumpScore(ctx, 250 + chapter * 50);
    hero.xp += 80;
    if (chapter < 9) {
      chapter += 1;
      questDone = false;
      toast(`Chapter ${chapter}: ${chapterMeta().title}`);
      if (chapter === 3) toast('The Chief places the Staff in your hands. You are Chief now.');
      if (chapter === 4) {
        weather = 'storm';
        toast('The earth shakes. Green mist pours from the ruins…');
      }
    } else {
      frontier += 1;
      questDone = false;
      zombiesKilled = 0;
      const biome = BIOMES[Math.floor(rand(0, BIOMES.length))];
      biomesSeen.add(biome);
      weather = ['clear', 'rain', 'storm', 'ash', 'aurora'][Math.floor(rand(0, 5))];
      toast(`Endless Frontier ${frontier}: ${biome} — ${chapterMeta().line}`);
      bumpScore(ctx, 400);
    }
    while (hero.xp >= hero.level * 100) {
      hero.xp -= hero.level * 100;
      hero.level += 1;
      hero.hp = Math.min(100, hero.hp + 20);
      toast(`Level ${hero.level}! ${gender}'s legend grows.`);
    }
  };

  const trySkill = () => {
    if (relics < 1 || hero.skills.length >= 3) return;
    const pool = RELICS.filter((r) => !hero.skills.includes(r));
    if (!pool.length) return;
    const skill = pool[Math.floor(Math.random() * pool.length)];
    hero.skills.push(skill);
    toast(`Relic power unlocked: ${skill}`);
  };

  return {
    update(ctx) {
      if (!ctx.alive) {
        if (ctx.keys.has('r')) {
          ctx.keys.delete('r');
          ctx.alive = true;
          ctx.score = Math.max(0, ctx.score * 0.35);
          if (shouldOfferAssist(difficulty)) {
            difficulty = consumeAssist(difficulty);
            assistActive = true;
            toast('Companion assist: foes slowed. Learn the pattern — fair fight.');
          } else {
            assistActive = false;
            toast(`${gender} rises wiser. Watch tells. Press into the next try.`);
          }
          resetHero();
          enemies = [];
          hero.hp = 100;
          hero.hunger = 80;
        }
        return;
      }

      const dt = ctx.dt;
      timeOfDay = (timeOfDay + dt * 0.035) % 1;
      if (timeOfDay < 0.02) {
        day += 1;
        toast(`Day ${day} — Ashvale still stands.`);
      }
      messageT = Math.max(0, messageT - dt);
      attackCd = Math.max(0, attackCd - dt);
      hero.invuln = Math.max(0, hero.invuln - dt);
      hero.hunger = Math.max(0, hero.hunger - dt * 1.2);
      if (hero.hunger <= 0) hero.hp -= dt * 4;
      hero.stamina = Math.min(100, hero.stamina + dt * 12);

      // Movement
      let mx = 0;
      let my = 0;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) mx -= 1;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) mx += 1;
      if (ctx.keys.has('w') || ctx.keys.has('arrowup')) my -= 1;
      if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) my += 1;
      const sprint = ctx.keys.has('shift') && hero.stamina > 5;
      const speed = (sprint ? 0.42 : 0.28) * (hero.skills.includes('Shadow Dash') ? 1.15 : 1);
      if (sprint) hero.stamina -= dt * 28;
      if (mx || my) {
        const len = Math.hypot(mx, my) || 1;
        hero.x = clamp(hero.x + (mx / len) * speed * dt, 0.04, 0.96);
        hero.y = clamp(hero.y + (my / len) * speed * dt, 0.08, 0.94);
        hero.facing = Math.atan2(my, mx);
      }

      // Pointer aim
      if (ctx.pointer.x || ctx.pointer.y) {
        hero.facing = Math.atan2(ctx.pointer.y / ctx.height - hero.y, ctx.pointer.x / ctx.width - hero.x);
      }

      // Actions
      if (ctx.keys.has('e')) {
        ctx.keys.delete('e');
        // Gather / repair / build / eat
        if (hero.hunger < 70 && hero.food > 0) {
          hero.food -= 1;
          hero.hunger = Math.min(100, hero.hunger + 35);
          toast('Rested by the fire. Hunger restored.');
        } else if (chapter <= 2) {
          hero.wood += 2 + Math.floor(Math.random() * 3);
          if (Math.random() > 0.6) hero.food += 1;
          bumpScore(ctx, 5);
          toast(`Gathered supplies. Wood ${hero.wood}`);
          const near = houses.find((h) => !h.repaired && dist(h, hero) < 0.1);
          if (near && hero.wood >= 5) {
            near.repaired = true;
            hero.wood -= 5;
            toast('House repaired. Villagers cheer.');
            bumpScore(ctx, 40);
          }
        } else if (chapter === 3) {
          if (hero.wood >= 8 && defenses < 8) {
            hero.wood -= 8;
            defenses += 1;
            toast(`Defense built (${defenses}/3+)`);
            bumpScore(ctx, 30);
          } else if (hero.food >= 2 && guards < 10) {
            hero.food -= 2;
            guards += 1;
            toast(`Guard recruited (${guards})`);
            bumpScore(ctx, 25);
          } else {
            hero.wood += 3;
            hero.stone += 2;
          }
        } else if (chapter >= 5 && walls < 100) {
          if (hero.stone >= 3 || hero.wood >= 4) {
            if (hero.stone >= 3) hero.stone -= 3;
            else hero.wood -= 4;
            walls = Math.min(100, walls + 12);
            toast(`Walls ${walls}%`);
            bumpScore(ctx, 20);
          } else {
            hero.stone += 2;
            hero.wood += 2;
          }
        } else if (chapter >= 6 && relics < 6 && Math.random() > 0.4) {
          relics += 1;
          toast(`Relic found (${relics}/3+)`);
          bumpScore(ctx, 60);
          if (relics >= 3) trySkill();
        } else if (chapter >= 7) {
          survivors += 1;
          toast(`Survivor sheltered (${survivors})`);
          bumpScore(ctx, 35);
          if (survivors >= 5 && tradeRoutes < 1) {
            tradeRoutes = 1;
            toast('Trade route established!');
          }
        } else {
          hero.wood += 2;
          hero.stone += 1;
          if (chapter >= 8) {
            const b = BIOMES[Math.floor(rand(0, BIOMES.length))];
            biomesSeen.add(b);
            toast(`Explored ${b}`);
          }
        }
      }

      // Attack
      if ((ctx.keys.has(' ') || ctx.pointer.down) && attackCd <= 0 && hero.stamina > 8) {
        attackCd = hero.skills.includes('Fire Blade') ? 0.22 : 0.32;
        hero.stamina -= 8;
        const range = hero.skills.includes('Thunder Strike') ? 0.14 : 0.1;
        let hit = false;
        for (const e of enemies) {
          if (dist(e, hero) < range) {
            let dmg = 12 + hero.level * 2;
            if (hero.skills.includes('Fire Blade')) dmg *= 1.35;
            if (hero.skills.includes('Earthquake Slam')) dmg *= 1.2;
            e.hp -= dmg;
            hit = true;
            particles.push({ x: e.x, y: e.y, life: 0.35, c: '#ffc857' });
            if (e.hp <= 0) {
              if (e.kind === 'wolf') wolvesKilled += 1;
              if (e.kind === 'zombie' || e.kind === 'mutant') zombiesKilled += 1;
              bumpScore(ctx, e.kind === 'mutant' ? 40 : 15);
              hero.xp += 8;
              if (Math.random() > 0.7) hero.food += 1;
            }
          }
        }
        if (hero.skills.includes('Healing Aura') && hit) hero.hp = Math.min(100, hero.hp + 3);
        if (!hit && chapter <= 2) {
          // swing at air still gathers a little
          hero.wood += 1;
        }
      }

      // Skill Q
      if (ctx.keys.has('q') && hero.skills.length) {
        ctx.keys.delete('q');
        const skill = hero.skills[Math.floor(Math.random() * hero.skills.length)];
        if (skill === 'Ice Shield') {
          hero.invuln = 2.2;
          toast('Ice Shield!');
        } else if (skill === 'Healing Aura') {
          hero.hp = Math.min(100, hero.hp + 25);
          toast('Healing Aura!');
        } else if (skill === 'Thunder Strike') {
          enemies.forEach((e) => {
            if (dist(e, hero) < 0.22) e.hp -= 30;
          });
          toast('Thunder Strike!');
        } else if (skill === 'Shadow Dash') {
          hero.x = clamp(hero.x + Math.cos(hero.facing) * 0.15, 0.04, 0.96);
          hero.y = clamp(hero.y + Math.sin(hero.facing) * 0.15, 0.08, 0.94);
          hero.invuln = 0.4;
        } else {
          enemies.forEach((e) => {
            if (dist(e, hero) < 0.18) e.hp -= 22;
          });
          toast(`${skill}!`);
        }
        bumpScore(ctx, 10);
      }

      // Spawns by chapter
      const night = timeOfDay < 0.3 || timeOfDay > 0.78;
      const spawnRate =
        chapter <= 2 ? 0.015 : chapter === 3 ? 0.02 : chapter === 4 ? 0.04 : night ? 0.055 + frontier * 0.004 : 0.02;
      if (Math.random() < spawnRate) {
        if (chapter <= 3) spawnEnemy('wolf');
        else if (chapter === 4) spawnEnemy(Math.random() > 0.3 ? 'zombie' : 'wolf');
        else spawnEnemy(Math.random() > 0.85 ? 'mutant' : 'zombie');
      }

      // Enemy AI
      for (const e of enemies) {
        const dx = hero.x - e.x;
        const dy = hero.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        const slow = walls > 50 && d > 0.2 ? 0.7 : 1;
        e.x += (dx / d) * (e.spd || 0.1) * slow * dt;
        e.y += (dy / d) * (e.spd || 0.1) * slow * dt;
        if (d < 0.045 && hero.invuln <= 0) {
          let dmg = e.kind === 'mutant' ? 18 : e.kind === 'zombie' ? 12 : 8;
          if (hero.skills.includes('Ice Shield') && hero.invuln > 0) dmg *= 0.2;
          hero.hp -= dmg;
          hero.invuln = 0.55;
          if (guards > 0 && Math.random() > 0.6) {
            e.hp -= 10;
            toast('Guards strike back!');
          }
        }
      }
      enemies = enemies.filter((e) => e.hp > 0);

      // Wave hold tracking at night
      if (chapter >= 5 && night && enemies.length === 0 && Math.random() < 0.01) {
        wavesHeld += 1;
        toast(`Wave held! (${wavesHeld}/3)`);
      }

      particles = particles.filter((p) => {
        p.life -= dt;
        return p.life > 0;
      });

      checkChapterAdvance(ctx);

      if (hero.hp <= 0) {
        ctx.alive = false;
        difficulty = recordOutcome(difficulty, false);
        toast(`${gender} falls… but the loss is fair. Press R — try a new approach.`);
        ctx.onGameOver?.(Math.floor(ctx.score));
      }
    },

    draw(ctx) {
      const night = timeOfDay < 0.28 || timeOfDay > 0.78;
      clearNeon(ctx, night ? '#05080c' : '#0a1210', night ? '#0a1018' : '#142018');

      // Ground / village ring
      ctx.ctx.strokeStyle = 'rgba(0,240,255,0.15)';
      ctx.ctx.beginPath();
      ctx.ctx.arc(ctx.width * 0.5, ctx.height * 0.55, Math.min(ctx.width, ctx.height) * 0.32, 0, Math.PI * 2);
      ctx.ctx.stroke();

      // Walls
      if (walls > 0) {
        ctx.ctx.strokeStyle = `rgba(180,200,220,${0.2 + walls / 200})`;
        ctx.ctx.lineWidth = 2 + walls / 40;
        ctx.ctx.beginPath();
        ctx.ctx.arc(ctx.width * 0.5, ctx.height * 0.55, Math.min(ctx.width, ctx.height) * 0.34, 0, Math.PI * 2);
        ctx.ctx.stroke();
        ctx.ctx.lineWidth = 1;
      }

      // Houses
      for (const h of houses) {
        ctx.ctx.fillStyle = h.repaired ? 'rgba(0,240,255,0.35)' : 'rgba(255,255,255,0.08)';
        ctx.ctx.fillRect(h.x * ctx.width - 14, h.y * ctx.height - 10, 28, 20);
      }

      // Enemies
      for (const e of enemies) {
        ctx.ctx.fillStyle = e.kind === 'wolf' ? '#a78bfa' : e.kind === 'mutant' ? '#7cff6b' : '#5ce88a';
        ctx.ctx.beginPath();
        ctx.ctx.arc(e.x * ctx.width, e.y * ctx.height, e.r || 10, 0, Math.PI * 2);
        ctx.ctx.fill();
      }

      // Particles
      for (const p of particles) {
        ctx.ctx.globalAlpha = Math.max(0, p.life * 2);
        ctx.ctx.fillStyle = p.c;
        ctx.ctx.fillRect(p.x * ctx.width, p.y * ctx.height, 4, 4);
        ctx.ctx.globalAlpha = 1;
      }

      // Hero
      ctx.ctx.fillStyle = hero.invuln > 0 ? '#ffc857' : '#00f0ff';
      ctx.ctx.beginPath();
      ctx.ctx.arc(hero.x * ctx.width, hero.y * ctx.height, 12, 0, Math.PI * 2);
      ctx.ctx.fill();
      ctx.ctx.strokeStyle = '#ff2bd6';
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(hero.x * ctx.width, hero.y * ctx.height);
      ctx.ctx.lineTo(hero.x * ctx.width + Math.cos(hero.facing) * 22, hero.y * ctx.height + Math.sin(hero.facing) * 22);
      ctx.ctx.stroke();

      // HUD
      const bar = (label: string, v: number, y: number, color: string) => {
        ctx.ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.ctx.fillRect(12, y, 140, 12);
        ctx.ctx.fillStyle = color;
        ctx.ctx.fillRect(12, y, 140 * clamp(v / 100, 0, 1), 12);
        ctx.ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.ctx.font = '10px Sora, sans-serif';
        ctx.ctx.fillText(`${label} ${Math.floor(v)}`, 16, y + 10);
      };
      bar('HP', hero.hp, 10, '#ff2bd6');
      bar('STA', hero.stamina, 26, '#00f0ff');
      bar('HUN', hero.hunger, 42, '#ffc857');

      ctx.ctx.fillStyle = 'rgba(232,247,255,0.85)';
      ctx.ctx.font = '11px Sora, sans-serif';
      ctx.ctx.fillText(
        `Ch ${Math.min(chapter, 9)} · ${chapterMeta().title} · Lv ${hero.level} · Score ${Math.floor(ctx.score)}`,
        160,
        20,
      );
      ctx.ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.ctx.fillText(
        `Wood ${hero.wood}  Food ${hero.food}  Stone ${hero.stone}  Walls ${walls}%  Guards ${guards}  Relics ${relics}`,
        160,
        38,
      );
      ctx.ctx.fillText(`Goal: ${chapterMeta().goal}`, 160, 54);
      if (hero.skills.length) ctx.ctx.fillText(`Skills: ${hero.skills.join(' · ')} (Q)`, 160, 70);

      // Story banner
      if (messageT > 0) {
        ctx.ctx.fillStyle = 'rgba(5,8,12,0.72)';
        ctx.ctx.fillRect(ctx.width * 0.1, ctx.height - 56, ctx.width * 0.8, 40);
        ctx.ctx.fillStyle = '#7cff6b';
        ctx.ctx.font = '12px Sora, sans-serif';
        ctx.ctx.fillText(message.slice(0, 90), ctx.width * 0.12, ctx.height - 32);
      }

      ctx.ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.ctx.font = '11px Sora, sans-serif';
      ctx.ctx.fillText('WASD move · SPACE/click attack · E interact · Q skill · Shift sprint · R restart', 12, ctx.height - 10);

      if (!ctx.alive) {
        ctx.ctx.fillStyle = 'rgba(255,43,214,0.9)';
        ctx.ctx.font = '700 26px Orbitron, sans-serif';
        ctx.ctx.fillText('THE LEGEND PAUSES', ctx.width / 2 - 140, ctx.height / 2);
        ctx.ctx.font = '14px Sora, sans-serif';
        ctx.ctx.fillStyle = '#e8f7ff';
        ctx.ctx.fillText('Press R — the story never ends', ctx.width / 2 - 100, ctx.height / 2 + 28);
      }

      // Day/night indicator
      ctx.ctx.fillStyle = night ? 'rgba(124,255,107,0.7)' : 'rgba(255,200,87,0.7)';
      ctx.ctx.fillText(night ? `Night · ${weather}` : `Day ${day} · ${weather}`, ctx.width - 120, 20);
    },
  };
};
