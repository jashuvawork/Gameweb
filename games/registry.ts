import {
  type GameFactory,
  type EngineContext,
  clearNeon,
  drawScore,
  bumpScore,
  gameOver,
  rand,
  clamp,
} from './engine/core';
import { riseOfTheForgottenKing } from './originals/rise-of-the-forgotten-king';
import {
  neonVelocity,
  shadowAssassin,
  galaxyHunters,
  dragonLegacy,
  survivalIsland,
  cyberDetective,
  wildFrontier,
  kingdomBuilders,
  oceanExplorer,
  zombieFrontier,
  monsterArena,
  ninjaLegends,
  speedLegends,
  pirateSeas,
  robotWars,
  ancientTemple,
  battleCommand,
  skyKingdom,
  infinityArena,
} from './originals/signature-games';
import { createExpandableGame } from './originals/expandable-factory';
import { buildExpandedCatalog } from './catalog/jgames-200';
import { FREE_GAME_FACTORIES } from './free/polished-free-games';

function hud(ctx: EngineContext, title: string) {
  drawScore(ctx);
  ctx.ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.ctx.font = '12px Sora, sans-serif';
  ctx.ctx.fillText(title, 16, ctx.height - 16);
  if (!ctx.alive) {
    ctx.ctx.fillStyle = 'rgba(255,43,214,0.9)';
    ctx.ctx.font = '700 28px Orbitron, sans-serif';
    ctx.ctx.fillText('RUN ENDED', ctx.width / 2 - 90, ctx.height / 2);
    ctx.ctx.font = '14px Sora, sans-serif';
    ctx.ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.ctx.fillText('Press R to restart', ctx.width / 2 - 60, ctx.height / 2 + 28);
  }
}

function restartKey(ctx: EngineContext, reset: () => void) {
  if (!ctx.alive && ctx.keys.has('r')) {
    ctx.keys.delete('r');
    ctx.alive = true;
    ctx.score = 0;
    reset();
  }
}

export const spaceDefender: GameFactory = () => {
  let playerX = 0.5;
  let bullets: { x: number; y: number }[] = [];
  let enemies: { x: number; y: number; s: number }[] = [];
  let cooldown = 0;
  const reset = () => {
    playerX = 0.5;
    bullets = [];
    enemies = [];
    cooldown = 0;
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      const speed = 0.55;
      if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) playerX -= speed * ctx.dt;
      if (ctx.keys.has('arrowright') || ctx.keys.has('d')) playerX += speed * ctx.dt;
      playerX = clamp(playerX, 0.05, 0.95);
      cooldown -= ctx.dt;
      if ((ctx.keys.has(' ') || ctx.keys.has('arrowup') || ctx.pointer.down) && cooldown <= 0) {
        bullets.push({ x: playerX, y: 0.88 });
        cooldown = 0.18;
      }
      bullets.forEach((b) => (b.y -= 1.2 * ctx.dt));
      bullets = bullets.filter((b) => b.y > 0);
      if (Math.random() < 0.03 + ctx.time * 0.001) enemies.push({ x: rand(0.05, 0.95), y: -0.05, s: rand(0.15, 0.35) });
      enemies.forEach((e) => (e.y += e.s * ctx.dt));
      for (const e of enemies) {
        for (const b of bullets) {
          if (Math.hypot(e.x - b.x, e.y - b.y) < 0.04) {
            e.y = 2;
            b.y = -1;
            bumpScore(ctx, 10);
          }
        }
        if (e.y > 0.92 && Math.abs(e.x - playerX) < 0.06) gameOver(ctx);
      }
      enemies = enemies.filter((e) => e.y < 1.1);
    },
    draw(ctx) {
      clearNeon(ctx, '#05050a', '#041018');
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(playerX * ctx.width - 18, ctx.height * 0.9, 36, 12);
      ctx.ctx.fillStyle = '#7cff6b';
      bullets.forEach((b) => ctx.ctx.fillRect(b.x * ctx.width - 2, b.y * ctx.height, 4, 10));
      ctx.ctx.fillStyle = '#ff2bd6';
      enemies.forEach((e) => {
        ctx.ctx.beginPath();
        ctx.ctx.arc(e.x * ctx.width, e.y * ctx.height, 10, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      hud(ctx, 'A/D move · Space fire');
    },
  };
};

export const pixelRunner: GameFactory = () => {
  let y = 0;
  let vy = 0;
  let ground = true;
  let obstacles: { x: number; w: number; h: number }[] = [];
  let speed = 220;
  const reset = () => {
    y = 0;
    vy = 0;
    ground = true;
    obstacles = [];
    speed = 220;
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      speed += 8 * ctx.dt;
      bumpScore(ctx, ctx.dt * 12);
      if ((ctx.keys.has(' ') || ctx.keys.has('arrowup') || ctx.pointer.down) && ground) {
        vy = -420;
        ground = false;
      }
      vy += 1400 * ctx.dt;
      y += vy * ctx.dt;
      if (y >= 0) {
        y = 0;
        vy = 0;
        ground = true;
      }
      if (Math.random() < 0.02) obstacles.push({ x: ctx.width + 20, w: rand(20, 40), h: rand(30, 70) });
      obstacles.forEach((o) => (o.x -= speed * ctx.dt));
      obstacles = obstacles.filter((o) => o.x > -50);
      const px = 80;
      const py = ctx.height * 0.75 + y;
      for (const o of obstacles) {
        if (px < o.x + o.w && px + 28 > o.x && py < ctx.height * 0.75 && py + 28 > ctx.height * 0.75 - o.h) {
          gameOver(ctx);
        }
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#0a0510', '#12081c');
      ctx.ctx.strokeStyle = 'rgba(0,240,255,0.25)';
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(0, ctx.height * 0.75 + 28);
      ctx.ctx.lineTo(ctx.width, ctx.height * 0.75 + 28);
      ctx.ctx.stroke();
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(80, ctx.height * 0.75 + y, 28, 28);
      ctx.ctx.fillStyle = '#ff2bd6';
      obstacles.forEach((o) => ctx.ctx.fillRect(o.x, ctx.height * 0.75 + 28 - o.h, o.w, o.h));
      hud(ctx, 'Space / tap to jump');
    },
  };
};

export const galaxyAssault: GameFactory = () => {
  let ship = { x: 0.5, y: 0.8 };
  let shots: { x: number; y: number }[] = [];
  let foes: { x: number; y: number; hp: number }[] = [];
  let t = 0;
  const reset = () => {
    ship = { x: 0.5, y: 0.8 };
    shots = [];
    foes = [];
    t = 0;
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      t += ctx.dt;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) ship.x -= 0.6 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) ship.x += 0.6 * ctx.dt;
      if (ctx.keys.has('w') || ctx.keys.has('arrowup')) ship.y -= 0.5 * ctx.dt;
      if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) ship.y += 0.5 * ctx.dt;
      ship.x = clamp(ship.x, 0.05, 0.95);
      ship.y = clamp(ship.y, 0.1, 0.92);
      if (ctx.keys.has(' ') && Math.random() > 0.7) shots.push({ x: ship.x, y: ship.y });
      shots.forEach((s) => (s.y -= 1.4 * ctx.dt));
      shots = shots.filter((s) => s.y > 0);
      if (t > 0.6) {
        t = 0;
        foes.push({ x: rand(0.1, 0.9), y: -0.05, hp: 2 });
      }
      foes.forEach((f) => (f.y += 0.2 * ctx.dt));
      for (const f of foes) {
        for (const s of shots) {
          if (Math.hypot(f.x - s.x, f.y - s.y) < 0.045) {
            f.hp -= 1;
            s.y = -1;
            if (f.hp <= 0) bumpScore(ctx, 25);
          }
        }
        if (Math.hypot(f.x - ship.x, f.y - ship.y) < 0.05) gameOver(ctx);
      }
      foes = foes.filter((f) => f.y < 1.1 && f.hp > 0);
    },
    draw(ctx) {
      clearNeon(ctx);
      for (let i = 0; i < 40; i++) {
        ctx.ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.ctx.fillRect((i * 97) % ctx.width, (i * 53 + ctx.time * 30) % ctx.height, 2, 2);
      }
      ctx.ctx.fillStyle = '#7cff6b';
      shots.forEach((s) => ctx.ctx.fillRect(s.x * ctx.width - 2, s.y * ctx.height, 4, 12));
      ctx.ctx.fillStyle = '#ff2bd6';
      foes.forEach((f) => ctx.ctx.fillRect(f.x * ctx.width - 14, f.y * ctx.height - 10, 28, 20));
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(ship.x * ctx.width, ship.y * ctx.height - 14);
      ctx.ctx.lineTo(ship.x * ctx.width - 14, ship.y * ctx.height + 12);
      ctx.ctx.lineTo(ship.x * ctx.width + 14, ship.y * ctx.height + 12);
      ctx.ctx.fill();
      hud(ctx, 'WASD move · Space fire');
    },
  };
};

export const snakeEvolution: GameFactory = () => {
  let dir = { x: 1, y: 0 };
  let body: { x: number; y: number }[] = [{ x: 8, y: 8 }];
  let food = { x: 14, y: 10 };
  let acc = 0;
  const cols = 24;
  const rows = 16;
  const reset = () => {
    dir = { x: 1, y: 0 };
    body = [{ x: 8, y: 8 }];
    food = { x: 14, y: 10 };
    acc = 0;
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('arrowup') && dir.y === 0) dir = { x: 0, y: -1 };
      if (ctx.keys.has('arrowdown') && dir.y === 0) dir = { x: 0, y: 1 };
      if (ctx.keys.has('arrowleft') && dir.x === 0) dir = { x: -1, y: 0 };
      if (ctx.keys.has('arrowright') && dir.x === 0) dir = { x: 1, y: 0 };
      acc += ctx.dt;
      if (acc < 0.12) return;
      acc = 0;
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || body.some((b) => b.x === head.x && b.y === head.y)) {
        gameOver(ctx);
        return;
      }
      body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        bumpScore(ctx, 10);
        food = { x: Math.floor(rand(0, cols)), y: Math.floor(rand(0, rows)) };
      } else body.pop();
    },
    draw(ctx) {
      clearNeon(ctx, '#050a08', '#081410');
      const cw = ctx.width / cols;
      const ch = ctx.height / rows;
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.fillRect(food.x * cw, food.y * ch, cw - 2, ch - 2);
      body.forEach((b, i) => {
        ctx.ctx.fillStyle = i === 0 ? '#00f0ff' : '#7cff6b';
        ctx.ctx.fillRect(b.x * cw, b.y * ch, cw - 2, ch - 2);
      });
      hud(ctx, 'Arrow keys to steer');
    },
  };
};

export const brickDestroyer: GameFactory = () => {
  let paddle = 0.5;
  let ball = { x: 0.5, y: 0.7, vx: 0.35, vy: -0.45 };
  let bricks: { x: number; y: number; alive: boolean }[] = [];
  const initBricks = () => {
    bricks = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) bricks.push({ x: c, y: r, alive: true });
  };
  initBricks();
  const reset = () => {
    paddle = 0.5;
    ball = { x: 0.5, y: 0.7, vx: 0.35, vy: -0.45 };
    initBricks();
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) paddle -= 0.7 * ctx.dt;
      if (ctx.keys.has('arrowright') || ctx.keys.has('d')) paddle += 0.7 * ctx.dt;
      if (ctx.pointer.down) paddle = ctx.pointer.x / ctx.width;
      paddle = clamp(paddle, 0.1, 0.9);
      ball.x += ball.vx * ctx.dt;
      ball.y += ball.vy * ctx.dt;
      if (ball.x < 0.02 || ball.x > 0.98) ball.vx *= -1;
      if (ball.y < 0.02) ball.vy *= -1;
      if (ball.y > 0.9 && Math.abs(ball.x - paddle) < 0.1) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx += (ball.x - paddle) * 1.5;
      }
      if (ball.y > 1.05) gameOver(ctx);
      const bw = 0.09;
      const bh = 0.05;
      for (const b of bricks) {
        if (!b.alive) continue;
        const bx = 0.05 + b.x * bw;
        const by = 0.08 + b.y * bh;
        if (ball.x > bx && ball.x < bx + bw - 0.01 && ball.y > by && ball.y < by + bh - 0.01) {
          b.alive = false;
          ball.vy *= -1;
          bumpScore(ctx, 15);
        }
      }
      if (bricks.every((b) => !b.alive)) initBricks();
    },
    draw(ctx) {
      clearNeon(ctx, '#080510', '#100818');
      bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.ctx.fillStyle = b.y % 2 ? '#ff2bd6' : '#00f0ff';
        ctx.ctx.fillRect((0.05 + b.x * 0.09) * ctx.width, (0.08 + b.y * 0.05) * ctx.height, ctx.width * 0.08, ctx.height * 0.035);
      });
      ctx.ctx.fillStyle = '#7cff6b';
      ctx.ctx.fillRect(paddle * ctx.width - 50, ctx.height * 0.92, 100, 12);
      ctx.ctx.beginPath();
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.arc(ball.x * ctx.width, ball.y * ctx.height, 7, 0, Math.PI * 2);
      ctx.ctx.fill();
      hud(ctx, 'Move paddle · keep the orb alive');
    },
  };
};

export const mazeEscape: GameFactory = () => {
  let map: number[][] = [];
  let px = 1;
  let py = 1;
  let exit = { x: 18, y: 10 };
  let chapter = 1;
  const gen = (seed: number) => {
    const w = 21;
    const h = 13;
    map = Array.from({ length: h }, (_, y) =>
      Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 1 : Math.random() > 0.78 ? 1 : 0)),
    );
    px = 1;
    py = 1;
    map[1][1] = 0;
    exit = { x: w - 2, y: h - 2 };
    map[exit.y][exit.x] = 0;
    void seed;
  };
  gen(1);
  const reset = () => {
    chapter = 1;
    gen(chapter);
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      const tryMove = (dx: number, dy: number) => {
        const nx = px + dx;
        const ny = py + dy;
        if (map[ny]?.[nx] === 0) {
          px = nx;
          py = ny;
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
      if (px === exit.x && py === exit.y) {
        bumpScore(ctx, 100);
        chapter += 1;
        gen(chapter);
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#05080a', '#0a1418');
      const h = map.length;
      const w = map[0].length;
      const cw = ctx.width / w;
      const ch = ctx.height / h;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (map[y][x]) {
            ctx.ctx.fillStyle = 'rgba(0,240,255,0.2)';
            ctx.ctx.fillRect(x * cw, y * ch, cw - 1, ch - 1);
          }
        }
      }
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.fillRect(exit.x * cw, exit.y * ch, cw - 1, ch - 1);
      ctx.ctx.fillStyle = '#ff2bd6';
      ctx.ctx.fillRect(px * cw + 2, py * ch + 2, cw - 5, ch - 5);
      hud(ctx, `Endless chapter ${chapter} · arrows to move`);
    },
  };
};

/** Compact factories for remaining titles */
function shooterFactory(enemyColor: string, label: string): GameFactory {
  return () => {
    let x = 0.5;
    let shots: { x: number; y: number }[] = [];
    let enemies: { x: number; y: number }[] = [];
    const reset = () => {
      x = 0.5;
      shots = [];
      enemies = [];
    };
    return {
      update(ctx) {
        restartKey(ctx, reset);
        if (!ctx.alive) return;
        if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) x -= 0.7 * ctx.dt;
        if (ctx.keys.has('arrowright') || ctx.keys.has('d')) x += 0.7 * ctx.dt;
        x = clamp(x, 0.05, 0.95);
        if (ctx.keys.has(' ') || ctx.pointer.down) shots.push({ x, y: 0.85 });
        shots.forEach((s) => (s.y -= 1.3 * ctx.dt));
        shots = shots.filter((s) => s.y > 0).slice(-40);
        if (Math.random() < 0.04) enemies.push({ x: rand(0.05, 0.95), y: 0 });
        enemies.forEach((e) => (e.y += 0.25 * ctx.dt));
        for (const e of enemies) {
          for (const s of shots) {
            if (Math.hypot(e.x - s.x, e.y - s.y) < 0.04) {
              e.y = 2;
              s.y = -1;
              bumpScore(ctx, 12);
            }
          }
          if (e.y > 0.9 && Math.abs(e.x - x) < 0.07) gameOver(ctx);
        }
        enemies = enemies.filter((e) => e.y < 1.05);
      },
      draw(ctx) {
        clearNeon(ctx);
        ctx.ctx.fillStyle = '#00f0ff';
        ctx.ctx.fillRect(x * ctx.width - 16, ctx.height * 0.88, 32, 14);
        ctx.ctx.fillStyle = '#7cff6b';
        shots.forEach((s) => ctx.ctx.fillRect(s.x * ctx.width - 2, s.y * ctx.height, 4, 10));
        ctx.ctx.fillStyle = enemyColor;
        enemies.forEach((e) => {
          ctx.ctx.beginPath();
          ctx.ctx.arc(e.x * ctx.width, e.y * ctx.height, 11, 0, Math.PI * 2);
          ctx.ctx.fill();
        });
        hud(ctx, label);
      },
    };
  };
}

export const tankArena = shooterFactory('#ffc857', 'Tank Arena · A/D + Space');
export const alienBlaster = shooterFactory('#7cff6b', 'Alien Blaster · clear the swarm');
export const skyShooter = shooterFactory('#a78bfa', 'Sky Shooter · defend the cloudline');

export const fruitSlice: GameFactory = () => {
  let fruits: { x: number; y: number; vy: number; bomb: boolean }[] = [];
  const reset = () => {
    fruits = [];
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      if (Math.random() < 0.05) fruits.push({ x: rand(0.1, 0.9), y: 1.1, vy: -rand(0.7, 1.1), bomb: Math.random() < 0.15 });
      fruits.forEach((f) => {
        f.y += f.vy * ctx.dt;
        f.vy += 0.9 * ctx.dt;
      });
      if (ctx.pointer.down) {
        for (const f of fruits) {
          if (Math.hypot(f.x * ctx.width - ctx.pointer.x, f.y * ctx.height - ctx.pointer.y) < 28) {
            if (f.bomb) gameOver(ctx);
            else {
              bumpScore(ctx, 8);
              f.y = 2;
            }
          }
        }
      }
      fruits = fruits.filter((f) => f.y < 1.3);
    },
    draw(ctx) {
      clearNeon(ctx, '#0a1008', '#101808');
      fruits.forEach((f) => {
        ctx.ctx.fillStyle = f.bomb ? '#ff2bd6' : '#ffc857';
        ctx.ctx.beginPath();
        ctx.ctx.arc(f.x * ctx.width, f.y * ctx.height, 16, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      hud(ctx, 'Swipe / click fruits · avoid magenta bombs');
    },
  };
};

export const towerDefender: GameFactory = () => {
  let towers: { x: number; y: number }[] = [];
  let creeps: { x: number; hp: number }[] = [];
  let gold = 50;
  const reset = () => {
    towers = [];
    creeps = [];
    gold = 50;
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.pointer.down && gold >= 20) {
        towers.push({ x: ctx.pointer.x, y: ctx.height * 0.55 });
        gold -= 20;
        ctx.pointer.down = false;
      }
      if (Math.random() < 0.03 + ctx.time * 0.0005) creeps.push({ x: 0, hp: 3 + Math.floor(ctx.time / 20) });
      creeps.forEach((c) => (c.x += 40 * ctx.dt));
      for (const t of towers) {
        for (const c of creeps) {
          if (Math.hypot(t.x - c.x, t.y - ctx.height * 0.7) < 80 && Math.random() < 0.08) {
            c.hp -= 1;
            if (c.hp <= 0) {
              bumpScore(ctx, 20);
              gold += 8;
            }
          }
        }
      }
      if (creeps.some((c) => c.x > ctx.width)) gameOver(ctx);
      creeps = creeps.filter((c) => c.hp > 0 && c.x <= ctx.width);
    },
    draw(ctx) {
      clearNeon(ctx, '#050812', '#081018');
      ctx.ctx.strokeStyle = 'rgba(0,240,255,0.3)';
      ctx.ctx.strokeRect(0, ctx.height * 0.65, ctx.width, 30);
      ctx.ctx.fillStyle = '#00f0ff';
      towers.forEach((t) => ctx.ctx.fillRect(t.x - 8, t.y - 8, 16, 16));
      ctx.ctx.fillStyle = '#ff2bd6';
      creeps.forEach((c) => ctx.ctx.fillRect(c.x, ctx.height * 0.68, 18, 18));
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.fillText(`Energy ${gold}`, 16, 48);
      hud(ctx, 'Click to place towers (20 energy)');
    },
  };
};

export const endlessRacer: GameFactory = () => {
  let lane = 1;
  let cars: { lane: number; y: number }[] = [];
  let speed = 280;
  const reset = () => {
    lane = 1;
    cars = [];
    speed = 280;
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      speed += 5 * ctx.dt;
      bumpScore(ctx, ctx.dt * 15);
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
      if (Math.random() < 0.03) cars.push({ lane: Math.floor(rand(0, 3)), y: -40 });
      cars.forEach((c) => (c.y += speed * ctx.dt));
      cars = cars.filter((c) => c.y < ctx.height + 40);
      for (const c of cars) {
        if (c.lane === lane && c.y > ctx.height * 0.7 && c.y < ctx.height * 0.7 + 50) gameOver(ctx);
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#05050a', '#0a1020');
      const lw = ctx.width / 3;
      for (let i = 1; i < 3; i++) {
        ctx.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.ctx.beginPath();
        ctx.ctx.moveTo(i * lw, 0);
        ctx.ctx.lineTo(i * lw, ctx.height);
        ctx.ctx.stroke();
      }
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(lane * lw + lw * 0.25, ctx.height * 0.72, lw * 0.5, 48);
      ctx.ctx.fillStyle = '#ff2bd6';
      cars.forEach((c) => ctx.ctx.fillRect(c.lane * lw + lw * 0.25, c.y, lw * 0.5, 48));
      hud(ctx, 'Change lanes · survive the neon highway');
    },
  };
};

export const zombieSurvival: GameFactory = () => {
  let player = { x: 0.5, y: 0.5 };
  let zombies: { x: number; y: number }[] = [];
  let cooldown = 0;
  const reset = () => {
    player = { x: 0.5, y: 0.5 };
    zombies = [];
    cooldown = 0;
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      const sp = 0.35;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) player.x -= sp * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) player.x += sp * ctx.dt;
      if (ctx.keys.has('w') || ctx.keys.has('arrowup')) player.y -= sp * ctx.dt;
      if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) player.y += sp * ctx.dt;
      player.x = clamp(player.x, 0.05, 0.95);
      player.y = clamp(player.y, 0.05, 0.95);
      cooldown -= ctx.dt;
      if ((ctx.keys.has(' ') || ctx.pointer.down) && cooldown <= 0) {
        zombies = zombies.filter((z) => Math.hypot(z.x - player.x, z.y - player.y) > 0.12);
        bumpScore(ctx, 5);
        cooldown = 0.35;
      }
      if (Math.random() < 0.04) zombies.push({ x: Math.random() > 0.5 ? 0 : 1, y: rand(0, 1) });
      zombies.forEach((z) => {
        const dx = player.x - z.x;
        const dy = player.y - z.y;
        const d = Math.hypot(dx, dy) || 1;
        z.x += (dx / d) * 0.12 * ctx.dt;
        z.y += (dy / d) * 0.12 * ctx.dt;
        if (d < 0.04) gameOver(ctx);
      });
    },
    draw(ctx) {
      clearNeon(ctx, '#0a0505', '#140808');
      ctx.ctx.fillStyle = '#7cff6b';
      zombies.forEach((z) => {
        ctx.ctx.beginPath();
        ctx.ctx.arc(z.x * ctx.width, z.y * ctx.height, 12, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.beginPath();
      ctx.ctx.arc(player.x * ctx.width, player.y * ctx.height, 14, 0, Math.PI * 2);
      ctx.ctx.fill();
      hud(ctx, 'WASD move · Space pulse blast');
    },
  };
};

export const wordPuzzle: GameFactory = () => {
  const words = ['NEON', 'PULSE', 'VOID', 'AETHER', 'QUEST', 'REALM'];
  let word = words[0];
  let input = '';
  const reset = () => {
    word = words[Math.floor(Math.random() * words.length)];
    input = '';
  };
  reset();
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      for (const k of [...ctx.keys]) {
        if (k.length === 1 && /[a-z]/.test(k)) {
          input += k.toUpperCase();
          ctx.keys.delete(k);
        }
        if (k === 'backspace') {
          input = input.slice(0, -1);
          ctx.keys.delete(k);
        }
      }
      if (input === word) {
        bumpScore(ctx, 50);
        reset();
      }
      if (input.length > word.length) input = '';
    },
    draw(ctx) {
      clearNeon(ctx, '#050510', '#0a0a18');
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.font = '700 36px Orbitron, sans-serif';
      ctx.ctx.fillText(word, ctx.width / 2 - 60, ctx.height / 2 - 20);
      ctx.ctx.fillStyle = '#ffc857';
      ctx.ctx.font = '24px Sora, sans-serif';
      ctx.ctx.fillText(input || '_'.repeat(word.length), ctx.width / 2 - 50, ctx.height / 2 + 30);
      hud(ctx, 'Type the glowing word');
    },
  };
};

export const sudokuGame: GameFactory = () => {
  const puzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];
  let grid = puzzle.map((r) => [...r]);
  let sel = { x: 0, y: 0 };
  const reset = () => {
    grid = puzzle.map((r) => [...r]);
    sel = { x: 0, y: 0 };
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.pointer.down) {
        const cell = Math.min(8, Math.floor((ctx.pointer.x / ctx.width) * 9));
        const row = Math.min(8, Math.floor((ctx.pointer.y / ctx.height) * 9));
        sel = { x: cell, y: row };
      }
      for (let n = 1; n <= 9; n++) {
        if (ctx.keys.has(String(n)) && puzzle[sel.y][sel.x] === 0) {
          grid[sel.y][sel.x] = n;
          ctx.keys.delete(String(n));
          bumpScore(ctx, 2);
        }
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#05080a', '#0a1210');
      const s = Math.min(ctx.width, ctx.height) * 0.9;
      const ox = (ctx.width - s) / 2;
      const oy = (ctx.height - s) / 2;
      const cs = s / 9;
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          ctx.ctx.strokeStyle = x % 3 === 0 && y % 3 === 0 ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.15)';
          ctx.ctx.strokeRect(ox + x * cs, oy + y * cs, cs, cs);
          if (sel.x === x && sel.y === y) {
            ctx.ctx.fillStyle = 'rgba(0,240,255,0.15)';
            ctx.ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs);
          }
          if (grid[y][x]) {
            ctx.ctx.fillStyle = puzzle[y][x] ? '#00f0ff' : '#ffc857';
            ctx.ctx.font = '16px Sora, sans-serif';
            ctx.ctx.fillText(String(grid[y][x]), ox + x * cs + cs * 0.35, oy + y * cs + cs * 0.65);
          }
        }
      }
      hud(ctx, 'Click cell · press 1-9');
    },
  };
};

function boardGame(kind: 'chess' | 'checkers'): GameFactory {
  return () => {
    let selected: { x: number; y: number } | null = null;
    let board: (string | null)[][] = [];
    const reset = () => {
      selected = null;
      board = Array.from({ length: 8 }, () => Array(8).fill(null));
      if (kind === 'chess') {
        const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
        for (let i = 0; i < 8; i++) {
          board[0][i] = 'b' + back[i];
          board[1][i] = 'bP';
          board[6][i] = 'wP';
          board[7][i] = 'w' + back[i];
        }
      } else {
        for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) board[y][x] = 'b';
        for (let y = 5; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2) board[y][x] = 'w';
      }
    };
    reset();
    return {
      update(ctx) {
        restartKey(ctx, reset);
        if (!ctx.alive) return;
        if (ctx.pointer.down) {
          const x = Math.min(7, Math.floor((ctx.pointer.x / ctx.width) * 8));
          const y = Math.min(7, Math.floor((ctx.pointer.y / ctx.height) * 8));
          if (!selected) {
            if (board[y][x]) selected = { x, y };
          } else {
            if (!board[y][x] || (board[y][x] || '').startsWith('b')) {
              board[y][x] = board[selected.y][selected.x];
              board[selected.y][selected.x] = null;
              bumpScore(ctx, 5);
            }
            selected = null;
          }
          ctx.pointer.down = false;
        }
      },
      draw(ctx) {
        clearNeon(ctx);
        const s = Math.min(ctx.width, ctx.height);
        const ox = (ctx.width - s) / 2;
        const oy = (ctx.height - s) / 2;
        const cs = s / 8;
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            ctx.ctx.fillStyle = (x + y) % 2 ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)';
            if (selected?.x === x && selected?.y === y) ctx.ctx.fillStyle = 'rgba(255,43,214,0.3)';
            ctx.ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs);
            const p = board[y][x];
            if (p) {
              ctx.ctx.fillStyle = p.startsWith('w') ? '#e8f7ff' : '#ff2bd6';
              ctx.ctx.font = `${Math.floor(cs * 0.45)}px Sora, sans-serif`;
              ctx.ctx.fillText(p.replace(/^[wb]/, ''), ox + x * cs + cs * 0.28, oy + y * cs + cs * 0.62);
            }
          }
        }
        hud(ctx, `${kind === 'chess' ? 'Chess' : 'Checkers'} · click to move`);
      },
    };
  };
}

export const chessGame = boardGame('chess');
export const checkersGame = boardGame('checkers');

export const twentyFortyEight: GameFactory = () => {
  let grid: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
  const spawn = () => {
    const empty: { x: number; y: number }[] = [];
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (!grid[y][x]) empty.push({ x, y });
    if (!empty.length) return false;
    const spot = empty[Math.floor(Math.random() * empty.length)];
    grid[spot.y][spot.x] = Math.random() < 0.9 ? 2 : 4;
    return true;
  };
  const reset = () => {
    grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    spawn();
    spawn();
  };
  reset();
  const slide = (row: number[]) => {
    const filtered = row.filter((n) => n);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        bumpScore({ score: 0 } as EngineContext, filtered[i]);
        filtered[i + 1] = 0;
      }
    }
    return filtered.filter((n) => n).concat(Array(4).fill(0)).slice(0, 4);
  };
  // fix bumpScore misuse - we'll pass real ctx in move
  const move = (ctx: EngineContext, dir: string) => {
    const prev = JSON.stringify(grid);
    if (dir === 'left') grid = grid.map((r) => {
      const filtered = r.filter((n) => n);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          bumpScore(ctx, filtered[i]);
          filtered[i + 1] = 0;
        }
      }
      return filtered.filter((n) => n).concat([0, 0, 0, 0]).slice(0, 4);
    });
    if (dir === 'right') grid = grid.map((r) => {
      const filtered = r.filter((n) => n);
      for (let i = filtered.length - 1; i > 0; i--) {
        if (filtered[i] === filtered[i - 1]) {
          filtered[i] *= 2;
          bumpScore(ctx, filtered[i]);
          filtered[i - 1] = 0;
        }
      }
      const compact = filtered.filter((n) => n);
      return Array(4 - compact.length).fill(0).concat(compact);
    });
    if (dir === 'up' || dir === 'down') {
      for (let x = 0; x < 4; x++) {
        let col = [grid[0][x], grid[1][x], grid[2][x], grid[3][x]];
        if (dir === 'up') {
          const filtered = col.filter((n) => n);
          for (let i = 0; i < filtered.length - 1; i++) {
            if (filtered[i] === filtered[i + 1]) {
              filtered[i] *= 2;
              bumpScore(ctx, filtered[i]);
              filtered[i + 1] = 0;
            }
          }
          col = filtered.filter((n) => n).concat([0, 0, 0, 0]).slice(0, 4);
        } else {
          const filtered = col.filter((n) => n);
          for (let i = filtered.length - 1; i > 0; i--) {
            if (filtered[i] === filtered[i - 1]) {
              filtered[i] *= 2;
              bumpScore(ctx, filtered[i]);
              filtered[i - 1] = 0;
            }
          }
          const compact = filtered.filter((n) => n);
          col = Array(4 - compact.length).fill(0).concat(compact);
        }
        for (let y = 0; y < 4; y++) grid[y][x] = col[y];
      }
    }
    if (JSON.stringify(grid) !== prev) spawn();
    void slide;
  };
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('arrowleft')) {
        move(ctx, 'left');
        ctx.keys.delete('arrowleft');
      }
      if (ctx.keys.has('arrowright')) {
        move(ctx, 'right');
        ctx.keys.delete('arrowright');
      }
      if (ctx.keys.has('arrowup')) {
        move(ctx, 'up');
        ctx.keys.delete('arrowup');
      }
      if (ctx.keys.has('arrowdown')) {
        move(ctx, 'down');
        ctx.keys.delete('arrowdown');
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#08060a', '#120e18');
      const s = Math.min(ctx.width, ctx.height) * 0.85;
      const ox = (ctx.width - s) / 2;
      const oy = (ctx.height - s) / 2;
      const cs = s / 4;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          const v = grid[y][x];
          ctx.ctx.fillStyle = v ? `rgba(0,240,255,${0.15 + Math.log2(v) * 0.05})` : 'rgba(255,255,255,0.04)';
          ctx.ctx.fillRect(ox + x * cs + 4, oy + y * cs + 4, cs - 8, cs - 8);
          if (v) {
            ctx.ctx.fillStyle = '#e8f7ff';
            ctx.ctx.font = '700 22px Orbitron, sans-serif';
            ctx.ctx.fillText(String(v), ox + x * cs + cs * 0.3, oy + y * cs + cs * 0.58);
          }
        }
      }
      hud(ctx, 'Arrow keys to merge tiles');
    },
  };
};

export const bubblePop: GameFactory = () => {
  let angle = -Math.PI / 2;
  let bubbles: { x: number; y: number; color: string }[] = [];
  const colors = ['#00f0ff', '#ff2bd6', '#7cff6b', '#ffc857'];
  const reset = () => {
    angle = -Math.PI / 2;
    bubbles = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) bubbles.push({ x: 0.1 + c * 0.08, y: 0.08 + r * 0.08, color: colors[(r + c) % 4] });
  };
  reset();
  let shot: { x: number; y: number; vx: number; vy: number; color: string } | null = null;
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      angle = Math.atan2(ctx.pointer.y - ctx.height * 0.9, ctx.pointer.x - ctx.width * 0.5);
      if (ctx.pointer.down && !shot) {
        shot = { x: 0.5, y: 0.9, vx: Math.cos(angle) * 0.9, vy: Math.sin(angle) * 0.9, color: colors[Math.floor(Math.random() * 4)] };
        ctx.pointer.down = false;
      }
      if (shot) {
        shot.x += shot.vx * ctx.dt;
        shot.y += shot.vy * ctx.dt;
        if (shot.x < 0.05 || shot.x > 0.95) shot.vx *= -1;
        for (const b of bubbles) {
          if (Math.hypot(b.x - shot.x, b.y - shot.y) < 0.05) {
            if (b.color === shot.color) {
              b.y = -1;
              bumpScore(ctx, 15);
            }
            shot = null;
            break;
          }
        }
        if (shot && shot.y < 0.05) {
          bubbles.push({ x: shot.x, y: 0.06, color: shot.color });
          shot = null;
        }
      }
      bubbles = bubbles.filter((b) => b.y >= 0);
      if (bubbles.some((b) => b.y > 0.75)) gameOver(ctx);
    },
    draw(ctx) {
      clearNeon(ctx, '#050a12', '#081020');
      bubbles.forEach((b) => {
        ctx.ctx.fillStyle = b.color;
        ctx.ctx.beginPath();
        ctx.ctx.arc(b.x * ctx.width, b.y * ctx.height, 14, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.strokeStyle = '#00f0ff';
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(ctx.width * 0.5, ctx.height * 0.9);
      ctx.ctx.lineTo(ctx.width * 0.5 + Math.cos(angle) * 60, ctx.height * 0.9 + Math.sin(angle) * 60);
      ctx.ctx.stroke();
      if (shot) {
        ctx.ctx.fillStyle = shot.color;
        ctx.ctx.beginPath();
        ctx.ctx.arc(shot.x * ctx.width, shot.y * ctx.height, 12, 0, Math.PI * 2);
        ctx.ctx.fill();
      }
      hud(ctx, 'Aim with pointer · click to shoot');
    },
  };
};

export const memoryMatch: GameFactory = () => {
  const icons = ['◆', '●', '▲', '■', '✧', '◈', '★', '⬡'];
  let cards: { icon: string; flipped: boolean; matched: boolean }[] = [];
  let flippedIdx: number[] = [];
  const reset = () => {
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
    cards = deck.map((icon) => ({ icon, flipped: false, matched: false }));
    flippedIdx = [];
  };
  reset();
  return {
    update(ctx) {
      restartKey(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.pointer.down) {
        const cols = 4;
        const x = Math.min(3, Math.floor((ctx.pointer.x / ctx.width) * cols));
        const y = Math.min(3, Math.floor((ctx.pointer.y / ctx.height) * cols));
        const i = y * cols + x;
        if (!cards[i].flipped && !cards[i].matched && flippedIdx.length < 2) {
          cards[i].flipped = true;
          flippedIdx.push(i);
          if (flippedIdx.length === 2) {
            const [a, b] = flippedIdx;
            if (cards[a].icon === cards[b].icon) {
              cards[a].matched = cards[b].matched = true;
              bumpScore(ctx, 20);
              flippedIdx = [];
            } else {
              setTimeout(() => {
                cards[a].flipped = cards[b].flipped = false;
                flippedIdx = [];
              }, 500);
            }
          }
        }
        ctx.pointer.down = false;
      }
      if (cards.every((c) => c.matched)) bumpScore(ctx, 100);
    },
    draw(ctx) {
      clearNeon(ctx, '#080510', '#100818');
      const cols = 4;
      const cw = ctx.width / cols;
      const ch = ctx.height / cols;
      cards.forEach((c, i) => {
        const x = (i % cols) * cw;
        const y = Math.floor(i / cols) * ch;
        ctx.ctx.fillStyle = c.matched ? 'rgba(124,255,107,0.25)' : c.flipped ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.06)';
        ctx.ctx.fillRect(x + 6, y + 6, cw - 12, ch - 12);
        if (c.flipped || c.matched) {
          ctx.ctx.fillStyle = '#e8f7ff';
          ctx.ctx.font = '28px Sora, sans-serif';
          ctx.ctx.fillText(c.icon, x + cw * 0.4, y + ch * 0.55);
        }
      });
      hud(ctx, 'Find matching neon sigils');
    },
  };
};

export const GAME_REGISTRY: Record<string, { title: string; create: GameFactory }> = {
  // Polished Free Tier (growth engine) — explicit keys for discoverability
  'pixel-runner': { title: 'Pixel Runner', create: FREE_GAME_FACTORIES['pixel-runner'].create },
  'galaxy-defender': { title: 'Galaxy Defender', create: FREE_GAME_FACTORIES['galaxy-defender'].create },
  'brick-blast': { title: 'Brick Blast', create: FREE_GAME_FACTORIES['brick-blast'].create },
  'snake-evolution': { title: 'Snake Evolution', create: FREE_GAME_FACTORIES['snake-evolution'].create },
  'neon-drift': { title: 'Neon Drift', create: FREE_GAME_FACTORIES['neon-drift'].create },
  'desert-rally': { title: 'Desert Rally', create: FREE_GAME_FACTORIES['desert-rally'].create },
  'mountain-racer': { title: 'Mountain Racer', create: FREE_GAME_FACTORIES['mountain-racer'].create },
  'street-sprint': { title: 'Street Sprint', create: FREE_GAME_FACTORIES['street-sprint'].create },
  'ancient-temple': { title: 'Ancient Temple', create: FREE_GAME_FACTORIES['ancient-temple'].create },
  'number-master': { title: 'Number Master', create: FREE_GAME_FACTORIES['number-master'].create },
  'logic-blocks': { title: 'Logic Blocks', create: FREE_GAME_FACTORIES['logic-blocks'].create },
  'memory-match': { title: 'Memory Match', create: FREE_GAME_FACTORIES['memory-match'].create },
  'zombie-escape': { title: 'Zombie Escape', create: FREE_GAME_FACTORIES['zombie-escape'].create },
  'shadow-ninja': { title: 'Shadow Ninja', create: FREE_GAME_FACTORIES['shadow-ninja'].create },
  'alien-attack': { title: 'Alien Attack', create: FREE_GAME_FACTORIES['alien-attack'].create },
  'robot-arena': { title: 'Robot Arena', create: FREE_GAME_FACTORIES['robot-arena'].create },
  'jungle-explorer': { title: 'Jungle Explorer', create: FREE_GAME_FACTORIES['jungle-explorer'].create },
  'treasure-hunter': { title: 'Treasure Hunter', create: FREE_GAME_FACTORIES['treasure-hunter'].create },
  'lost-kingdom': { title: 'Lost Kingdom', create: FREE_GAME_FACTORIES['lost-kingdom'].create },
  'crystal-quest': { title: 'Crystal Quest', create: FREE_GAME_FACTORIES['crystal-quest'].create },
  // JGames Premium Signature Originals
  'rise-of-the-forgotten-king': { title: 'Rise of the Forgotten King', create: riseOfTheForgottenKing },
  'neon-velocity': { title: 'Neon Velocity', create: neonVelocity },
  'shadow-assassin': { title: 'Shadow Assassin', create: shadowAssassin },
  'galaxy-hunters': { title: 'Galaxy Hunters', create: galaxyHunters },
  'dragon-legacy': { title: 'Dragon Legacy', create: dragonLegacy },
  'survival-island': { title: 'Survival Island', create: survivalIsland },
  'cyber-detective': { title: 'Cyber Detective', create: cyberDetective },
  'wild-frontier': { title: 'Wild Frontier', create: wildFrontier },
  'kingdom-builders': { title: 'Kingdom Builders', create: kingdomBuilders },
  'ocean-explorer': { title: 'Ocean Explorer', create: oceanExplorer },
  'zombie-frontier': { title: 'Zombie Frontier', create: zombieFrontier },
  'monster-arena': { title: 'Monster Arena', create: monsterArena },
  'ninja-legends': { title: 'Ninja Legends', create: ninjaLegends },
  'speed-legends': { title: 'Speed Legends', create: speedLegends },
  'pirate-seas': { title: 'Pirate Seas', create: pirateSeas },
  'robot-wars': { title: 'Robot Wars', create: robotWars },
  'temple-of-legends': { title: 'Temple of Legends', create: ancientTemple },
  'battle-command': { title: 'Battle Command', create: battleCommand },
  'sky-kingdom': { title: 'Sky Kingdom', create: skyKingdom },
  'infinity-arena': { title: 'Infinity Arena', create: infinityArena },
};

// Register expandable catalog titles as genre-adaptive playable sessions
for (const g of buildExpandedCatalog([])) {
  if (!GAME_REGISTRY[g.slug]) {
    GAME_REGISTRY[g.slug] = {
      title: g.title,
      create: createExpandableGame({ title: g.title, genres: g.genres }),
    };
  }
}
