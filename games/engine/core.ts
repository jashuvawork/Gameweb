/**
 * JASHUVA Universal Game Engine
 * Drop a folder into /games/<slug> with manifest + createGame factory.
 * Scales toward 10,000+ titles via registry discovery.
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

export function createEngine(
  canvas: HTMLCanvasElement,
  factory: GameFactory,
  hooks?: { onScore?: (n: number) => void; onGameOver?: (n: number) => void },
) {
  const ctx2d = canvas.getContext('2d');
  if (!ctx2d) throw new Error('Canvas unsupported');

  const keys = new Set<string>();
  const pointer = { x: 0, y: 0, down: false };
  let raf = 0;
  let last = performance.now();
  let running = true;

  const resize = () => {
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || 800;
    const h = Math.min(560, Math.max(360, Math.floor(w * 0.56)));
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
    if (down) keys.add(e.key.toLowerCase());
    else keys.delete(e.key.toLowerCase());
  };
  const kd = (e: KeyboardEvent) => onKey(e, true);
  const ku = (e: KeyboardEvent) => onKey(e, false);
  const move = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  };
  const down = (e: PointerEvent) => {
    pointer.down = true;
    move(e);
  };
  const up = () => {
    pointer.down = false;
  };

  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);

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
      game.destroy?.();
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
