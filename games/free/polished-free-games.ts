/**
 * JGames Free Tier — polished complete games (growth engine).
 * Unlimited play, fair challenge, secrets & collectibles. No demos.
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
import { createDifficulty, recordOutcome, shouldOfferAssist, consumeAssist } from '../engine/fair-play';

function tip(ctx: EngineContext, text: string) {
  drawScore(ctx);
  ctx.ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.ctx.font = '11px Sora, sans-serif';
  ctx.ctx.fillText(text, 14, ctx.height - 14);
  if (!ctx.alive) {
    ctx.ctx.fillStyle = '#ff2bd6';
    ctx.ctx.font = '700 22px Orbitron, sans-serif';
    ctx.ctx.fillText('TRY AGAIN', ctx.width / 2 - 70, ctx.height / 2);
    ctx.ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.ctx.font = '12px Sora, sans-serif';
    ctx.ctx.fillText('Tap RESTART below · or press R', ctx.width / 2 - 100, ctx.height / 2 + 28);
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

function secretToast(ctx: EngineContext, found: boolean, label: string) {
  if (!found) return;
  ctx.ctx.fillStyle = '#ffc857';
  ctx.ctx.font = '12px Orbitron, sans-serif';
  ctx.ctx.fillText(`✦ Secret: ${label}`, 14, 48);
}

/** Pixel Runner — endless neon parkour */
export const pixelRunnerFree: GameFactory = () => {
  let y = 0.72;
  let vy = 0;
  let gems = 0;
  let secret = false;
  let obstacles: { x: number; h: number; gem?: boolean }[] = [];
  let diff = createDifficulty();
  const reset = () => {
    y = 0.72;
    vy = 0;
    obstacles = [];
    secret = false;
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      bumpScore(ctx, ctx.dt * (22 * diff.scale));
      if ((ctx.keys.has(' ') || ctx.keys.has('arrowup') || ctx.pointer.down) && y >= 0.71) vy = -0.95;
      vy += 2.4 * ctx.dt;
      y = clamp(y + vy * ctx.dt, 0.15, 0.72);
      if (y >= 0.72) vy = 0;
      if (Math.random() < 0.018 * diff.scale) {
        const gem = Math.random() < 0.2;
        obstacles.push({ x: 1.12, h: rand(0.1, 0.26), gem });
      }
      if (Math.random() < 0.002 && !secret) {
        secret = true;
        bumpScore(ctx, 200);
        gems += 5;
      }
      obstacles.forEach((o) => (o.x -= (0.42 + ctx.score * 0.00002) * diff.scale * ctx.dt));
      obstacles = obstacles.filter((o) => {
        if (o.x < 0.2 && o.x > 0.08 && o.gem && y < 0.55) {
          gems += 1;
          bumpScore(ctx, 40);
          return false;
        }
        return o.x > -0.1;
      });
      for (const o of obstacles) {
        if (!o.gem && o.x < 0.22 && o.x > 0.08 && y > 0.72 - o.h - 0.02) {
          diff = recordOutcome(diff, false);
          if (shouldOfferAssist(diff)) {
            diff = consumeAssist(diff);
            obstacles = [];
            bumpScore(ctx, 10);
          } else gameOver(ctx);
        }
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#060816', '#101838');
      ctx.ctx.fillStyle = 'rgba(0,240,255,0.2)';
      ctx.ctx.fillRect(0, ctx.height * 0.8, ctx.width, 4);
      obstacles.forEach((o) => {
        ctx.ctx.fillStyle = o.gem ? '#ffc857' : '#ff2bd6';
        ctx.ctx.fillRect(o.x * ctx.width, ctx.height * (0.8 - o.h), o.gem ? 14 : 18, o.h * ctx.height);
      });
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(ctx.width * 0.12, y * ctx.height, 26, 26);
      secretToast(ctx, secret, 'Neon Alley');
      tip(ctx, `Pixel Runner · Tap JUMP / drag up · gems ${gems}`);
    },
  };
};

/** Galaxy Defender */
export const galaxyDefender: GameFactory = () => {
  let px = 0.5;
  let bullets: { x: number; y: number }[] = [];
  let foes: { x: number; y: number; hp: number }[] = [];
  let cd = 0;
  let crystals = 0;
  let secret = false;
  const reset = () => {
    px = 0.5;
    bullets = [];
    foes = [];
    cd = 0;
    secret = false;
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) px -= 0.55 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) px += 0.55 * ctx.dt;
      px = clamp(px, 0.05, 0.95);
      cd -= ctx.dt;
      if ((ctx.keys.has(' ') || ctx.pointer.down) && cd <= 0) {
        bullets.push({ x: px, y: 0.86 });
        cd = 0.14;
      }
      bullets.forEach((b) => (b.y -= 0.95 * ctx.dt));
      bullets = bullets.filter((b) => b.y > -0.05);
      if (Math.random() < 0.04) foes.push({ x: rand(0.08, 0.92), y: -0.05, hp: 1 + Math.floor(ctx.score / 400) });
      if (Math.random() < 0.0015 && !secret) {
        secret = true;
        crystals += 3;
        bumpScore(ctx, 250);
      }
      foes.forEach((f) => (f.y += 0.22 * ctx.dt));
      for (const f of foes) {
        for (const b of bullets) {
          if (Math.hypot(f.x - b.x, f.y - b.y) < 0.04) {
            f.hp -= 1;
            b.y = -1;
            if (f.hp <= 0) {
              bumpScore(ctx, 20);
              if (Math.random() < 0.15) crystals += 1;
            }
          }
        }
        if (f.y > 0.9 || (Math.hypot(f.x - px, f.y - 0.88) < 0.05 && f.hp > 0)) gameOver(ctx);
      }
      foes = foes.filter((f) => f.hp > 0 && f.y < 1.05);
    },
    draw(ctx) {
      clearNeon(ctx, '#040818', '#0a1430');
      bullets.forEach((b) => {
        ctx.ctx.fillStyle = '#00f0ff';
        ctx.ctx.fillRect(b.x * ctx.width - 2, b.y * ctx.height, 4, 12);
      });
      foes.forEach((f) => {
        ctx.ctx.fillStyle = '#a78bfa';
        ctx.ctx.beginPath();
        ctx.ctx.arc(f.x * ctx.width, f.y * ctx.height, 12, 0, Math.PI * 2);
        ctx.ctx.fill();
      });
      ctx.ctx.fillStyle = '#e8f7ff';
      ctx.ctx.fillRect(px * ctx.width - 16, ctx.height * 0.88, 32, 18);
      secretToast(ctx, secret, 'Void Cache');
      tip(ctx, `Galaxy Defender · Pads + FIRE · crystals ${crystals}`);
    },
  };
};

/** Brick Blast */
export const brickBlast: GameFactory = () => {
  let paddle = 0.5;
  let ball = { x: 0.5, y: 0.7, vx: 0.35, vy: -0.4 };
  let bricks: { x: number; y: number; alive: boolean; rare?: boolean }[] = [];
  let secret = false;
  const build = () => {
    bricks = [];
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 8; c++)
        bricks.push({ x: 0.08 + c * 0.11, y: 0.12 + r * 0.07, alive: true, rare: Math.random() < 0.08 });
  };
  const reset = () => {
    paddle = 0.5;
    ball = { x: 0.5, y: 0.7, vx: 0.35, vy: -0.4 };
    build();
    secret = false;
  };
  reset();
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) paddle -= 0.7 * ctx.dt;
      if (ctx.keys.has('d') || ctx.keys.has('arrowright')) paddle += 0.7 * ctx.dt;
      paddle = clamp(paddle, 0.1, 0.9);
      ball.x += ball.vx * ctx.dt;
      ball.y += ball.vy * ctx.dt;
      if (ball.x < 0.02 || ball.x > 0.98) ball.vx *= -1;
      if (ball.y < 0.04) ball.vy *= -1;
      if (ball.y > 0.88 && Math.abs(ball.x - paddle) < 0.1) {
        ball.vy = -Math.abs(ball.vy);
        ball.vx += (ball.x - paddle) * 1.5;
      }
      if (ball.y > 1.02) gameOver(ctx);
      for (const b of bricks) {
        if (!b.alive) continue;
        if (Math.abs(ball.x - b.x) < 0.055 && Math.abs(ball.y - b.y) < 0.04) {
          b.alive = false;
          ball.vy *= -1;
          bumpScore(ctx, b.rare ? 50 : 15);
          if (b.rare) secret = true;
        }
      }
      if (bricks.every((b) => !b.alive)) {
        bumpScore(ctx, 200);
        build();
        ball.vy *= 1.05;
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#0a0614', '#180828');
      bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.ctx.fillStyle = b.rare ? '#ffc857' : '#ff2bd6';
        ctx.ctx.fillRect(b.x * ctx.width - 22, b.y * ctx.height - 10, 44, 18);
      });
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(paddle * ctx.width - 40, ctx.height * 0.9, 80, 12);
      ctx.ctx.beginPath();
      ctx.ctx.arc(ball.x * ctx.width, ball.y * ctx.height, 8, 0, Math.PI * 2);
      ctx.ctx.fill();
      secretToast(ctx, secret, 'Gold Brick');
      tip(ctx, 'Brick Blast · Hold ◀ ▶ pads');
    },
  };
};

/** Snake Evolution */
export const snakeEvolutionFree: GameFactory = () => {
  let body: { x: number; y: number }[] = [{ x: 10, y: 10 }];
  let dir = { x: 1, y: 0 };
  let food = { x: 15, y: 10 };
  let relic = { x: 5, y: 5, show: false };
  let acc = 0;
  const reset = () => {
    body = [{ x: 10, y: 10 }];
    dir = { x: 1, y: 0 };
    food = { x: 15, y: 10 };
    relic = { x: 5, y: 5, show: Math.random() > 0.5 };
    acc = 0;
  };
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('arrowup') && dir.y === 0) dir = { x: 0, y: -1 };
      if (ctx.keys.has('arrowdown') && dir.y === 0) dir = { x: 0, y: 1 };
      if (ctx.keys.has('arrowleft') && dir.x === 0) dir = { x: -1, y: 0 };
      if (ctx.keys.has('arrowright') && dir.x === 0) dir = { x: 1, y: 0 };
      acc += ctx.dt;
      const step = Math.max(0.08, 0.16 - body.length * 0.002);
      if (acc < step) return;
      acc = 0;
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= 24 || head.y >= 16 || body.some((s) => s.x === head.x && s.y === head.y)) {
        gameOver(ctx);
        return;
      }
      body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        bumpScore(ctx, 20);
        food = { x: Math.floor(rand(0, 24)), y: Math.floor(rand(0, 16)) };
      } else if (relic.show && head.x === relic.x && head.y === relic.y) {
        bumpScore(ctx, 100);
        relic.show = false;
      } else body.pop();
    },
    draw(ctx) {
      clearNeon(ctx, '#061410', '#0c2418');
      const cw = ctx.width / 24;
      const ch = ctx.height / 16;
      body.forEach((s, i) => {
        ctx.ctx.fillStyle = i === 0 ? '#00f0ff' : '#7cff6b';
        ctx.ctx.fillRect(s.x * cw + 1, s.y * ch + 1, cw - 2, ch - 2);
      });
      ctx.ctx.fillStyle = '#ff2bd6';
      ctx.ctx.fillRect(food.x * cw + 2, food.y * ch + 2, cw - 4, ch - 4);
      if (relic.show) {
        ctx.ctx.fillStyle = '#ffc857';
        ctx.ctx.fillRect(relic.x * cw + 2, relic.y * ch + 2, cw - 4, ch - 4);
      }
      tip(ctx, 'Snake Evolution · D-pad / drag · golden relic');
    },
  };
};

function makeRacer(title: string, bg1: string, bg2: string, accent: string): GameFactory {
  return () => {
    let lane = 1;
    let cars: { lane: number; y: number }[] = [];
    let speed = 240;
    let coins = 0;
    let secret = false;
    let nitro = 0;
    const reset = () => {
      lane = 1;
      cars = [];
      speed = 240;
      secret = false;
      nitro = 0;
    };
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        speed += 8 * ctx.dt;
        bumpScore(ctx, ctx.dt * (16 + (nitro > 0 ? 10 : 0)));
        if (nitro > 0) nitro -= ctx.dt;
        if (ctx.keys.has(' ') && nitro <= 0) nitro = 1.2;
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
        if (Math.random() < 0.01) coins += 1;
        if (Math.random() < 0.0015 && !secret) {
          secret = true;
          bumpScore(ctx, 180);
        }
        const spd = speed * (nitro > 0 ? 1.35 : 1);
        cars.forEach((c) => (c.y += spd * ctx.dt));
        cars = cars.filter((c) => c.y < ctx.height + 40);
        for (const c of cars) {
          if (c.lane === lane && c.y > ctx.height * 0.68 && c.y < ctx.height * 0.68 + 50) gameOver(ctx);
        }
      },
      draw(ctx) {
        clearNeon(ctx, bg1, bg2);
        const lw = ctx.width / 3;
        for (let i = 1; i < 3; i++) {
          ctx.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.ctx.beginPath();
          ctx.ctx.moveTo(i * lw, 0);
          ctx.ctx.lineTo(i * lw, ctx.height);
          ctx.ctx.stroke();
        }
        cars.forEach((c) => {
          ctx.ctx.fillStyle = accent;
          ctx.ctx.fillRect(c.lane * lw + lw * 0.25, c.y, lw * 0.5, 40);
        });
        ctx.ctx.fillStyle = '#00f0ff';
        ctx.ctx.fillRect(lane * lw + lw * 0.25, ctx.height * 0.7, lw * 0.5, 48);
        secretToast(ctx, secret, 'Shortcut');
        tip(ctx, `${title} · Steer pads · NITRO · coins ${coins}`);
      },
    };
  };
}

export const neonDrift = makeRacer('Neon Drift', '#050518', '#0a1030', '#ff2bd6');
export const desertRally = makeRacer('Desert Rally', '#1a1208', '#2a1c0c', '#ffc857');
export const mountainRacer = makeRacer('Mountain Racer', '#0a1218', '#142028', '#7aa2ff');
export const streetSprint = makeRacer('Street Sprint', '#0c0c10', '#181820', '#a3ff12');

/** Ancient Temple — free polished puzzle */
export const ancientTempleFree: GameFactory = () => {
  let grid: number[][] = [];
  let px = 0;
  let py = 5;
  let relics = 0;
  const reset = () => {
    grid = Array.from({ length: 6 }, () => Array.from({ length: 8 }, () => (Math.random() > 0.72 ? 1 : 0)));
    px = 0;
    py = 5;
    grid[5][0] = 0;
    grid[0][7] = 2;
    if (Math.random() > 0.4) grid[2][3] = 3;
  };
  reset();
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      const move = (dx: number, dy: number) => {
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
        if (grid[ny][nx] === 3) {
          relics += 1;
          grid[ny][nx] = 0;
          bumpScore(ctx, 80);
        }
        if (grid[ny][nx] === 2) {
          bumpScore(ctx, 150);
          reset();
        }
      };
      if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) {
        move(-1, 0);
        ctx.keys.delete('arrowleft');
        ctx.keys.delete('a');
      }
      if (ctx.keys.has('arrowright') || ctx.keys.has('d')) {
        move(1, 0);
        ctx.keys.delete('arrowright');
        ctx.keys.delete('d');
      }
      if (ctx.keys.has('arrowup') || ctx.keys.has('w')) {
        move(0, -1);
        ctx.keys.delete('arrowup');
        ctx.keys.delete('w');
      }
      if (ctx.keys.has('arrowdown') || ctx.keys.has('s')) {
        move(0, 1);
        ctx.keys.delete('arrowdown');
        ctx.keys.delete('s');
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#100808', '#181010');
      const cw = ctx.width / 8;
      const ch = ctx.height / 6;
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 8; x++) {
          const cell = grid[y][x];
          ctx.ctx.fillStyle =
            cell === 1 ? 'rgba(255,43,214,0.35)' : cell === 2 ? 'rgba(255,200,87,0.5)' : cell === 3 ? 'rgba(0,240,255,0.45)' : 'rgba(255,255,255,0.05)';
          ctx.ctx.fillRect(x * cw + 2, y * ch + 2, cw - 4, ch - 4);
        }
      ctx.ctx.fillStyle = '#00f0ff';
      ctx.ctx.fillRect(px * cw + 8, py * ch + 8, cw - 16, ch - 16);
      tip(ctx, `Ancient Temple · D-pad / drag · relics ${relics}`);
    },
  };
};

/** Number Master — 2048-like polished */
export const numberMaster: GameFactory = () => {
  let grid: number[] = Array(16).fill(0);
  const spawn = () => {
    const empty = grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    if (!empty.length) return false;
    grid[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
    return true;
  };
  const canMove = () => {
    for (let i = 0; i < 16; i++) {
      const v = grid[i];
      if (v === 0) return true;
      const x = i % 4;
      const y = Math.floor(i / 4);
      if (x < 3 && grid[i + 1] === v) return true;
      if (y < 3 && grid[i + 4] === v) return true;
    }
    return false;
  };
  const reset = () => {
    grid = Array(16).fill(0);
    spawn();
    spawn();
  };
  reset();
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      const rows = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [8, 9, 10, 11],
        [12, 13, 14, 15],
      ];
      const cols = [
        [0, 4, 8, 12],
        [1, 5, 9, 13],
        [2, 6, 10, 14],
        [3, 7, 11, 15],
      ];
      const apply = (lines: number[][], reverse: boolean) => {
        let moved = false;
        for (const line of lines) {
          const order = reverse ? [...line].reverse() : line;
          const vals = order.map((i) => grid[i]).filter((v) => v);
          const out: number[] = [];
          for (let i = 0; i < vals.length; i++) {
            if (vals[i] === vals[i + 1]) {
              const merged = vals[i] * 2;
              out.push(merged);
              bumpScore(ctx, merged);
              i += 1;
            } else out.push(vals[i]);
          }
          while (out.length < 4) out.push(0);
          order.forEach((idx, i) => {
            if (grid[idx] !== out[i]) moved = true;
            grid[idx] = out[i];
          });
        }
        if (moved) spawn();
        if (!grid.includes(0) && !canMove()) gameOver(ctx);
      };
      if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) {
        apply(rows, false);
        ctx.keys.delete('arrowleft');
        ctx.keys.delete('a');
      }
      if (ctx.keys.has('arrowright') || ctx.keys.has('d')) {
        apply(rows, true);
        ctx.keys.delete('arrowright');
        ctx.keys.delete('d');
      }
      if (ctx.keys.has('arrowup') || ctx.keys.has('w')) {
        apply(cols, false);
        ctx.keys.delete('arrowup');
        ctx.keys.delete('w');
      }
      if (ctx.keys.has('arrowdown') || ctx.keys.has('s')) {
        apply(cols, true);
        ctx.keys.delete('arrowdown');
        ctx.keys.delete('s');
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#0c1018', '#141c28');
      const cw = ctx.width / 4;
      const ch = ctx.height / 4;
      grid.forEach((v, i) => {
        const x = (i % 4) * cw;
        const y = Math.floor(i / 4) * ch;
        ctx.ctx.fillStyle = v ? `hsla(${200 - Math.log2(v) * 12},80%,55%,0.85)` : 'rgba(255,255,255,0.05)';
        ctx.ctx.fillRect(x + 6, y + 6, cw - 12, ch - 12);
        if (v) {
          ctx.ctx.fillStyle = '#fff';
          ctx.ctx.font = '700 22px Orbitron, sans-serif';
          ctx.ctx.fillText(String(v), x + cw * 0.35, y + ch * 0.55);
        }
      });
      tip(ctx, 'Number Master · Swipe / D-pad · 2048+');
    },
  };
};

/** Logic Blocks */
export const logicBlocks: GameFactory = () => {
  let target = [1, 2, 3, 4];
  let slots = [0, 0, 0, 0];
  let cursor = 0;
  let secret = false;
  const reset = () => {
    target = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    slots = [0, 0, 0, 0];
    cursor = 0;
    secret = false;
  };
  reset();
  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      if (ctx.keys.has('arrowleft')) {
        cursor = Math.max(0, cursor - 1);
        ctx.keys.delete('arrowleft');
      }
      if (ctx.keys.has('arrowright')) {
        cursor = Math.min(3, cursor + 1);
        ctx.keys.delete('arrowright');
      }
      if (ctx.keys.has(' ') || ctx.keys.has('arrowup')) {
        slots[cursor] = (slots[cursor] % 4) + 1;
        ctx.keys.delete(' ');
        ctx.keys.delete('arrowup');
        if (slots.every((v, i) => v === target[i])) {
          bumpScore(ctx, 100);
          if (Math.random() < 0.3) secret = true;
          reset();
        }
      }
      bumpScore(ctx, ctx.dt * 2);
    },
    draw(ctx) {
      clearNeon(ctx, '#081018', '#102030');
      const colors = ['#333', '#00f0ff', '#ff2bd6', '#a3ff12', '#ffc857'];
      slots.forEach((v, i) => {
        ctx.ctx.fillStyle = colors[v];
        ctx.ctx.fillRect(ctx.width * 0.15 + i * 90, ctx.height * 0.4, 70, 70);
        if (i === cursor) {
          ctx.ctx.strokeStyle = '#fff';
          ctx.ctx.strokeRect(ctx.width * 0.15 + i * 90 - 4, ctx.height * 0.4 - 4, 78, 78);
        }
      });
      secretToast(ctx, secret, 'Perfect Cipher');
      tip(ctx, 'Logic Blocks · Pads + JUMP to cycle');
    },
  };
};

/** Memory Match free */
export const memoryMatchFree: GameFactory = () => {
  let grid: number[] = [];
  let selected = -1;
  let wasDown = false;
  let pairs = 0;
  const size = 4;
  const reset = () => {
    grid = Array.from({ length: size * size }, (_, i) => Math.floor(i / 2) % 8);
    for (let i = grid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [grid[i], grid[j]] = [grid[j], grid[i]];
    }
    selected = -1;
    pairs = 0;
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
            pairs += 1;
            bumpScore(ctx, 50);
            if (grid.every((c) => c < 0)) bumpScore(ctx, 200);
          } else selected = idx;
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
      tip(ctx, `Memory Match · pairs ${pairs}`);
    },
  };
};

function actionArena(title: string, enemyColor: string): GameFactory {
  return () => {
    let px = 0.5;
    let py = 0.8;
    let bullets: { x: number; y: number }[] = [];
    let foes: { x: number; y: number }[] = [];
    let cd = 0;
    let cards = 0;
    let secret = false;
    const reset = () => {
      px = 0.5;
      py = 0.8;
      bullets = [];
      foes = [];
      cd = 0;
      secret = false;
    };
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        const sp = 0.5;
        if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) px -= sp * ctx.dt;
        if (ctx.keys.has('d') || ctx.keys.has('arrowright')) px += sp * ctx.dt;
        if (ctx.keys.has('w') || ctx.keys.has('arrowup')) py -= sp * ctx.dt;
        if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) py += sp * ctx.dt;
        px = clamp(px, 0.05, 0.95);
        py = clamp(py, 0.1, 0.92);
        cd -= ctx.dt;
        if ((ctx.keys.has(' ') || ctx.pointer.down) && cd <= 0) {
          bullets.push({ x: px, y: py - 0.04 });
          cd = 0.15;
        }
        bullets.forEach((b) => (b.y -= 0.9 * ctx.dt));
        bullets = bullets.filter((b) => b.y > -0.05);
        if (Math.random() < 0.045) foes.push({ x: rand(0.05, 0.95), y: -0.05 });
        if (Math.random() < 0.0012 && !secret) {
          secret = true;
          cards += 1;
          bumpScore(ctx, 220);
        }
        foes.forEach((f) => (f.y += 0.26 * ctx.dt));
        for (const f of foes) {
          for (const b of bullets) {
            if (Math.hypot(f.x - b.x, f.y - b.y) < 0.04) {
              f.y = 2;
              b.y = -1;
              bumpScore(ctx, 25);
              if (Math.random() < 0.1) cards += 1;
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
          ctx.ctx.fillStyle = enemyColor;
          ctx.ctx.beginPath();
          ctx.ctx.arc(f.x * ctx.width, f.y * ctx.height, 12, 0, Math.PI * 2);
          ctx.ctx.fill();
        });
        ctx.ctx.fillStyle = '#e8f7ff';
        ctx.ctx.fillRect(px * ctx.width - 12, py * ctx.height - 12, 24, 24);
        secretToast(ctx, secret, 'Hero Card');
        tip(ctx, `${title} · D-pad + FIRE · cards ${cards}`);
      },
    };
  };
}

export const zombieEscape = actionArena('Zombie Escape', '#7cff6b');
export const shadowNinja = actionArena('Shadow Ninja', '#ff2bd6');
export const alienAttack = actionArena('Alien Attack', '#a78bfa');
export const robotArena = actionArena('Robot Arena', '#ffc857');

function adventureExplore(title: string, accent: string): GameFactory {
  return () => {
    let px = 0.5;
    let py = 0.5;
    let treasures: { x: number; y: number; kind: string }[] = [];
    let hazards: { x: number; y: number }[] = [];
    let found = 0;
    let secretRoom = false;
    const reset = () => {
      px = 0.5;
      py = 0.5;
      treasures = [];
      hazards = [];
      found = 0;
      secretRoom = false;
    };
    return {
      update(ctx) {
        restart(ctx, reset);
        if (!ctx.alive) return;
        const sp = 0.38;
        if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) px -= sp * ctx.dt;
        if (ctx.keys.has('d') || ctx.keys.has('arrowright')) px += sp * ctx.dt;
        if (ctx.keys.has('w') || ctx.keys.has('arrowup')) py -= sp * ctx.dt;
        if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) py += sp * ctx.dt;
        px = clamp(px, 0.05, 0.95);
        py = clamp(py, 0.08, 0.92);
        bumpScore(ctx, ctx.dt * 8);
        if (Math.random() < 0.025) treasures.push({ x: rand(0.1, 0.9), y: rand(0.1, 0.9), kind: pickCollectible() });
        if (Math.random() < 0.02) hazards.push({ x: rand(0.1, 0.9), y: rand(0.1, 0.9) });
        if (Math.random() < 0.001 && !secretRoom) {
          secretRoom = true;
          bumpScore(ctx, 300);
          found += 3;
        }
        treasures = treasures.filter((t) => {
          if (Math.hypot(t.x - px, t.y - py) < 0.05) {
            found += 1;
            bumpScore(ctx, 35);
            return false;
          }
          return true;
        });
        hazards.forEach((h) => {
          h.x += (px - h.x) * 0.2 * ctx.dt;
          h.y += (py - h.y) * 0.2 * ctx.dt;
        });
        for (const h of hazards) {
          if (Math.hypot(h.x - px, h.y - py) < 0.045) gameOver(ctx);
        }
      },
      draw(ctx) {
        clearNeon(ctx, '#08140c', '#102818');
        if (secretRoom) {
          ctx.ctx.fillStyle = 'rgba(255,200,87,0.12)';
          ctx.ctx.fillRect(0, 0, ctx.width, ctx.height);
        }
        treasures.forEach((t) => {
          ctx.ctx.fillStyle = accent;
          ctx.ctx.fillRect(t.x * ctx.width - 7, t.y * ctx.height - 7, 14, 14);
        });
        hazards.forEach((h) => {
          ctx.ctx.fillStyle = '#ff4d4d';
          ctx.ctx.beginPath();
          ctx.ctx.arc(h.x * ctx.width, h.y * ctx.height, 10, 0, Math.PI * 2);
          ctx.ctx.fill();
        });
        ctx.ctx.fillStyle = '#00f0ff';
        ctx.ctx.fillRect(px * ctx.width - 11, py * ctx.height - 11, 22, 22);
        secretToast(ctx, secretRoom, 'Hidden Chamber');
        tip(ctx, `${title} · D-pad / drag · finds ${found}`);
      },
    };
  };
}

function pickCollectible() {
  return ['gem', 'coin', 'crystal', 'relic', 'card'][Math.floor(Math.random() * 5)];
}

export const jungleExplorer = adventureExplore('Jungle Explorer', '#a3ff12');
export const treasureHunter = adventureExplore('Treasure Hunter', '#ffc857');
export const lostKingdom = adventureExplore('Lost Kingdom', '#c084fc');
export const crystalQuest = adventureExplore('Crystal Quest', '#00f0ff');

export const FREE_GAME_FACTORIES: Record<string, { title: string; create: GameFactory; genre: string }> = {
  'pixel-runner': { title: 'Pixel Runner', create: pixelRunnerFree, genre: 'Arcade' },
  'galaxy-defender': { title: 'Galaxy Defender', create: galaxyDefender, genre: 'Arcade' },
  'brick-blast': { title: 'Brick Blast', create: brickBlast, genre: 'Arcade' },
  'snake-evolution': { title: 'Snake Evolution', create: snakeEvolutionFree, genre: 'Arcade' },
  'neon-drift': { title: 'Neon Drift', create: neonDrift, genre: 'Racing' },
  'desert-rally': { title: 'Desert Rally', create: desertRally, genre: 'Racing' },
  'mountain-racer': { title: 'Mountain Racer', create: mountainRacer, genre: 'Racing' },
  'street-sprint': { title: 'Street Sprint', create: streetSprint, genre: 'Racing' },
  'ancient-temple': { title: 'Ancient Temple', create: ancientTempleFree, genre: 'Puzzle' },
  'number-master': { title: 'Number Master', create: numberMaster, genre: 'Puzzle' },
  'logic-blocks': { title: 'Logic Blocks', create: logicBlocks, genre: 'Puzzle' },
  'memory-match': { title: 'Memory Match', create: memoryMatchFree, genre: 'Puzzle' },
  'zombie-escape': { title: 'Zombie Escape', create: zombieEscape, genre: 'Action' },
  'shadow-ninja': { title: 'Shadow Ninja', create: shadowNinja, genre: 'Action' },
  'alien-attack': { title: 'Alien Attack', create: alienAttack, genre: 'Action' },
  'robot-arena': { title: 'Robot Arena', create: robotArena, genre: 'Action' },
  'jungle-explorer': { title: 'Jungle Explorer', create: jungleExplorer, genre: 'Adventure' },
  'treasure-hunter': { title: 'Treasure Hunter', create: treasureHunter, genre: 'Adventure' },
  'lost-kingdom': { title: 'Lost Kingdom', create: lostKingdom, genre: 'Adventure' },
  'crystal-quest': { title: 'Crystal Quest', create: crystalQuest, genre: 'Adventure' },
};
