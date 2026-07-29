/**
 * JASHUVA Universal Game Engine
 * Drop a folder into /games/<slug> with manifest + createGame factory.
 * Scales toward 10,000+ titles via registry discovery.
 * Touch / tablet: virtual keys + canvas drag steering.
 */

export type EngineContext = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  score: number;
  alive: boolean;
  keys: Set<string>;
  pointer: { x: number; y: number; down: boolean };
  dt: number;
  time: number;
  onScore?: (score: number) => void;
  onGameOver?: (score: number) => void;
};

export type GameFactory = (ctx: EngineContext) => {
  update: (ctx: EngineContext) => void;
  draw: (ctx: EngineContext) => void;
  destroy?: () => void;
};

export type GameModule = {
  slug: string;
  title: string;
  create: GameFactory;
};

export type EngineHandle = {
  stop: () => void;
  press: (key: string) => void;
  release: (key: string) => void;
  releaseAll: () => void;
  getAlive: () => boolean;
  getScore: () => number;
};

type KeySource = 'keyboard' | 'virtual' | 'canvas';

export function createEngine(
  canvas: HTMLCanvasElement,
  factory: GameFactory,
  hooks?: { onScore?: (n: number) => void; onGameOver?: (n: number) => void },
): EngineHandle {
  const ctx2d = canvas.getContext('2d');
  if (!ctx2d) throw new Error('Canvas unsupported');

  const keys = new Set<string>();
  const sources: Record<KeySource, Set<string>> = {
    keyboard: new Set(),
    virtual: new Set(),
    canvas: new Set(),
  };
  const pointer = { x: 0, y: 0, down: false };
  let dragOrigin: { x: number; y: number } | null = null;
  let canvasLatchedDir: 'left' | 'right' | 'up' | 'down' | null = null;
  let raf = 0;
  let last = performance.now();
  let running = true;

  const rebuildKeys = () => {
    keys.clear();
    for (const set of Object.values(sources)) {
      for (const k of set) keys.add(k);
    }
  };

  const setSourceKey = (source: KeySource, key: string, down: boolean) => {
    const k = key.toLowerCase();
    if (down) sources[source].add(k);
    else sources[source].delete(k);
    rebuildKeys();
  };

  const clearSource = (source: KeySource) => {
    sources[source].clear();
    rebuildKeys();
  };

  const resize = () => {
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || 800;
    const narrow = w < 720;
    // Taller playfield on phones so controls sit below without crushing the game
    const h = narrow
      ? Math.min(440, Math.max(280, Math.floor(w * 0.85)))
      : Math.min(560, Math.max(360, Math.floor(w * 0.56)));
    canvas.width = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx2d.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  };
  resize();

  const engineCtx: EngineContext = {
    canvas,
    ctx: ctx2d,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    score: 0,
    alive: true,
    keys,
    pointer,
    dt: 0,
    time: 0,
    onScore: hooks?.onScore,
    onGameOver: hooks?.onGameOver,
  };

  const game = factory(engineCtx);

  const onKey = (e: KeyboardEvent, down: boolean) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
      e.preventDefault();
    }
    setSourceKey('keyboard', e.key, down);
  };
  const kd = (e: KeyboardEvent) => onKey(e, true);
  const ku = (e: KeyboardEvent) => onKey(e, false);

  const syncCanvasSteer = () => {
    if (!pointer.down || !dragOrigin) {
      clearSource('canvas');
      canvasLatchedDir = null;
      return;
    }
    const dx = pointer.x - dragOrigin.x;
    const dy = pointer.y - dragOrigin.y;
    const dead = 28;
    let dir: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(dx) > dead || Math.abs(dy) > dead) {
      if (Math.abs(dx) >= Math.abs(dy)) dir = dx < 0 ? 'left' : 'right';
      else dir = dy < 0 ? 'up' : 'down';
    }
    // Latch direction for this gesture so swipe puzzles don't repeat every move event,
    // while continuous movers still see held keys from the first latch.
    if (dir === canvasLatchedDir) return;
    canvasLatchedDir = dir;
    clearSource('canvas');
    if (!dir) return;
    const map = {
      left: ['arrowleft', 'a'],
      right: ['arrowright', 'd'],
      up: ['arrowup', 'w'],
      down: ['arrowdown', 's'],
    } as const;
    for (const k of map[dir]) setSourceKey('canvas', k, true);
  };

  const move = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    if (pointer.down) syncCanvasSteer();
  };
  const down = (e: PointerEvent) => {
    e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    pointer.down = true;
    dragOrigin = { x: pointer.x, y: pointer.y };
    clearSource('canvas');
  };
  const up = (e?: PointerEvent) => {
    pointer.down = false;
    dragOrigin = null;
    canvasLatchedDir = null;
    clearSource('canvas');
    if (e) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointerdown', down, { passive: false });
  canvas.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);

  const loop = (now: number) => {
    if (!running) return;
    engineCtx.dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    engineCtx.time += engineCtx.dt;
    engineCtx.width = canvas.clientWidth;
    engineCtx.height = canvas.clientHeight;
    game.update(engineCtx);
    game.draw(engineCtx);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      game.destroy?.();
    },
    press(key: string) {
      setSourceKey('virtual', key, true);
    },
    release(key: string) {
      setSourceKey('virtual', key, false);
    },
    releaseAll() {
      clearSource('virtual');
    },
    getAlive() {
      return engineCtx.alive;
    },
    getScore() {
      return Math.floor(engineCtx.score);
    },
  };
}

export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function clearNeon(ctx: EngineContext, top = '#05050a', bottom = '#0a1220') {
  const g = ctx.ctx.createLinearGradient(0, 0, 0, ctx.height);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.ctx.fillStyle = g;
  ctx.ctx.fillRect(0, 0, ctx.width, ctx.height);
}

export function drawScore(ctx: EngineContext) {
  ctx.ctx.fillStyle = 'rgba(0,240,255,0.9)';
  ctx.ctx.font = '600 16px Sora, sans-serif';
  ctx.ctx.fillText(`Score ${Math.floor(ctx.score)}`, 16, 28);
}

export function bumpScore(ctx: EngineContext, amount: number) {
  ctx.score += amount;
  ctx.onScore?.(Math.floor(ctx.score));
}

export function gameOver(ctx: EngineContext) {
  if (!ctx.alive) return;
  ctx.alive = false;
  ctx.onGameOver?.(Math.floor(ctx.score));
}
