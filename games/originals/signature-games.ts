/**
 * JGames Original Signature Titles (19 companions to Rise of the Forgotten King)
 * Completely original concepts for JASHUVA GAMES.
 */
import {
  type GameFactory,
  type EngineContext,
  clearNeon,
  drawScore,
  bumpScore,
  gameOver,
  clamp,
  rand,
} from '../engine/core';

function hud(ctx: EngineContext, tip: string) {
  drawScore(ctx);
  ctx.ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.ctx.font = '11px Sora, sans-serif';
  ctx.ctx.fillText(tip, 14, ctx.height - 14);
  if (!ctx.alive) {
    ctx.ctx.fillStyle = '#ff2bd6';
    ctx.ctx.font = '700 24px Orbitron, sans-serif';
    ctx.ctx.fillText('RUN ENDED — R', ctx.width / 2 - 90, ctx.height / 2);
  }
}

function restart(ctx: EngineContext, reset: () => void) {
  if (!ctx.alive && ctx.keys.has('r')) {
    ctx.keys.delete('r');
    ctx.alive = true;
    ctx.score = 0;
    reset();
  }
}

/** Neon Velocity — futuristic racing */
export const neonVelocity: GameFactory = () => {
  let lane = 1;
  let nitro = 100;
  let cars: { lane: number; y: number }[] = [];
  let speed = 260;
  const reset = () => {
    lane = 1;
    nitro = 100;
    cars = [];
    speed = 260;
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      speed += 6 * ctx.dt;
      bumpScore(ctx, ctx.dt * (18 + (ctx.keys.has(' ') ? 12 : 0)));
      if (ctx.keys.has(' ') && nitro > 0) {
        nitro -= 30 * ctx.dt;
        speed += 40 * ctx.dt;
      } else nitro = Math.min(100, nitro + 12 * ctx.dt);
      if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) {
        lane = Math.max(0, lane - 1);
        ctx.keys.delete('arrowleft');
        ctx.keys.delete('a');
      }
      if (ctx.keys.has('arrowright') || ctx.keys.has('d')) {
        lane = Math.min(2, lane + 1);
        ctx.keys.delete('arrowright');
        ctx.keys.delete('d');
      }
      if (Math.random() < 0.035) cars.push({ lane: Math.floor(rand(0, 3)), y: -40 });
      cars.forEach((c) => (c.y += speed * ctx.dt));
      cars = cars.filter((c) => c.y < ctx.height + 50);
      for (const c of cars) {
        if (c.lane === lane && c.y > ctx.height * 0.68 && c.y < ctx.height * 0.68 + 52) gameOver(ctx);
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#050518', '#0a1030');
      const lw = ctx.width / 3;
      for (let i = 1; i < 3; i++) {
        ctx.ctx.strokeStyle = 'rgba(0,240,255,0.25)';
        ctx.ctx.beginPath();
        ctx.ctx.moveTo(i * lw, 0);
        ctx.ctx.lineTo(i * lw, ctx.height);
        ctx.ctx.stroke();
      }
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(lane * lw + lw * 0.2, ctx.height * 0.7, lw * 0.6, 48);
      ctx.ctx.fillStyle = '#ff2bd6';
      cars.forEach((c) => ctx.ctx.fillRect(c.lane * lw + lw * 0.2, c.y, lw * 0.6, 48));
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.fillRect(12, 40, nitro * 1.2, 8);
      hud(ctx, 'Neon Velocity · A/D lanes · Space nitro');
    },
  };
};

/** Shadow Assassin — stealth */
export const shadowAssassin: GameFactory = () => {
  let player = { x: 0.12, y: 0.8 };
  let guards: { x: number; y: number; dir: number; alert: number }[] = [];
  let targets: { x: number; y: number; alive: boolean }[] = [];
  const reset = () => {
    player = { x: 0.12, y: 0.8 };
    guards = Array.from({ length: 4 }, (_, i) => ({
      x: 0.3 + i * 0.15,
      y: 0.35 + (i % 2) * 0.25,
      dir: Math.random() > 0.5 ? 1 : -1,
      alert: 0,
    }));
    targets = Array.from({ length: 3 }, (_, i) => ({ x: 0.55 + i * 0.12, y: 0.25 + i * 0.15, alive: true }));
  };
  reset();
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      const sp = ctx.keys.has('shift') ? 0.22 : 0.35;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) player.x -= sp * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) player.x += sp * ctx.dt;
      if (ctx.keys.has('w') || ctx.keys.has('arrowup')) player.y -= sp * ctx.dt;
      if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) player.y += sp * ctx.dt;
      player.x = clamp(player.x, 0.05, 0.95);
      player.y = clamp(player.y, 0.08, 0.92);
      guards.forEach((g) => {
        g.x += g.dir * 0.12 * ctx.dt;
        if (g.x < 0.2 || g.x > 0.9) g.dir *= -1;
        const d = Math.hypot(g.x - player.x, g.y - player.y);
        if (d < 0.12 && !ctx.keys.has('shift')) g.alert += ctx.dt;
        if (g.alert > 1.2) gameOver(ctx);
      });
      if (ctx.keys.has(' ') || ctx.pointer.down) {
        targets.forEach((t) => {
          if (t.alive && Math.hypot(t.x - player.x, t.y - player.y) < 0.08) {
            t.alive = false;
            bumpScore(ctx, 100);
          }
        });
        guards.forEach((g) => {
          if (Math.hypot(g.x - player.x, g.y - player.y) < 0.07) {
            g.alert = -99;
            g.x = -1;
            bumpScore(ctx, 50);
          }
        });
        ctx.pointer.down = false;
        ctx.keys.delete(' ');
      }
      guards = guards.filter((g) => g.x > 0);
      if (targets.every((t) => !t.alive)) {
        bumpScore(ctx, 200);
        reset();
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#080510', '#12081a');
      targets.forEach((t) => {
        if (!t.alive) return;
        ctx.ctx.fillStyle = '#ffc857';
        ctx.ctx.fillRect(t.x * ctx.width - 10, t.y * ctx.height - 10, 20, 20);
      });
      guards.forEach((g) => {
        ctx.ctx.fillStyle = g.alert > 0 ? '#ff2bd6' : '#a78bfa';
        ctx.ctx.beginPath();
        ctx.ctx.arc(g.x * ctx.width, g.y * ctx.height, 12, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.beginPath();
      ctx.ctx.arc(player.x * ctx.width, player.y * ctx.height, 10, 0, Math.PI * 2);
      ctx.ctx.fill();
      hud(ctx, 'Shadow Assassin · Shift crouch · Space takedown');
    },
  };
};

/** Shared top-down shooter / explorer factories */
function arenaFactory(title: string, enemyColor: string, tip: string): GameFactory {
  return () => {
    let p = { x: 0.5, y: 0.5, hp: 100 };
    let shots: { x: number; y: number; vx: number; vy: number }[] = [];
    let foes: { x: number; y: number; hp: number }[] = [];
    const reset = () => {
      p = { x: 0.5, y: 0.5, hp: 100 };
      shots = [];
      foes = [];
    };
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        const sp = 0.38;
        if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) p.x -= sp * ctx.dt;
        if (ctx.keys.has('d') || ctx.keys.has('arrowright')) p.x += sp * ctx.dt;
        if (ctx.keys.has('w') || ctx.keys.has('arrowup')) p.y -= sp * ctx.dt;
        if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) p.y += sp * ctx.dt;
        p.x = clamp(p.x, 0.05, 0.95);
        p.y = clamp(p.y, 0.05, 0.95);
        if ((ctx.keys.has(' ') || ctx.pointer.down) && Math.random() > 0.55) {
          const ang = Math.atan2(ctx.pointer.y / ctx.height - p.y, ctx.pointer.x / ctx.width - p.x);
          shots.push({ x: p.x, y: p.y, vx: Math.cos(ang) * 0.9, vy: Math.sin(ang) * 0.9 });
        }
        shots.forEach((s) => {
          s.x += s.vx * ctx.dt;
          s.y += s.vy * ctx.dt;
        });
        shots = shots.filter((s) => s.x > 0 && s.x < 1 && s.y > 0 && s.y < 1).slice(-50);
        if (Math.random() < 0.04) foes.push({ x: Math.random(), y: Math.random() > 0.5 ? 0 : 1, hp: 2 });
        foes.forEach((f) => {
          const dx = p.x - f.x;
          const dy = p.y - f.y;
          const d = Math.hypot(dx, dy) || 1;
          f.x += (dx / d) * 0.14 * ctx.dt;
          f.y += (dy / d) * 0.14 * ctx.dt;
          if (d < 0.04) {
            p.hp -= 20 * ctx.dt;
            if (p.hp <= 0) gameOver(ctx);
          }
        });
        for (const f of foes) {
          for (const s of shots) {
            if (Math.hypot(f.x - s.x, f.y - s.y) < 0.04) {
              f.hp -= 1;
              s.x = -1;
              if (f.hp <= 0) bumpScore(ctx, 20);
            }
          }
        }
        foes = foes.filter((f) => f.hp > 0);
      },
      draw(ctx) {
        clearNeon(ctx);
        ctx.ctx.fillStyle = '#7cff6b';
        shots.forEach((s) => ctx.ctx.fillRect(s.x * ctx.width - 2, s.y * ctx.height - 2, 4, 4));
        ctx.ctx.fillStyle = enemyColor;
        foes.forEach((f) => {
          ctx.ctx.beginPath();
          ctx.ctx.arc(f.x * ctx.width, f.y * ctx.height, 11, 0, Math.PI * 2);
          ctx.ctx.fill();
        });
        ctx.ctx.fillStyle = '#00f0ff';
        ctx.ctx.beginPath();
        ctx.ctx.arc(p.x * ctx.width, p.y * ctx.height, 12, 0, Math.PI * 2);
        ctx.ctx.fill();
        ctx.ctx.fillStyle = '#ff2bd6';
        ctx.ctx.fillRect(12, 40, p.hp * 1.2, 8);
        hud(ctx, `${title} · ${tip}`);
      },
    };
  };
}

export const galaxyHunters = arenaFactory('Galaxy Hunters', '#a78bfa', 'WASD · aim & shoot');
export const zombieFrontier = arenaFactory('Zombie Frontier', '#7cff6b', 'Clear the streets');
export const robotWars = arenaFactory('Robot Wars', '#ffc857', 'Modular mech combat');
export const ninjaLegends = arenaFactory('Ninja Legends', '#ff2bd6', 'Elemental ninja arts');

/** Dragon Legacy — fantasy flyer */
export const dragonLegacy: GameFactory = () => {
  let y = 0.5;
  let obstacles: { x: number; gap: number }[] = [];
  const reset = () => {
    y = 0.5;
    obstacles = [];
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has(' ') || ctx.keys.has('w') || ctx.pointer.down) y -= 0.55 * ctx.dt;
      else y += 0.4 * ctx.dt;
      y = clamp(y, 0.05, 0.95);
      bumpScore(ctx, ctx.dt * 20);
      if (Math.random() < 0.025) obstacles.push({ x: 1.05, gap: rand(0.25, 0.65) });
      obstacles.forEach((o) => (o.x -= 0.35 * ctx.dt));
      obstacles = obstacles.filter((o) => o.x > -0.1);
      for (const o of obstacles) {
        if (o.x < 0.55 && o.x > 0.4 && Math.abs(y - o.gap) > 0.16) gameOver(ctx);
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#100818', '#1a1028');
      obstacles.forEach((o) => {
        ctx.ctx.fillStyle = 'rgba(255,43,214,0.35)';
        ctx.ctx.fillRect(o.x * ctx.width, 0, 40, (o.gap - 0.16) * ctx.height);
        ctx.ctx.fillRect(o.x * ctx.width, (o.gap + 0.16) * ctx.height, 40, ctx.height);
      });
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.beginPath();
      ctx.ctx.ellipse(ctx.width * 0.45, y * ctx.height, 22, 12, 0, 0, Math.PI * 2);
      ctx.ctx.fill();
      hud(ctx, 'Dragon Legacy · Hold Space / W to soar');
    },
  };
};

/** Survival Island */
export const survivalIsland: GameFactory = () => {
  let hunger = 80;
  let wood = 0;
  let shelter = 0;
  let threats: { x: number; y: number }[] = [];
  let p = { x: 0.5, y: 0.5 };
  const reset = () => {
    hunger = 80;
    wood = 0;
    shelter = 0;
    threats = [];
    p = { x: 0.5, y: 0.5 };
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      hunger -= 4 * ctx.dt;
      if (hunger <= 0) gameOver(ctx);
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) p.x -= 0.3 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) p.x += 0.3 * ctx.dt;
      if (ctx.keys.has('w') || ctx.keys.has('arrowup')) p.y -= 0.3 * ctx.dt;
      if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) p.y += 0.3 * ctx.dt;
      p.x = clamp(p.x, 0.05, 0.95);
      p.y = clamp(p.y, 0.05, 0.95);
      if (ctx.keys.has('e')) {
        ctx.keys.delete('e');
        wood += 2;
        hunger = Math.min(100, hunger + 8);
        if (wood >= 5 && shelter < 100) {
          wood -= 5;
          shelter += 20;
          bumpScore(ctx, 40);
        }
      }
      if (Math.random() < 0.02) threats.push({ x: Math.random(), y: Math.random() });
      threats.forEach((t) => {
        const d = Math.hypot(t.x - p.x, t.y - p.y) || 1;
        t.x += ((p.x - t.x) / d) * 0.1 * ctx.dt;
        t.y += ((p.y - t.y) / d) * 0.1 * ctx.dt;
        if (d < 0.05) hunger -= 30 * ctx.dt;
      });
      bumpScore(ctx, ctx.dt * 5 + shelter * 0.01);
    },
    draw(ctx) {
      clearNeon(ctx, '#081208', '#102010');
      ctx.ctx.fillStyle = `rgba(0,240,255,${0.15 + shelter / 200})`;
      ctx.ctx.fillRect(ctx.width * 0.4, ctx.height * 0.4, 80, 50);
      threats.forEach((t) => {
        ctx.ctx.fillStyle = '#ff2bd6';
        ctx.ctx.beginPath();
        ctx.ctx.arc(t.x * ctx.width, t.y * ctx.height, 10, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#7cff6b';
      ctx.ctx.beginPath();
      ctx.ctx.arc(p.x * ctx.width, p.y * ctx.height, 11, 0, Math.PI * 2);
      ctx.ctx.fill();
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.fillRect(12, 40, hunger * 1.2, 8);
      hud(ctx, `Survival Island · E gather/build · Shelter ${shelter}%`);
    },
  };
};

/** Cyber Detective — tap clues */
export const cyberDetective: GameFactory = () => {
  let clues: { x: number; y: number; found: boolean; id: number }[] = [];
  let found = 0;
  let timer = 45;
  const reset = () => {
    clues = Array.from({ length: 6 }, (_, i) => ({
      x: rand(0.1, 0.9),
      y: rand(0.15, 0.85),
      found: false,
      id: i,
    }));
    found = 0;
    timer = 45;
  };
  reset();
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      timer -= ctx.dt;
      if (timer <= 0) gameOver(ctx);
      if (ctx.pointer.down) {
        for (const c of clues) {
          if (!c.found && Math.hypot(c.x * ctx.width - ctx.pointer.x, c.y * ctx.height - ctx.pointer.y) < 28) {
            c.found = true;
            found += 1;
            bumpScore(ctx, 80);
          }
        }
        ctx.pointer.down = false;
      }
      if (found >= 6) {
        bumpScore(ctx, 200);
        reset();
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#050a12', '#0a1525');
      clues.forEach((c) => {
        if (c.found) return;
        ctx.ctx.fillStyle = 'rgba(0,240,255,0.5)';
        ctx.ctx.beginPath();
        ctx.ctx.arc(c.x * ctx.width, c.y * ctx.height, 8, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#e8f7ff';
      ctx.ctx.fillText(`Clues ${found}/6 · Time ${Math.ceil(timer)}s`, 160, 28);
      hud(ctx, 'Cyber Detective · Click glowing clues');
    },
  };
};

/** Wild Frontier — duel lane */
export const wildFrontier: GameFactory = () => {
  let bandits: { x: number; y: number }[] = [];
  let gold = 0;
  let p = 0.5;
  const reset = () => {
    bandits = [];
    gold = 0;
    p = 0.5;
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) p -= 0.5 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) p += 0.5 * ctx.dt;
      p = clamp(p, 0.1, 0.9);
      if (Math.random() < 0.03) bandits.push({ x: rand(0.1, 0.9), y: 0 });
      bandits.forEach((b) => (b.y += 0.25 * ctx.dt));
      if (ctx.keys.has(' ') || ctx.pointer.down) {
        bandits = bandits.filter((b) => {
          if (Math.abs(b.x - p) < 0.08 && b.y > 0.7) {
            gold += 1;
            bumpScore(ctx, 25);
            return false;
          }
          return true;
        });
      }
      if (bandits.some((b) => b.y > 0.92)) gameOver(ctx);
      bandits = bandits.filter((b) => b.y <= 0.95);
    },
    draw(ctx) {
      clearNeon(ctx, '#120a05', '#1c1208');
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.fillRect(p * ctx.width - 16, ctx.height * 0.82, 32, 20);
      ctx.ctx.fillStyle = '#ff2bd6';
      bandits.forEach((b) => ctx.ctx.fillRect(b.x * ctx.width - 12, b.y * ctx.height, 24, 18));
      ctx.ctx.fillStyle = '#e8f7ff';
      ctx.ctx.fillText(`Gold ${gold}`, 160, 28);
      hud(ctx, 'Wild Frontier · Aim & Space to duel');
    },
  };
};

/** Kingdom Builders — tap to grow */
export const kingdomBuilders: GameFactory = () => {
  let pop = 10;
  let food = 20;
  let army = 0;
  let threat = 0;
  const reset = () => {
    pop = 10;
    food = 20;
    army = 0;
    threat = 0;
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      food += pop * 0.15 * ctx.dt;
      food -= (pop + army) * 0.12 * ctx.dt;
      threat += (0.5 + army * 0.02) * ctx.dt;
      if (food < 0) {
        pop = Math.max(0, pop - 2 * ctx.dt);
        food = 0;
      }
      if (pop <= 0) gameOver(ctx);
      if (ctx.keys.has('1')) {
        ctx.keys.delete('1');
        if (food >= 10) {
          food -= 10;
          pop += 2;
          bumpScore(ctx, 15);
        }
      }
      if (ctx.keys.has('2')) {
        ctx.keys.delete('2');
        if (food >= 15 && pop > 5) {
          food -= 15;
          pop -= 1;
          army += 1;
          bumpScore(ctx, 20);
        }
      }
      if (ctx.keys.has('3')) {
        ctx.keys.delete('3');
        if (army > 0 && threat > 5) {
          army -= 1;
          threat = Math.max(0, threat - 25);
          bumpScore(ctx, 40);
        }
      }
      if (threat > 100) gameOver(ctx);
      bumpScore(ctx, ctx.dt * pop * 0.2);
    },
    draw(ctx) {
      clearNeon(ctx, '#081018', '#101820');
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.font = '16px Sora, sans-serif';
      ctx.ctx.fillText(`Pop ${Math.floor(pop)}  Food ${Math.floor(food)}  Army ${army}`, 40, 80);
      ctx.ctx.fillStyle = '#ff2bd6';
      ctx.ctx.fillRect(40, 100, Math.min(300, threat * 3), 12);
      ctx.ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.ctx.fillText('1 Grow  2 Recruit  3 Defend', 40, 140);
      hud(ctx, 'Kingdom Builders · Manage empire');
    },
  };
};

/** Ocean Explorer */
export const oceanExplorer: GameFactory = () => {
  let depth = 0;
  let O2 = 100;
  let treasures = 0;
  let hazards: { x: number; y: number }[] = [];
  let p = { x: 0.5, y: 0.3 };
  const reset = () => {
    depth = 0;
    O2 = 100;
    treasures = 0;
    hazards = [];
    p = { x: 0.5, y: 0.3 };
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) p.x -= 0.35 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) p.x += 0.35 * ctx.dt;
      if (ctx.keys.has('w') || ctx.keys.has('arrowup')) p.y -= 0.3 * ctx.dt;
      if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) p.y += 0.35 * ctx.dt;
      p.x = clamp(p.x, 0.05, 0.95);
      p.y = clamp(p.y, 0.1, 0.92);
      depth = Math.max(depth, p.y * 100);
      O2 -= (0.8 + p.y) * ctx.dt;
      if (O2 <= 0) gameOver(ctx);
      if (p.y < 0.2) O2 = Math.min(100, O2 + 25 * ctx.dt);
      if (Math.random() < 0.03) hazards.push({ x: rand(0.1, 0.9), y: rand(0.4, 0.9) });
      hazards.forEach((h) => {
        if (Math.hypot(h.x - p.x, h.y - p.y) < 0.05) O2 -= 40 * ctx.dt;
      });
      if (Math.random() < 0.01) {
        treasures += 1;
        bumpScore(ctx, 50);
      }
      bumpScore(ctx, ctx.dt * depth * 0.1);
    },
    draw(ctx) {
      clearNeon(ctx, '#021018', '#043040');
      hazards.forEach((h) => {
        ctx.ctx.fillStyle = '#ff2bd6';
        ctx.ctx.beginPath();
        ctx.ctx.arc(h.x * ctx.width, h.y * ctx.height, 14, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.beginPath();
      ctx.ctx.ellipse(p.x * ctx.width, p.y * ctx.height, 16, 8, 0, 0, Math.PI * 2);
      ctx.ctx.fill();
      ctx.ctx.fillStyle = '#7cff6b';
      ctx.ctx.fillRect(12, 40, O2 * 1.2, 8);
      hud(ctx, `Ocean Explorer · O2 · Treasures ${treasures}`);
    },
  };
};

/** Monster Arena — collect orbs */
export const monsterArena: GameFactory = () => {
  let mon = { x: 0.5, y: 0.5, power: 1 };
  let orbs: { x: number; y: number }[] = [];
  let rivals: { x: number; y: number; p: number }[] = [];
  const reset = () => {
    mon = { x: 0.5, y: 0.5, power: 1 };
    orbs = [];
    rivals = [];
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) mon.x -= 0.35 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) mon.x += 0.35 * ctx.dt;
      if (ctx.keys.has('w') || ctx.keys.has('arrowup')) mon.y -= 0.35 * ctx.dt;
      if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) mon.y += 0.35 * ctx.dt;
      mon.x = clamp(mon.x, 0.05, 0.95);
      mon.y = clamp(mon.y, 0.05, 0.95);
      if (Math.random() < 0.05) orbs.push({ x: rand(0.1, 0.9), y: rand(0.1, 0.9) });
      orbs = orbs.filter((o) => {
        if (Math.hypot(o.x - mon.x, o.y - mon.y) < 0.05) {
          mon.power += 0.15;
          bumpScore(ctx, 10);
          return false;
        }
        return true;
      });
      if (Math.random() < 0.02) rivals.push({ x: rand(0, 1), y: rand(0, 1), p: rand(0.5, mon.power + 0.5) });
      rivals.forEach((r) => {
        const d = Math.hypot(r.x - mon.x, r.y - mon.y) || 1;
        r.x += ((mon.x - r.x) / d) * 0.12 * ctx.dt;
        r.y += ((mon.y - r.y) / d) * 0.12 * ctx.dt;
        if (d < 0.05) {
          if (mon.power >= r.p) {
            mon.power += 0.2;
            bumpScore(ctx, 30);
            r.x = -1;
          } else gameOver(ctx);
        }
      });
      rivals = rivals.filter((r) => r.x >= 0);
    },
    draw(ctx) {
      clearNeon(ctx, '#100818', '#181028');
      orbs.forEach((o) => {
        ctx.ctx.fillStyle = '#ffc857';
        ctx.ctx.beginPath();
        ctx.ctx.arc(o.x * ctx.width, o.y * ctx.height, 7, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      rivals.forEach((r) => {
        ctx.ctx.fillStyle = '#ff2bd6';
        ctx.ctx.beginPath();
        ctx.ctx.arc(r.x * ctx.width, r.y * ctx.height, 8 + r.p * 4, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.beginPath();
      ctx.ctx.arc(mon.x * ctx.width, mon.y * ctx.height, 8 + mon.power * 4, 0, Math.PI * 2);
      ctx.ctx.fill();
      hud(ctx, `Monster Arena · Evolve power ${mon.power.toFixed(1)}`);
    },
  };
};

/** Speed Legends — similar to neon but street theme */
export const speedLegends: GameFactory = (engineCtx) => {
  const inner = neonVelocity(engineCtx);
  return {
    update: inner.update,
    draw(ctx) {
      inner.draw(ctx);
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.font = '12px Orbitron, sans-serif';
      ctx.ctx.fillText('SPEED LEGENDS', ctx.width - 130, 44);
    },
  };
};

/** Pirate Seas */
export const pirateSeas: GameFactory = () => {
  let ship = { x: 0.5, y: 0.7, hp: 100 };
  let cannon: { x: number; y: number }[] = [];
  let foes: { x: number; y: number; hp: number }[] = [];
  const reset = () => {
    ship = { x: 0.5, y: 0.7, hp: 100 };
    cannon = [];
    foes = [];
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) ship.x -= 0.4 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) ship.x += 0.4 * ctx.dt;
      ship.x = clamp(ship.x, 0.1, 0.9);
      if (ctx.keys.has(' ') || ctx.pointer.down) cannon.push({ x: ship.x, y: ship.y });
      cannon.forEach((c) => (c.y -= 0.7 * ctx.dt));
      cannon = cannon.filter((c) => c.y > 0).slice(-30);
      if (Math.random() < 0.03) foes.push({ x: rand(0.1, 0.9), y: -0.05, hp: 2 });
      foes.forEach((f) => (f.y += 0.2 * ctx.dt));
      for (const f of foes) {
        for (const c of cannon) {
          if (Math.hypot(f.x - c.x, f.y - c.y) < 0.05) {
            f.hp -= 1;
            c.y = -1;
            if (f.hp <= 0) bumpScore(ctx, 30);
          }
        }
        if (f.y > 0.75 && Math.abs(f.x - ship.x) < 0.08) {
          ship.hp -= 30 * ctx.dt;
          if (ship.hp <= 0) gameOver(ctx);
        }
      }
      foes = foes.filter((f) => f.hp > 0 && f.y < 1.1);
    },
    draw(ctx) {
      clearNeon(ctx, '#021018', '#063040');
      ctx.ctx.fillStyle = '#ffc857';
      cannon.forEach((c) => ctx.ctx.fillRect(c.x * ctx.width - 2, c.y * ctx.height, 4, 8));
      ctx.ctx.fillStyle = '#ff2bd6';
      foes.forEach((f) => ctx.ctx.fillRect(f.x * ctx.width - 16, f.y * ctx.height, 32, 16));
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(ship.x * ctx.width - 24, ship.y * ctx.height, 48, 18);
      ctx.ctx.fillStyle = '#7cff6b';
      ctx.ctx.fillRect(12, 40, ship.hp * 1.2, 8);
      hud(ctx, 'Pirate Seas · A/D sail · Space cannons');
    },
  };
};

/** Ancient Temple — tile path */
export const ancientTemple: GameFactory = () => {
  let grid: number[][] = Array.from({ length: 6 }, () => Array.from({ length: 8 }, () => (Math.random() > 0.7 ? 1 : 0)));
  let px = 0;
  let py = 5;
  grid[5][0] = 0;
  grid[0][7] = 2;
  const reset = () => {
    grid = Array.from({ length: 6 }, () => Array.from({ length: 8 }, () => (Math.random() > 0.7 ? 1 : 0)));
    px = 0;
    py = 5;
    grid[5][0] = 0;
    grid[0][7] = 2;
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      const tryMove = (dx: number, dy: number) => {
        const nx = px + dx;
        const ny = py + dy;
        if (ny < 0 || nx < 0 || ny >= 6 || nx >= 8) return;
        if (grid[ny][nx] === 1) {
          gameOver(ctx);
          return;
        }
        px = nx;
        py = ny;
        bumpScore(ctx, 5);
        if (grid[ny][nx] === 2) {
          bumpScore(ctx, 150);
          reset();
        }
      };
      if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) {
        tryMove(-1, 0);
        ctx.keys.delete('arrowleft');
        ctx.keys.delete('a');
      }
      if (ctx.keys.has('arrowright') || ctx.keys.has('d')) {
        tryMove(1, 0);
        ctx.keys.delete('arrowright');
        ctx.keys.delete('d');
      }
      if (ctx.keys.has('arrowup') || ctx.keys.has('w')) {
        tryMove(0, -1);
        ctx.keys.delete('arrowup');
        ctx.keys.delete('w');
      }
      if (ctx.keys.has('arrowdown') || ctx.keys.has('s')) {
        tryMove(0, 1);
        ctx.keys.delete('arrowdown');
        ctx.keys.delete('s');
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#100808', '#181010');
      const cw = ctx.width / 8;
      const ch = ctx.height / 6;
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 8; x++) {
          const cell = grid[y][x];
          ctx.ctx.fillStyle = cell === 1 ? 'rgba(255,43,214,0.35)' : cell === 2 ? 'rgba(255,200,87,0.5)' : 'rgba(255,255,255,0.05)';
          ctx.ctx.fillRect(x * cw + 2, y * ch + 2, cw - 4, ch - 4);
        }
      }
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(px * cw + 8, py * ch + 8, cw - 16, ch - 16);
      hud(ctx, 'Ancient Temple · Avoid traps · Reach the relic');
    },
  };
};

/** Battle Command */
export const battleCommand: GameFactory = () => {
  let units: { x: number; side: 'us' | 'them'; hp: number }[] = [];
  let energy = 50;
  const reset = () => {
    units = [
      { x: 0.2, side: 'us', hp: 30 },
      { x: 0.8, side: 'them', hp: 30 },
    ];
    energy = 50;
  };
  reset();
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      energy = Math.min(100, energy + 10 * ctx.dt);
      if (ctx.keys.has('1') && energy >= 20) {
        ctx.keys.delete('1');
        energy -= 20;
        units.push({ x: 0.15, side: 'us', hp: 25 });
      }
      units.forEach((u) => {
        u.x += (u.side === 'us' ? 0.08 : -0.08) * ctx.dt;
      });
      for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
          const a = units[i];
          const b = units[j];
          if (a.side !== b.side && Math.abs(a.x - b.x) < 0.04) {
            a.hp -= 20 * ctx.dt;
            b.hp -= 20 * ctx.dt;
          }
        }
      }
      const before = units.length;
      units = units.filter((u) => u.hp > 0 && u.x > 0 && u.x < 1);
      if (units.length < before) bumpScore(ctx, 15);
      if (!units.some((u) => u.side === 'us')) gameOver(ctx);
      if (!units.some((u) => u.side === 'them')) {
        bumpScore(ctx, 100);
        units.push({ x: 0.85, side: 'them', hp: 35 + ctx.score / 50 });
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#0a0a10', '#12141c');
      units.forEach((u) => {
        ctx.ctx.fillStyle = u.side === 'us' ? '#00f0ff' : '#ff2bd6';
        ctx.ctx.fillRect(u.x * ctx.width - 10, ctx.height * 0.55, 20, 30);
      });
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.fillRect(12, 40, energy * 1.2, 8);
      hud(ctx, 'Battle Command · Press 1 to deploy');
    },
  };
};

/** Sky Kingdom */
export const skyKingdom: GameFactory = () => {
  let cityHp = 100;
  let pirates: { x: number; y: number }[] = [];
  let shots: { x: number; y: number }[] = [];
  let aim = 0.5;
  const reset = () => {
    cityHp = 100;
    pirates = [];
    shots = [];
    aim = 0.5;
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      aim = ctx.pointer.x / ctx.width || aim;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) aim -= 0.4 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) aim += 0.4 * ctx.dt;
      aim = clamp(aim, 0.05, 0.95);
      if (ctx.keys.has(' ') || ctx.pointer.down) shots.push({ x: aim, y: 0.75 });
      shots.forEach((s) => (s.y -= 0.6 * ctx.dt));
      shots = shots.filter((s) => s.y > 0).slice(-40);
      if (Math.random() < 0.03) pirates.push({ x: rand(0.1, 0.9), y: 0 });
      pirates.forEach((p) => (p.y += 0.18 * ctx.dt));
      for (const p of pirates) {
        for (const s of shots) {
          if (Math.hypot(p.x - s.x, p.y - s.y) < 0.05) {
            p.y = 2;
            s.y = -1;
            bumpScore(ctx, 25);
          }
        }
        if (p.y > 0.78) {
          cityHp -= 15 * ctx.dt;
          if (cityHp <= 0) gameOver(ctx);
        }
      }
      pirates = pirates.filter((p) => p.y < 1.1);
    },
    draw(ctx) {
      clearNeon(ctx, '#081428', '#102040');
      ctx.ctx.fillStyle = 'rgba(0,240,255,0.25)';
      ctx.ctx.fillRect(ctx.width * 0.2, ctx.height * 0.78, ctx.width * 0.6, 30);
      ctx.ctx.fillStyle = '#7cff6b';
      shots.forEach((s) => ctx.ctx.fillRect(s.x * ctx.width - 2, s.y * ctx.height, 4, 10));
      ctx.ctx.fillStyle = '#ff2bd6';
      pirates.forEach((p) => {
        ctx.ctx.beginPath();
        ctx.ctx.arc(p.x * ctx.width, p.y * ctx.height, 12, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.fillRect(aim * ctx.width - 14, ctx.height * 0.72, 28, 14);
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(12, 40, cityHp * 1.2, 8);
      hud(ctx, 'Sky Kingdom · Defend the floating city');
    },
  };
};

/** Infinity Arena — endless procedural rooms */
export const infinityArena: GameFactory = () => {
  let room = 1;
  let p = { x: 0.5, y: 0.5, hp: 100 };
  let foes: { x: number; y: number; hp: number }[] = [];
  let loot = 0;
  const newRoom = () => {
    room += 1;
    foes = Array.from({ length: 3 + (room % 5) }, () => ({
      x: rand(0.15, 0.85),
      y: rand(0.15, 0.85),
      hp: 2 + Math.floor(room / 3),
    }));
    p.x = 0.5;
    p.y = 0.85;
    p.hp = Math.min(100, p.hp + 15);
  };
  const reset = () => {
    room = 1;
    p = { x: 0.5, y: 0.5, hp: 100 };
    loot = 0;
    foes = [];
    newRoom();
  };
  reset();
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) p.x -= 0.4 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) p.x += 0.4 * ctx.dt;
      if (ctx.keys.has('w') || ctx.keys.has('arrowup')) p.y -= 0.4 * ctx.dt;
      if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) p.y += 0.4 * ctx.dt;
      p.x = clamp(p.x, 0.08, 0.92);
      p.y = clamp(p.y, 0.08, 0.92);
      if (ctx.keys.has(' ') || ctx.pointer.down) {
        foes.forEach((f) => {
          if (Math.hypot(f.x - p.x, f.y - p.y) < 0.1) {
            f.hp -= 1;
            if (f.hp <= 0) {
              bumpScore(ctx, 20 + room);
              loot += 1;
            }
          }
        });
      }
      foes.forEach((f) => {
        const d = Math.hypot(f.x - p.x, f.y - p.y) || 1;
        f.x += ((p.x - f.x) / d) * 0.12 * ctx.dt;
        f.y += ((p.y - f.y) / d) * 0.12 * ctx.dt;
        if (d < 0.05) {
          p.hp -= 18 * ctx.dt;
          if (p.hp <= 0) gameOver(ctx);
        }
      });
      foes = foes.filter((f) => f.hp > 0);
      if (foes.length === 0) {
        bumpScore(ctx, 100);
        newRoom();
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#0a0510', '#140a1c');
      foes.forEach((f) => {
        ctx.ctx.fillStyle = '#ff2bd6';
        ctx.ctx.beginPath();
        ctx.ctx.arc(f.x * ctx.width, f.y * ctx.height, 12, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.beginPath();
      ctx.ctx.arc(p.x * ctx.width, p.y * ctx.height, 12, 0, Math.PI * 2);
      ctx.ctx.fill();
      ctx.ctx.fillStyle = '#7cff6b';
      ctx.ctx.fillRect(12, 40, p.hp * 1.2, 8);
      ctx.ctx.fillStyle = '#e8f7ff';
      ctx.ctx.fillText(`Room ${room} · Loot ${loot}`, 160, 28);
      hud(ctx, 'Infinity Arena · Endless procedural realms');
    },
  };
};
