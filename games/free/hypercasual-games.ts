/**
 * Jgames Hyper-Casual originals
 * Color-sort boarding + frost survival management — mobile-first tap play.
 */
import {
  type GameFactory,
  type EngineContext,
  clearNeon,
  drawScore,
  bumpScore,
  gameOver,
  clamp,
} from '../engine/core';

const COLORS = ['#ff4d6d', '#ffd60a', '#70e000', '#4cc9f0', '#c77dff'] as const;
type Color = (typeof COLORS)[number];

function restart(ctx: EngineContext, reset: () => void) {
  if (!ctx.alive && ctx.keys.has('r')) {
    ctx.keys.delete('r');
    ctx.alive = true;
    ctx.score = 0;
    reset();
  }
}

function tip(ctx: EngineContext, text: string) {
  drawScore(ctx);
  ctx.ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.ctx.font = '11px Sora, sans-serif';
  ctx.ctx.fillText(text, 14, ctx.height - 14);
  if (!ctx.alive) {
    ctx.ctx.fillStyle = '#ff2bd6';
    ctx.ctx.font = '700 22px Orbitron, sans-serif';
    ctx.ctx.fillText('TRY AGAIN', ctx.width / 2 - 70, ctx.height / 2);
    ctx.ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.ctx.font = '12px Sora, sans-serif';
    ctx.ctx.fillText('Tap RESTART · or press R', ctx.width / 2 - 90, ctx.height / 2 + 28);
  }
}

function pickColor(n: number = COLORS.length): Color {
  return COLORS[Math.floor(Math.random() * Math.min(n, COLORS.length))];
}

function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function tapEdge(state: { wasDown: boolean }, ctx: EngineContext): boolean {
  const down = ctx.pointer.down;
  const edge = down && !state.wasDown;
  state.wasDown = down;
  return edge;
}

/** Color Bus Trip — sort passenger clusters into matching buses */
export const colorBusTrip: GameFactory = () => {
  type Bus = { color: Color; filled: number; cap: number; x: number; y: number; departing: number };
  type Crowd = { color: Color; count: number; x: number; y: number; selected: boolean };

  let level = 1;
  let buses: Bus[] = [];
  let crowds: Crowd[] = [];
  let goal = 6;
  let cleared = 0;
  let selectedCrowd = -1;
  let message = 'Tap a crowd, then tap its matching bus';
  let pulse = 0;
  const tap = { wasDown: false };

  const layout = () => {
    buses = [];
    crowds = [];
    selectedCrowd = -1;
    const busCount = clamp(3 + Math.floor(level / 2), 3, 5);
    const colors = COLORS.slice(0, busCount);
    for (let i = 0; i < busCount; i++) {
      buses.push({
        color: colors[i],
        filled: 0,
        cap: 4 + (level > 3 ? 1 : 0),
        x: 0.14 + i * (0.72 / Math.max(1, busCount - 1)),
        y: 0.28,
        departing: 0,
      });
    }
    const crowdCount = busCount * 2 + 1;
    for (let i = 0; i < crowdCount; i++) {
      crowds.push({
        color: colors[i % colors.length],
        count: 2 + Math.floor(Math.random() * 3),
        x: 0.12 + (i % 5) * 0.19,
        y: 0.62 + Math.floor(i / 5) * 0.16,
        selected: false,
      });
    }
    goal = busCount;
    cleared = 0;
    message = `Level ${level} · Fill ${goal} buses`;
  };

  const reset = () => {
    level = 1;
    layout();
  };
  layout();

  const hit = (px: number, py: number, x: number, y: number, r: number) => Math.hypot(px - x, py - y) < r;

  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      pulse += ctx.dt;
      buses.forEach((b) => {
        if (b.departing > 0) b.departing -= ctx.dt;
      });

      if (tapEdge(tap, ctx)) {
        const px = ctx.pointer.x / ctx.width;
        const py = ctx.pointer.y / ctx.height;

        let tappedBus = -1;
        buses.forEach((b, i) => {
          if (b.departing <= 0 && hit(px, py, b.x, b.y, 0.09)) tappedBus = i;
        });
        let tappedCrowd = -1;
        crowds.forEach((c, i) => {
          if (hit(px, py, c.x, c.y, 0.08)) tappedCrowd = i;
        });

        if (tappedCrowd >= 0) {
          crowds.forEach((c, i) => (c.selected = i === tappedCrowd));
          selectedCrowd = tappedCrowd;
          message = 'Now tap the matching bus';
          return;
        }

        if (tappedBus >= 0 && selectedCrowd >= 0) {
          const bus = buses[tappedBus];
          const crowd = crowds[selectedCrowd];
          if (!crowd || bus.departing > 0) return;
          if (crowd.color !== bus.color) {
            message = 'Wrong color — match the bus!';
            return;
          }
          const space = bus.cap - bus.filled;
          if (space <= 0) {
            message = 'Bus is full';
            return;
          }
          const move = Math.min(space, crowd.count);
          bus.filled += move;
          crowd.count -= move;
          bumpScore(ctx, move * 8);
          if (crowd.count <= 0) {
            crowds.splice(selectedCrowd, 1);
            selectedCrowd = -1;
            crowds.forEach((c) => (c.selected = false));
          }
          if (bus.filled >= bus.cap) {
            bus.departing = 0.55;
            cleared += 1;
            bumpScore(ctx, 40);
            message = `Bus departed · ${cleared}/${goal}`;
            bus.filled = 0;
            if (Math.random() < 0.35 && level > 2) bus.color = pickColor(buses.length);
          }
          if (cleared >= goal) {
            level += 1;
            bumpScore(ctx, 100);
            layout();
            message = `Level ${level} clear bonus!`;
          } else if (crowds.length === 0) {
            const colors = [...new Set(buses.map((b) => b.color))];
            for (let i = 0; i < 4; i++) {
              crowds.push({
                color: colors[i % colors.length],
                count: 2 + Math.floor(Math.random() * 3),
                x: 0.15 + (i % 4) * 0.22,
                y: 0.68 + Math.floor(i / 4) * 0.14,
                selected: false,
              });
            }
          }
        }
      }
    },
    draw(ctx) {
      const g = ctx.ctx.createLinearGradient(0, 0, 0, ctx.height);
      g.addColorStop(0, '#dfe3ea');
      g.addColorStop(1, '#b8c0cc');
      ctx.ctx.fillStyle = g;
      ctx.ctx.fillRect(0, 0, ctx.width, ctx.height);

      ctx.ctx.strokeStyle = '#9aa3b2';
      ctx.ctx.lineWidth = 28;
      ctx.ctx.lineCap = 'round';
      ctx.ctx.beginPath();
      ctx.ctx.moveTo(ctx.width * 0.08, ctx.height * 0.32);
      ctx.ctx.bezierCurveTo(
        ctx.width * 0.35,
        ctx.height * 0.18,
        ctx.width * 0.65,
        ctx.height * 0.45,
        ctx.width * 0.92,
        ctx.height * 0.3,
      );
      ctx.ctx.stroke();

      buses.forEach((b) => {
        const x = b.x * ctx.width;
        const y = b.y * ctx.height + (b.departing > 0 ? -40 * (1 - b.departing / 0.55) : 0);
        const w = 56;
        const h = 34;
        ctx.ctx.fillStyle = b.color;
        ctx.ctx.strokeStyle = '#1a1a22';
        ctx.ctx.lineWidth = 2;
        roundRect(ctx.ctx, x - w / 2, y - h / 2, w, h, 10);
        ctx.ctx.fill();
        ctx.ctx.stroke();
        ctx.ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < 3; i++) ctx.ctx.fillRect(x - 18 + i * 14, y - 8, 10, 8);
        ctx.ctx.fillStyle = '#111';
        ctx.ctx.font = '700 11px Sora, sans-serif';
        ctx.ctx.fillText(`${b.filled}/${b.cap}`, x - 12, y + 22);
      });

      crowds.forEach((c) => {
        const x = c.x * ctx.width;
        const y = c.y * ctx.height;
        if (c.selected) {
          ctx.ctx.strokeStyle = '#111';
          ctx.ctx.lineWidth = 3;
          ctx.ctx.beginPath();
          ctx.ctx.arc(x, y, 28 + Math.sin(pulse * 6) * 2, 0, Math.PI * 2);
          ctx.ctx.stroke();
        }
        for (let i = 0; i < c.count; i++) {
          const ox = ((i % 3) - 1) * 10;
          const oy = Math.floor(i / 3) * -10;
          ctx.ctx.fillStyle = c.color;
          ctx.ctx.beginPath();
          ctx.ctx.arc(x + ox, y + oy, 9, 0, Math.PI * 2);
          ctx.ctx.fill();
          ctx.ctx.fillStyle = '#222';
          ctx.ctx.fillRect(x + ox - 2, y + oy + 8, 2, 6);
          ctx.ctx.fillRect(x + ox + 2, y + oy + 8, 2, 6);
        }
      });

      ctx.ctx.fillStyle = '#1a1a22';
      ctx.ctx.font = '700 14px Orbitron, sans-serif';
      ctx.ctx.fillText(`Buses ${cleared}/${goal}`, 16, 28);
      ctx.ctx.font = '12px Sora, sans-serif';
      ctx.ctx.fillStyle = '#333a48';
      ctx.ctx.fillText(message, 16, 48);
      tip(ctx, 'Color Bus Trip · Tap crowd → matching bus');
    },
  };
};

/** Frost Outpost — arctic survival management with conveyors */
export const frostOutpost: GameFactory = () => {
  let wood = 8;
  let food = 5;
  let warmth = 70;
  let day = 1;
  let coins = 0;
  let conveyor: { t: number; kind: 'food' | 'wood' }[] = [];
  let spawn = 0;
  let freeze = 0;
  let workerX = 0.5;
  let message = 'Tap trees & ice for wood/food · keep warmth up';
  const tap = { wasDown: false };

  const nodes = [
    { id: 'tree', x: 0.22, y: 0.42, kind: 'wood' as const, cd: 0 },
    { id: 'tree2', x: 0.78, y: 0.38, kind: 'wood' as const, cd: 0 },
    { id: 'sausage', x: 0.35, y: 0.62, kind: 'food' as const, cd: 0 },
    { id: 'sausage2', x: 0.68, y: 0.66, kind: 'food' as const, cd: 0 },
    { id: 'fire', x: 0.5, y: 0.52, kind: 'fire' as const, cd: 0 },
  ];

  const reset = () => {
    wood = 8;
    food = 5;
    warmth = 70;
    day = 1;
    coins = 0;
    conveyor = [];
    spawn = 0;
    freeze = 0;
    workerX = 0.5;
    message = 'Tap resources · feed the fire';
    nodes.forEach((n) => (n.cd = 0));
  };

  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;

      const cold = 4 + day * 0.6;
      warmth -= cold * ctx.dt;
      spawn += ctx.dt;

      if (ctx.keys.has('arrowleft') || ctx.keys.has('a')) workerX -= 0.45 * ctx.dt;
      if (ctx.keys.has('arrowright') || ctx.keys.has('d')) workerX += 0.45 * ctx.dt;
      workerX = clamp(workerX, 0.15, 0.85);

      nodes.forEach((n) => {
        if (n.cd > 0) n.cd -= ctx.dt;
      });

      if (tapEdge(tap, ctx)) {
        const px = ctx.pointer.x / ctx.width;
        const py = ctx.pointer.y / ctx.height;
        for (const n of nodes) {
          if (Math.hypot(px - n.x, py - n.y) < 0.08 && n.cd <= 0) {
            if (n.kind === 'wood') {
              wood += 2;
              n.cd = 1.1;
              conveyor.push({ t: 0, kind: 'wood' });
              bumpScore(ctx, 4);
              message = 'Wood loaded on conveyor';
            } else if (n.kind === 'food') {
              food += 2;
              n.cd = 1.2;
              conveyor.push({ t: 0, kind: 'food' });
              bumpScore(ctx, 5);
              message = 'Food on the belt';
            } else if (n.kind === 'fire') {
              if (wood >= 2) {
                wood -= 2;
                warmth = clamp(warmth + 22, 0, 100);
                bumpScore(ctx, 10);
                message = 'Fire roaring';
              } else {
                message = 'Need 2 wood for the fire';
              }
            }
            workerX = n.x;
            break;
          }
        }
        if (py > 0.88 && px > 0.7 && food >= 1) {
          food -= 1;
          warmth = clamp(warmth + 12, 0, 100);
          message = 'Hot meal — warmth up';
        }
      }

      conveyor.forEach((c) => (c.t += ctx.dt * 0.35));
      const arrived = conveyor.filter((c) => c.t >= 1);
      arrived.forEach(() => {
        coins += 1;
        bumpScore(ctx, 3);
      });
      conveyor = conveyor.filter((c) => c.t < 1);

      if (spawn > 18) {
        spawn = 0;
        day += 1;
        food = Math.max(0, food - 1);
        message = `Night ${day} · colder now`;
      }

      if (warmth <= 0) {
        freeze += ctx.dt;
        if (freeze > 1.2) gameOver(ctx);
      } else freeze = 0;

      if (food <= 0 && warmth < 25) message = 'Critical — gather food & stoke fire!';
    },
    draw(ctx) {
      const sky = ctx.ctx.createLinearGradient(0, 0, 0, ctx.height);
      sky.addColorStop(0, '#9ec9e8');
      sky.addColorStop(0.45, '#e8f2fa');
      sky.addColorStop(1, '#d9e6ef');
      ctx.ctx.fillStyle = sky;
      ctx.ctx.fillRect(0, 0, ctx.width, ctx.height);

      ctx.ctx.fillStyle = '#f4f8fc';
      ctx.ctx.fillRect(0, ctx.height * 0.35, ctx.width, ctx.height * 0.65);
      ctx.ctx.fillStyle = '#6ec3ff';
      ctx.ctx.fillRect(0, ctx.height * 0.22, ctx.width, 28);

      ctx.ctx.fillStyle = '#4a5568';
      ctx.ctx.fillRect(ctx.width * 0.15, ctx.height * 0.55, ctx.width * 0.7, 16);
      ctx.ctx.fillStyle = '#718096';
      for (let i = 0; i < 10; i++) {
        ctx.ctx.fillRect(ctx.width * 0.18 + i * 28, ctx.height * 0.55, 12, 16);
      }

      conveyor.forEach((c) => {
        const x = ctx.width * (0.18 + c.t * 0.64);
        const y = ctx.height * 0.52;
        if (c.kind === 'food') {
          ctx.ctx.fillStyle = '#e85d4c';
          roundRect(ctx.ctx, x - 14, y - 10, 28, 14, 6);
          ctx.ctx.fill();
        } else {
          ctx.ctx.fillStyle = '#8b5a2b';
          ctx.ctx.fillRect(x - 10, y - 8, 20, 12);
        }
      });

      nodes.forEach((n) => {
        const x = n.x * ctx.width;
        const y = n.y * ctx.height;
        if (n.kind === 'wood') {
          ctx.ctx.fillStyle = '#2f6b3a';
          ctx.ctx.beginPath();
          ctx.ctx.moveTo(x, y - 28);
          ctx.ctx.lineTo(x + 18, y + 8);
          ctx.ctx.lineTo(x - 18, y + 8);
          ctx.ctx.fill();
          ctx.ctx.fillStyle = '#6b3f1d';
          ctx.ctx.fillRect(x - 4, y + 8, 8, 14);
        } else if (n.kind === 'food') {
          ctx.ctx.fillStyle = '#e85d4c';
          roundRect(ctx.ctx, x - 18, y - 10, 36, 18, 8);
          ctx.ctx.fill();
          ctx.ctx.fillStyle = '#fff8';
          ctx.ctx.fillRect(x - 10, y - 4, 8, 6);
        } else {
          const glow = warmth > 40 ? '#ff7a18' : '#ffb703';
          ctx.ctx.fillStyle = glow;
          ctx.ctx.beginPath();
          ctx.ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.ctx.fill();
          ctx.ctx.fillStyle = '#5c3317';
          ctx.ctx.fillRect(x - 18, y + 10, 36, 8);
        }
        if (n.cd > 0) {
          ctx.ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.ctx.beginPath();
          ctx.ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.ctx.fill();
        }
      });

      ctx.ctx.fillStyle = '#2563eb';
      ctx.ctx.fillRect(workerX * ctx.width - 8, ctx.height * 0.48 - 18, 16, 22);
      ctx.ctx.fillStyle = '#dc2626';
      ctx.ctx.fillRect(workerX * ctx.width - 8, ctx.height * 0.48 - 24, 16, 8);

      const chips = [
        [`Wood ${wood}`, '#8b5a2b'],
        [`Food ${food}`, '#e85d4c'],
        [`Warmth ${Math.floor(warmth)}`, warmth > 35 ? '#ff7a18' : '#ef4444'],
        [`Day ${day}`, '#334155'],
        [`Coins ${coins}`, '#16a34a'],
      ];
      chips.forEach((c, i) => {
        ctx.ctx.fillStyle = 'rgba(255,255,255,0.85)';
        roundRect(ctx.ctx, 12 + i * 78, 10, 72, 22, 8);
        ctx.ctx.fill();
        ctx.ctx.fillStyle = c[1];
        ctx.ctx.font = '700 10px Sora, sans-serif';
        ctx.ctx.fillText(c[0], 18 + i * 78, 25);
      });

      ctx.ctx.fillStyle = 'rgba(15,23,42,0.75)';
      roundRect(ctx.ctx, ctx.width - 110, ctx.height - 44, 98, 32, 10);
      ctx.ctx.fill();
      ctx.ctx.fillStyle = '#fff';
      ctx.ctx.font = '11px Sora, sans-serif';
      ctx.ctx.fillText('Eat (+warm)', ctx.width - 98, ctx.height - 24);

      ctx.ctx.fillStyle = '#0f172a';
      ctx.ctx.font = '12px Sora, sans-serif';
      ctx.ctx.fillText(message, 14, ctx.height - 18);
      tip(ctx, 'Frost Outpost · Tap to gather · feed the fire');
    },
  };
};

/** Traffic Color Sort — merge same-color cars into exit lanes */
export const trafficColorSort: GameFactory = () => {
  type Car = { color: Color; x: number; y: number };
  let cars: Car[] = [];
  let exits: { color: Color; x: number }[] = [];
  let selected = -1;
  let level = 1;
  let cleared = 0;
  const tap = { wasDown: false };

  const setup = () => {
    const n = clamp(3 + Math.floor(level / 2), 3, 5);
    exits = COLORS.slice(0, n).map((color, i) => ({ color, x: 0.15 + i * (0.7 / Math.max(1, n - 1)) }));
    cars = [];
    for (let i = 0; i < n * 3; i++) {
      cars.push({
        color: exits[i % n].color,
        x: 0.12 + (i % 6) * 0.14,
        y: 0.55 + Math.floor(i / 6) * 0.14,
      });
    }
    selected = -1;
    cleared = 0;
  };
  setup();

  return {
    update(ctx) {
      restart(ctx, () => {
        level = 1;
        setup();
      });
      if (!ctx.alive) return;

      if (tapEdge(tap, ctx)) {
        const px = ctx.pointer.x / ctx.width;
        const py = ctx.pointer.y / ctx.height;
        let hitCar = -1;
        cars.forEach((c, i) => {
          if (Math.hypot(px - c.x, py - c.y) < 0.07) hitCar = i;
        });
        let hitExit = -1;
        exits.forEach((e, i) => {
          if (Math.hypot(px - e.x, py - 0.22) < 0.08) hitExit = i;
        });
        if (hitCar >= 0) {
          selected = hitCar;
          return;
        }
        if (hitExit >= 0 && selected >= 0) {
          const car = cars[selected];
          const exit = exits[hitExit];
          if (car && car.color === exit.color) {
            bumpScore(ctx, 15);
            cleared += 1;
            cars.splice(selected, 1);
            selected = -1;
            if (cars.length === 0) {
              level += 1;
              bumpScore(ctx, 80);
              setup();
            }
          }
        }
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#1e293b', '#0f172a');
      ctx.ctx.fillStyle = '#334155';
      ctx.ctx.fillRect(0, ctx.height * 0.15, ctx.width, ctx.height * 0.2);
      exits.forEach((e) => {
        ctx.ctx.fillStyle = e.color;
        roundRect(ctx.ctx, e.x * ctx.width - 28, ctx.height * 0.16, 56, 40, 8);
        ctx.ctx.fill();
        ctx.ctx.fillStyle = '#fff';
        ctx.ctx.font = '10px Sora, sans-serif';
        ctx.ctx.fillText('EXIT', e.x * ctx.width - 14, ctx.height * 0.22);
      });
      cars.forEach((c, i) => {
        const x = c.x * ctx.width;
        const y = c.y * ctx.height;
        ctx.ctx.fillStyle = c.color;
        roundRect(ctx.ctx, x - 16, y - 10, 32, 20, 5);
        ctx.ctx.fill();
        if (i === selected) {
          ctx.ctx.strokeStyle = '#fff';
          ctx.ctx.lineWidth = 2;
          ctx.ctx.strokeRect(x - 18, y - 12, 36, 24);
        }
      });
      tip(ctx, `Traffic Color Sort · Lv ${level} · cleared ${cleared}`);
    },
  };
};

/** Belt Kitchen — tap stations to cook and ship orders on a conveyor */
export const beltKitchen: GameFactory = () => {
  let prep = 0;
  let cooked = 0;
  let orders = 0;
  let belt: { t: number }[] = [];
  let timer = 45;
  let message = 'Tap Prep → Cook → Ship';
  const tap = { wasDown: false };

  const reset = () => {
    prep = 0;
    cooked = 0;
    orders = 0;
    belt = [];
    timer = 45;
    message = 'Tap Prep → Cook → Ship';
  };

  return {
    update(ctx) {
      restart(ctx, reset);
      if (!ctx.alive) return;
      timer -= ctx.dt;
      belt.forEach((b) => (b.t += ctx.dt * 0.4));
      const done = belt.filter((b) => b.t >= 1);
      if (done.length) {
        orders += done.length;
        bumpScore(ctx, done.length * 20);
        message = `Shipped! Orders ${orders}`;
      }
      belt = belt.filter((b) => b.t < 1);

      if (tapEdge(tap, ctx)) {
        const px = ctx.pointer.x / ctx.width;
        const py = ctx.pointer.y / ctx.height;
        if (py > 0.55 && py < 0.78) {
          if (px < 0.33) {
            prep += 1;
            message = 'Ingredients ready';
          } else if (px < 0.66) {
            if (prep > 0) {
              prep -= 1;
              cooked += 1;
              bumpScore(ctx, 5);
              message = 'Cooking…';
            } else message = 'Need prep first';
          } else if (cooked > 0) {
            cooked -= 1;
            belt.push({ t: 0 });
            message = 'On the belt';
          } else message = 'Nothing to ship';
        }
      }
      if (timer <= 0) {
        if (orders < 8) gameOver(ctx);
        else {
          bumpScore(ctx, 50);
          timer = 45;
          message = 'Shift extended!';
        }
      }
    },
    draw(ctx) {
      clearNeon(ctx, '#1a1020', '#2a1830');
      ctx.ctx.fillStyle = '#3f3f46';
      ctx.ctx.fillRect(ctx.width * 0.1, ctx.height * 0.35, ctx.width * 0.8, 22);
      belt.forEach((b) => {
        const x = ctx.width * (0.12 + b.t * 0.76);
        ctx.ctx.fillStyle = '#fbbf24';
        roundRect(ctx.ctx, x - 12, ctx.height * 0.33, 24, 16, 4);
        ctx.ctx.fill();
      });
      const stations = [
        { label: `Prep ${prep}`, color: '#34d399' },
        { label: `Cook ${cooked}`, color: '#fb7185' },
        { label: 'Ship →', color: '#60a5fa' },
      ];
      stations.forEach((s, i) => {
        const x = ctx.width * (0.1 + i * 0.28);
        ctx.ctx.fillStyle = s.color;
        roundRect(ctx.ctx, x, ctx.height * 0.58, ctx.width * 0.24, 70, 14);
        ctx.ctx.fill();
        ctx.ctx.fillStyle = '#0f172a';
        ctx.ctx.font = '700 14px Sora, sans-serif';
        ctx.ctx.fillText(s.label, x + 16, ctx.height * 0.58 + 40);
      });
      ctx.ctx.fillStyle = '#fff';
      ctx.ctx.font = '12px Sora, sans-serif';
      ctx.ctx.fillText(`Orders ${orders} · Time ${Math.ceil(timer)}s · ${message}`, 16, 28);
      tip(ctx, 'Belt Kitchen · Tap stations in order');
    },
  };
};

export const HYPERCASUAL_FACTORIES: Record<string, { title: string; create: GameFactory; genre: string }> = {
  'color-bus-trip': { title: 'Color Bus Trip', create: colorBusTrip, genre: 'Puzzle' },
  'frost-outpost': { title: 'Frost Outpost', create: frostOutpost, genre: 'Adventure' },
  'traffic-color-sort': { title: 'Traffic Color Sort', create: trafficColorSort, genre: 'Puzzle' },
  'belt-kitchen': { title: 'Belt Kitchen', create: beltKitchen, genre: 'Arcade' },
};
