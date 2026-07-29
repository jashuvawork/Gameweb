/**
 * Genre-adaptive mini-games for expandable catalog titles.
 * Original JASHUVA GAMES playable stubs — full campaign expansions ship over time.
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

function tip(ctx: EngineContext, text: string) {
  drawScore(ctx);
  ctx.ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.ctx.font = '11px Sora, sans-serif';
  ctx.ctx.fillText(text, 14, ctx.height - 14);
  if (!ctx.alive) {
    ctx.ctx.fillStyle = '#ff2bd6';
    ctx.ctx.font = '700 22px Orbitron, sans-serif';
    ctx.ctx.fillText('RUN ENDED — R', ctx.width / 2 - 88, ctx.height / 2);
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

function arcadeRunner(title: string): GameFactory {
  return () => {
    let y = 0.7;
    let vy = 0;
    let obstacles: { x: number; h: number }[] = [];
    const reset = () => {
      y = 0.7;
      vy = 0;
      obstacles = [];
    };
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        bumpScore(ctx, ctx.dt * 20);
        if ((ctx.keys.has(' ') || ctx.keys.has('arrowup') || ctx.pointer.down) && y >= 0.69) vy = -0.9;
        vy += 2.2 * ctx.dt;
        y = clamp(y + vy * ctx.dt, 0.2, 0.7);
        if (y >= 0.7) vy = 0;
        if (Math.random() < 0.02) obstacles.push({ x: 1.1, h: rand(0.12, 0.28) });
        obstacles.forEach((o) => (o.x -= 0.45 * ctx.dt));
        obstacles = obstacles.filter((o) => o.x > -0.1);
        for (const o of obstacles) {
          if (o.x < 0.22 && o.x > 0.08 && y > 0.7 - o.h - 0.02) gameOver(ctx);
        }
      },
      draw(ctx) {
        clearNeon(ctx, '#060816', '#101828');
        ctx.ctx.fillStyle = 'rgba(0,240,255,0.15)';
        ctx.ctx.fillRect(0, ctx.height * 0.78, ctx.width, 4);
        obstacles.forEach((o) => {
          ctx.ctx.fillStyle = '#ff2bd6';
          ctx.ctx.fillRect(o.x * ctx.width, ctx.height * (0.78 - o.h), 18, o.h * ctx.height);
        });
        ctx.ctx.fillStyle = '#00f0ff';
        ctx.ctx.fillRect(ctx.width * 0.12, y * ctx.height, 28, 28);
        tip(ctx, `${title} · Jump`);
      },
    };
  };
}

function arenaShooter(title: string): GameFactory {
  return () => {
    let px = 0.5;
    let py = 0.8;
    let bullets: { x: number; y: number }[] = [];
    let foes: { x: number; y: number }[] = [];
    let cd = 0;
    const reset = () => {
      px = 0.5;
      py = 0.8;
      bullets = [];
      foes = [];
      cd = 0;
    };
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        const sp = 0.55;
        if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) px -= sp * ctx.dt;
        if (ctx.keys.has('arrowright') || ctx.keys.has('d')) px += sp * ctx.dt;
        if (ctx.keys.has('arrowup') || ctx.keys.has('w')) py -= sp * ctx.dt;
        if (ctx.keys.has('arrowdown') || ctx.keys.has('s')) py += sp * ctx.dt;
        px = clamp(px, 0.05, 0.95);
        py = clamp(py, 0.1, 0.92);
        cd -= ctx.dt;
        if ((ctx.keys.has(' ') || ctx.pointer.down) && cd <= 0) {
          bullets.push({ x: px, y: py - 0.04 });
          cd = 0.16;
        }
        bullets.forEach((b) => (b.y -= 0.9 * ctx.dt));
        bullets = bullets.filter((b) => b.y > -0.05);
        if (Math.random() < 0.04) foes.push({ x: rand(0.05, 0.95), y: -0.05 });
        foes.forEach((f) => (f.y += 0.25 * ctx.dt));
        foes = foes.filter((f) => f.y < 1.1);
        for (const f of foes) {
          for (const b of bullets) {
            if (Math.hypot(f.x - b.x, f.y - b.y) < 0.04) {
              f.y = 2;
              b.y = -1;
              bumpScore(ctx, 25);
            }
          }
          if (Math.hypot(f.x - px, f.y - py) < 0.05) gameOver(ctx);
        }
        foes = foes.filter((f) => f.y < 1.05);
      },
      draw(ctx) {
        clearNeon(ctx, '#080510', '#1a0820');
        bullets.forEach((b) => {
          ctx.ctx.fillStyle = '#00f0ff';
          ctx.ctx.fillRect(b.x * ctx.width - 2, b.y * ctx.height - 8, 4, 12);
        });
        foes.forEach((f) => {
          ctx.ctx.fillStyle = '#ff6b4a';
          ctx.ctx.beginPath();
          ctx.ctx.arc(f.x * ctx.width, f.y * ctx.height, 12, 0, Math.PI * 2);
          ctx.ctx.fill();
        });
        ctx.ctx.fillStyle = '#e8f7ff';
        ctx.ctx.fillRect(px * ctx.width - 14, py * ctx.height - 14, 28, 28);
        tip(ctx, `${title} · Move & shoot`);
      },
    };
  };
}

function puzzleMatch(title: string): GameFactory {
  return () => {
    let grid: number[] = [];
    let selected = -1;
    let moves = 0;
    let wasDown = false;
    const size = 4;
    const reset = () => {
      grid = Array.from({ length: size * size }, (_, i) => Math.floor(i / 2) % 8);
      for (let i = grid.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [grid[i], grid[j]] = [grid[j], grid[i]];
      }
      selected = -1;
      moves = 0;
      wasDown = false;
    };
    reset();
    const colors = ['#00f0ff', '#ff2bd6', '#a3ff12', '#ffb020', '#7aa2ff', '#ff6b9d', '#c084fc', '#34d399'];
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        const clicked = ctx.pointer.down && !wasDown;
        wasDown = ctx.pointer.down;
        if (clicked) {
          const col = Math.floor((ctx.pointer.x / ctx.width) * size);
          const row = Math.floor((ctx.pointer.y / ctx.height) * size);
          const idx = row * size + col;
          if (idx >= 0 && idx < grid.length && grid[idx] >= 0) {
            if (selected < 0) selected = idx;
            else if (selected === idx) selected = -1;
            else if (grid[selected] === grid[idx]) {
              grid[selected] = -1;
              grid[idx] = -1;
              selected = -1;
              moves += 1;
              bumpScore(ctx, 50);
              if (grid.every((c) => c < 0)) bumpScore(ctx, 200);
            } else {
              selected = idx;
              moves += 1;
            }
          }
        }
      },
      draw(ctx) {
        clearNeon(ctx, '#071018', '#0c1c28');
        const cw = ctx.width / size;
        const ch = ctx.height / size;
        grid.forEach((c, i) => {
          if (c < 0) return;
          const x = (i % size) * cw;
          const y = Math.floor(i / size) * ch;
          ctx.ctx.fillStyle = colors[c];
          ctx.ctx.globalAlpha = i === selected ? 1 : 0.85;
          ctx.ctx.fillRect(x + 6, y + 6, cw - 12, ch - 12);
          ctx.ctx.globalAlpha = 1;
        });
        tip(ctx, `${title} · Match pairs · moves ${moves}`);
      },
    };
  };
}

function strategyClick(title: string): GameFactory {
  return () => {
    let nodes: { x: number; y: number; hp: number }[] = [];
    let energy = 3;
    let wasDown = false;
    const reset = () => {
      nodes = Array.from({ length: 6 }, () => ({ x: rand(0.15, 0.85), y: rand(0.2, 0.75), hp: 3 }));
      energy = 3;
      wasDown = false;
    };
    reset();
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        energy = Math.min(5, energy + ctx.dt * 0.35);
        bumpScore(ctx, ctx.dt * 4);
        const clicked = ctx.pointer.down && !wasDown;
        wasDown = ctx.pointer.down;
        if (clicked && energy >= 1) {
          let hit = false;
          for (const n of nodes) {
            if (Math.hypot(n.x * ctx.width - ctx.pointer.x, n.y * ctx.height - ctx.pointer.y) < 28) {
              n.hp -= 1;
              energy -= 1;
              bumpScore(ctx, 30);
              hit = true;
              break;
            }
          }
          if (!hit) energy = Math.max(0, energy - 0.25);
        }
        nodes = nodes.filter((n) => n.hp > 0);
        if (!nodes.length) {
          bumpScore(ctx, 100);
          nodes = Array.from({ length: 6 + Math.floor(ctx.score / 200) }, () => ({
            x: rand(0.15, 0.85),
            y: rand(0.2, 0.75),
            hp: 3 + Math.floor(ctx.score / 400),
          }));
        }
        if (Math.random() < 0.002 && energy < 0.5) gameOver(ctx);
      },
      draw(ctx) {
        clearNeon(ctx, '#0a0a14', '#141428');
        nodes.forEach((n) => {
          ctx.ctx.fillStyle = `rgba(255,43,214,${0.4 + n.hp * 0.15})`;
          ctx.ctx.beginPath();
          ctx.ctx.arc(n.x * ctx.width, n.y * ctx.height, 18 + n.hp * 2, 0, Math.PI * 2);
          ctx.ctx.fill();
        });
        tip(ctx, `${title} · Tap nodes · energy ${energy.toFixed(1)}`);
      },
    };
  };
}

function racingLanes(title: string): GameFactory {
  return arcadeRunner(title);
}

function survivalGather(title: string): GameFactory {
  return () => {
    let px = 0.5;
    let py = 0.5;
    let hunger = 100;
    let food: { x: number; y: number }[] = [];
    let threats: { x: number; y: number }[] = [];
    const reset = () => {
      px = 0.5;
      py = 0.5;
      hunger = 100;
      food = [];
      threats = [];
    };
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        const sp = 0.4;
        if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) px -= sp * ctx.dt;
        if (ctx.keys.has('arrowright') || ctx.keys.has('d')) px += sp * ctx.dt;
        if (ctx.keys.has('arrowup') || ctx.keys.has('w')) py -= sp * ctx.dt;
        if (ctx.keys.has('arrowdown') || ctx.keys.has('s')) py += sp * ctx.dt;
        px = clamp(px, 0.05, 0.95);
        py = clamp(py, 0.08, 0.92);
        hunger -= 8 * ctx.dt;
        if (hunger <= 0) gameOver(ctx);
        if (Math.random() < 0.03) food.push({ x: rand(0.1, 0.9), y: rand(0.1, 0.9) });
        if (Math.random() < 0.02) threats.push({ x: rand(0.1, 0.9), y: rand(0.1, 0.9) });
        food = food.filter((f) => {
          if (Math.hypot(f.x - px, f.y - py) < 0.05) {
            hunger = Math.min(100, hunger + 25);
            bumpScore(ctx, 20);
            return false;
          }
          return true;
        });
        threats.forEach((t) => {
          t.x += (px - t.x) * 0.35 * ctx.dt;
          t.y += (py - t.y) * 0.35 * ctx.dt;
        });
        for (const t of threats) {
          if (Math.hypot(t.x - px, t.y - py) < 0.045) gameOver(ctx);
        }
      },
      draw(ctx) {
        clearNeon(ctx, '#08140c', '#102818');
        food.forEach((f) => {
          ctx.ctx.fillStyle = '#a3ff12';
          ctx.ctx.fillRect(f.x * ctx.width - 6, f.y * ctx.height - 6, 12, 12);
        });
        threats.forEach((t) => {
          ctx.ctx.fillStyle = '#ff4d4d';
          ctx.ctx.beginPath();
          ctx.ctx.arc(t.x * ctx.width, t.y * ctx.height, 10, 0, Math.PI * 2);
          ctx.ctx.fill();
        });
        ctx.ctx.fillStyle = '#00f0ff';
        ctx.ctx.fillRect(px * ctx.width - 10, py * ctx.height - 10, 20, 20);
        tip(ctx, `${title} · Gather · hunger ${Math.ceil(hunger)}`);
      },
    };
  };
}

export function createExpandableGame(meta: { title: string; genres: string[] }): GameFactory {
  const g = meta.genres.map((x) => x.toLowerCase());
  if (g.some((x) => ['racing', 'sports', 'platformer'].includes(x))) return racingLanes(meta.title);
  if (g.some((x) => ['puzzle', 'idle'].includes(x))) return puzzleMatch(meta.title);
  if (g.some((x) => ['strategy', 'simulation', 'mmorpg'].includes(x))) return strategyClick(meta.title);
  if (g.some((x) => ['survival', 'horror'].includes(x))) return survivalGather(meta.title);
  if (g.some((x) => ['action', 'sci-fi', 'fantasy', 'rpg'].includes(x))) return arenaShooter(meta.title);
  return arcadeRunner(meta.title);
}
